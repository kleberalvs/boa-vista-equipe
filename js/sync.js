/* Sincronização com a nuvem (Supabase), login, instalação e atualização do app.
   Cada colaborador, pasta, anotação e registro do histórico é um "registro" separado no banco.
   Cada aparelho envia só o que mudou e recebe só o que os outros mudaram. Em conflito, vale a última gravação. */
const CFG = window.BVC_CFG || {};
const CLOUD = !!(CFG.url && CFG.key && window.supabase);
const APPV = '2026.10.28-14';
const REC = /type=recovery/.test(location.hash), RECERR = /error_code=|error=access_denied/.test(location.hash);
let SB = null, SES = null, synced = {}, pushing = false, again = false, tmr = null, chan = null, DEF = null;
try { synced = JSON.parse(localStorage.getItem('bvc_synced') || '{}'); } catch (e) { synced = {}; }
const persistSynced = () => { try { localStorage.setItem('bvc_synced', JSON.stringify(synced)); } catch (e) {} };

/* JSON com chaves em ordem fixa: o banco reordena as chaves, então comparar texto puro daria falsas diferenças */
function cj(o) {
  if (o === null || typeof o !== 'object') return JSON.stringify(o);
  if (Array.isArray(o)) return '[' + o.map(cj).join(',') + ']';
  return '{' + Object.keys(o).filter(k => o[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + cj(o[k])).join(',') + '}';
}
const cfgRec = () => ({ amb: db.amb, cg: db.cg || {}, v: db.v || 0, m3: db.m3 || 0, m4: db.m4 || 0 });
function recs() {
  const m = {};
  db.p.forEach(p => m['p:' + p.id] = p);
  db.n.f.forEach(f => m['f:' + f.id] = f);
  db.n.i.forEach(i => m['i:' + i.id] = i);
  (db.log || []).forEach(e => m['l:' + e.id] = e);
  m['c:cfg'] = cfgRec();
  m['b:brand'] = db.brand || {};
  return m;
}
function getRec(k) {
  const id = k.slice(2), f = a => (a || []).find(x => x.id == id);
  switch (k[0]) { case 'p': return f(db.p); case 'f': return f(db.n.f); case 'i': return f(db.n.i); case 'l': return f(db.log); case 'c': return cfgRec(); case 'b': return db.brand || {}; }
}
const fsort = (a, b) => a.id == 'geral' ? -1 : b.id == 'geral' ? 1 : (a.t || 0) - (b.t || 0);
function put(arr, x) { const o = arr.find(q => q.id == x.id); if (o) { Object.keys(o).forEach(k => delete o[k]); Object.assign(o, x); } else arr.push(x); }
function place(d, kind, x) {
  if (kind == 'p') put(d.p, x);
  else if (kind == 'f') { put(d.n.f, x); d.n.f.sort(fsort); }
  else if (kind == 'i') put(d.n.i, x);
  else if (kind == 'l') { put(d.log, x); d.log.sort((a, b) => a.t - b.t); }
  else if (kind == 'c') { d.amb = x.amb || []; d.cg = x.cg || {}; if (x.v) d.v = x.v; d.m3 = x.m3 || 0; d.m4 = x.m4 || 0; }
  else if (kind == 'b') d.brand = x || {};
}
function drop(d, kind, id) {
  const f = a => a.filter(q => q.id != id);
  if (kind == 'p') d.p = f(d.p); else if (kind == 'f') d.n.f = f(d.n.f); else if (kind == 'i') d.n.i = f(d.n.i); else if (kind == 'l') d.log = f(d.log);
}

/* indicador no topo */
function setSync(s, t) {
  const txt = t || { local: 'Modo local', ok: 'Sincronizado', busy: 'Sincronizando…', pend: 'Alterações pendentes', off: 'Offline', err: 'Falha ao sincronizar' }[s];
  const cls = 'chip ' + ({ ok: 'g', busy: 'b', pend: 'o', off: 'o', err: 'r' }[s] || '');
  ['#sync', '#sync2'].forEach(id => { const e = $(id); if (e) { e.className = cls; e.textContent = txt; } });
  const sb = $('#sbar'); if (sb) { sb.hidden = !['off', 'pend', 'err'].includes(s); sb.textContent = txt; sb.className = s == 'err' ? 'e' : ''; }
  setSync.last = [s, t];
}
function pendentes() {
  const cur = recs(); let n = 0;
  for (const k in cur) if (k[0] != 'l' && synced[k] !== cj(cur[k])) n++;
  n += Object.keys(synced).filter(k => k[0] != 'l' && !(k in cur)).length;
  return n;
}
const offTxt = () => { const n = pendentes(); return 'Offline · ' + (n ? n + (n == 1 ? ' alteração' : ' alterações') + ' a enviar' : 'salvo no aparelho'); };
function refresh() {
  try { applyBrand(); } catch (e) {}
  const ae = document.activeElement;
  if (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName) && $('#main').contains(ae)) return;
  render(1);
}

/* envio */
function schedPush() {
  if (!CLOUD || !SES) return;
  setSync(navigator.onLine ? 'pend' : 'off', navigator.onLine ? null : offTxt());
  clearTimeout(tmr); tmr = setTimeout(push, 1200);
}
async function push() {
  if (!CLOUD || !SES) return;
  if (!navigator.onLine) { setSync('off', offTxt()); return; }
  if (pushing) { again = true; return; }
  pushing = true; setSync('busy', 'Enviando…');
  try {
    const cur = recs(), up = [], js = {};
    for (const k in cur) { const j = cj(cur[k]); if (synced[k] !== j) { up.push(k); js[k] = j; } }
    const del = Object.keys(synced).filter(k => !(k in cur));
    for (let i = 0; i < up.length; i += 200) {
      const ch = up.slice(i, i + 200);
      const { error } = await SB.from('records').upsert(ch.map(k => ({ kind: k[0], id: k.slice(2), data: cur[k] })), { onConflict: 'kind,id' });
      if (error) throw error;
      ch.forEach(k => synced[k] = js[k]);
    }
    const by = {};
    del.forEach(k => (by[k[0]] = by[k[0]] || []).push(k.slice(2)));
    for (const kd in by) for (let i = 0; i < by[kd].length; i += 200) {
      const ids = by[kd].slice(i, i + 200);
      const { error } = await SB.from('records').delete().eq('kind', kd).in('id', ids);
      if (error) throw error;
      ids.forEach(id => delete synced[kd + ':' + id]);
    }
    persistSynced(); setSync('ok');
  } catch (e) {
    console.warn('push', e); setSync('err', 'Falha ao enviar · tentando de novo'); setTimeout(schedPush, 15000);
  } finally { pushing = false; if (again) { again = false; schedPush(); } }
}

/* recebimento */
async function fetchAll() {
  let all = [], from = 0;
  for (;;) {
    const { data, error } = await SB.from('records').select('kind,id,data').order('updated_at', { ascending: true }).order('kind').order('id').range(from, from + 999);
    if (error) throw error;
    all = all.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return all;
}
async function pull() {
  const rows = await fetchAll(), rm = {};
  rows.forEach(r => rm[r.kind + ':' + r.id] = r.data);
  let first = !Object.keys(synced).length;
  if (!rows.length && !first) { synced = {}; first = true; }   /* nuvem esvaziada por fora: sobe de novo o que existe aqui */
  if (first && rows.length && (!db.p.length || confirm('A nuvem já tem dados. Substituir os dados deste aparelho pelos da nuvem?'))) {
    const n = { v: 0, amb: [], cg: {}, p: [], n: { f: [], i: [] }, log: [], brand: {} };
    rows.forEach(r => place(n, r.kind, r.data));
    if (!n.n.f.some(f => f.id == 'geral')) n.n.f.unshift({ id: 'geral', name: 'Geral', par: null });
    db = mig(n); synced = {};
    rows.forEach(r => synced[r.kind + ':' + r.id] = cj(r.data));
    persistSynced(); cache(); refresh(); return;
  }
  const cur = recs(), cj_ = {};
  for (const k in cur) cj_[k] = cj(cur[k]);
  for (const k in rm) {
    const rj = cj(rm[k]), lj = cj_[k];
    if (lj === rj) { synced[k] = rj; continue; }
    if (lj === undefined) { if (synced[k] === undefined) { place(db, k[0], rm[k]); synced[k] = rj; } continue; }   /* se já existia e sumiu aqui, foi apagado neste aparelho */
    if (synced[k] === lj) { place(db, k[0], rm[k]); synced[k] = rj; }                                              /* aqui não mudou: vale o da nuvem */
    /* senão: mudou aqui, vale a edição deste aparelho e ela será enviada */
  }
  for (const k in synced) {
    if (k in rm) continue;
    if (k in cj_) { if (synced[k] === cj_[k]) { drop(db, k[0], k.slice(2)); delete synced[k]; } }                  /* apagado em outro aparelho */
    else delete synced[k];
  }
  persistSynced(); cache(); refresh(); schedPush();
}
async function pullSafe() { try { await pull(); } catch (e) { console.warn('pull', e); } }

/* tempo real */
function subscribe() {
  if (chan) return;
  chan = SB.channel('bvc-records').on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, onChange).subscribe();
}
function onChange(pl) {
  let ch = false;
  if (pl.eventType == 'DELETE') {
    const o = pl.old || {}, k = o.kind + ':' + o.id, l = o.kind ? getRec(k) : null;
    if (l && (synced[k] === undefined || cj(l) === synced[k])) { drop(db, o.kind, o.id); ch = true; }
    delete synced[k];
  } else {
    const r = pl.new, k = r.kind + ':' + r.id, l = getRec(k), rj = cj(r.data);
    if (l && cj(l) === rj) { synced[k] = rj; persistSynced(); return; }
    if (l && synced[k] !== undefined && cj(l) !== synced[k]) return;
    place(db, r.kind, r.data); synced[k] = rj; ch = true;
  }
  persistSynced();
  if (ch) { cache(); refresh(); }
}

/* login */
const unlock = () => document.documentElement.classList.remove('lock');
async function start() {
  if (!CLOUD) { unlock(); setSync('local'); return; }
  if (!SB) SB = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: REC } });
  let s = null;
  try { s = (await SB.auth.getSession()).data.session; } catch (e) {}
  if (REC && s) { history.replaceState(null, '', location.pathname + location.search); return showReset(); }
  if (RECERR) history.replaceState(null, '', location.pathname + location.search);
  if (s) return enter(s);
  if (!REC && !RECERR && localStorage.getItem('bvc_who') && await semRede()) return modoOffline();
  showLogin();
}
/* sem internet (ou sinal tão fraco que o servidor não responde): usa os dados do aparelho e tenta de novo sozinho */
let retryT = null;
async function semRede() {
  if (!navigator.onLine) return true;
  try { await fetch(CFG.url + '/auth/v1/health', { mode: 'no-cors', cache: 'no-store', signal: window.AbortSignal && AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined }); return false; }
  catch (e) { return true; }
}
function modoOffline() {
  WHO = localStorage.getItem('bvc_who') || ''; unlock();
  const l = $('#login'); if (l) l.remove();
  setSync('off', offTxt());
  if (!retryT) retryT = setInterval(() => { if (SES) { clearInterval(retryT); retryT = null; } else start(); }, 15000);
}
async function enter(s) {
  SES = s; WHO = (s.user && s.user.email) || '';
  try { localStorage.setItem('bvc_who', WHO); } catch (e) {}
  unlock(); const l = $('#login'); if (l) l.remove();
  const sb = $('#shbtn'); if (sb) sb.hidden = false;
  setSync('busy', 'Sincronizando…');
  try { subscribe(); } catch (e) { console.warn('realtime', e); }
  try { await pull(); setSync('ok'); }
  catch (e) { console.warn(e); setSync(navigator.onLine ? 'err' : 'off', navigator.onLine ? 'Falha ao sincronizar' : 'Offline'); }
  schedPush();
}
function showLogin() {
  if ($('#login')) return;
  const d = document.createElement('div'); d.id = 'login';
  d.innerHTML = `<form class="card"><img src="assets/logo.png" alt="Boa Vista Corporate"><h1 style="font-size:26px;margin:20px 0 4px">Entrar</h1><p class="sub" style="margin:0 0 16px">Acesso restrito à equipe da administração.</p><div class="f" style="grid-template-columns:1fr"><label>E-mail<input type="email" id="lg_e" autocomplete="username" required></label><label>Senha<input type="password" id="lg_s" autocomplete="current-password" required></label></div><button class="b" style="width:100%" id="lg_b">Entrar</button><p id="lg_m" class="sub" style="margin:12px 0 0;color:var(--c-r)"></p><button type="button" id="lg_f" class="b s" style="width:100%;margin-top:10px">Esqueci minha senha</button></form>`;
  if (RECERR) d.querySelector('#lg_m').textContent = 'O link de redefinição é inválido ou expirou. Peça um novo em "Esqueci minha senha".';
  document.body.appendChild(d);
  $('#lg_f').onclick = async () => {
    const em = $('#lg_e').value.trim(), m = $('#lg_m'), b = $('#lg_f');
    m.style.color = 'var(--c-r)';
    if (!em) { m.textContent = 'Digite seu e-mail no campo acima e toque em "Esqueci minha senha".'; $('#lg_e').focus(); return; }
    if (!navigator.onLine) { m.textContent = 'Sem conexão com a internet.'; return; }
    b.disabled = true; m.textContent = '';
    try {
      const { error } = await SB.auth.resetPasswordForEmail(em, { redirectTo: location.origin + location.pathname });
      if (error) throw error;
      m.style.color = 'var(--mut)'; m.textContent = 'Se este e-mail estiver cadastrado, enviamos um link para criar uma nova senha. Confira também a caixa de spam.';
      let n = 60; b.textContent = 'Reenviar em ' + n + 's';
      const t = setInterval(() => { n--; if (n <= 0) { clearInterval(t); b.disabled = false; b.textContent = 'Esqueci minha senha'; } else b.textContent = 'Reenviar em ' + n + 's'; }, 1000);
    } catch (e) {
      b.disabled = false;
      m.textContent = /rate|limit|seconds/i.test(e.message || '') ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' : 'Não foi possível enviar o e-mail agora. Tente novamente.';
    }
  };
  d.querySelector('form').onsubmit = async ev => {
    ev.preventDefault();
    const b = $('#lg_b'); b.disabled = true; b.textContent = 'Entrando…'; $('#lg_m').textContent = '';
    try {
      const { data, error } = await SB.auth.signInWithPassword({ email: $('#lg_e').value.trim(), password: $('#lg_s').value });
      if (error) throw error;
      await enter(data.session);
    } catch (e) {
      b.disabled = false; b.textContent = 'Entrar';
      $('#lg_m').textContent = /invalid|credentials/i.test(e.message || '') ? 'E-mail ou senha incorretos.' : (navigator.onLine ? 'Não foi possível entrar: ' + (e.message || 'erro') : 'Sem conexão com a internet.');
    }
  };
}
function showReset() {
  const o = $('#login'); if (o) o.remove();
  const d = document.createElement('div'); d.id = 'login';
  d.innerHTML = `<form class="card"><img id="rlogo" class="def" src="assets/logo.png" alt="Boa Vista Corporate"><h1 style="font-size:26px;margin:20px 0 4px">Nova senha</h1><p class="sub" style="margin:0 0 16px">Crie uma nova senha para a sua conta.</p><div class="f" style="grid-template-columns:1fr"><label>Nova senha (mínimo 8 caracteres)<input type="password" id="rs_a" autocomplete="new-password" minlength="8" required></label><label>Repita a nova senha<input type="password" id="rs_b" autocomplete="new-password" minlength="8" required></label></div><button class="b" style="width:100%" id="rs_s">Salvar nova senha</button><p id="rs_m" class="sub" style="margin:12px 0 0;color:var(--c-r)"></p></form>`;
  document.body.appendChild(d);
  d.querySelector('form').onsubmit = async ev => {
    ev.preventDefault();
    const a = $('#rs_a').value, m = $('#rs_m'), b = $('#rs_s');
    if (a.length < 8) { m.textContent = 'A senha precisa ter pelo menos 8 caracteres.'; return; }
    if (a !== $('#rs_b').value) { m.textContent = 'As senhas não são iguais.'; return; }
    b.disabled = true; b.textContent = 'Salvando…'; m.textContent = '';
    try {
      const { error } = await SB.auth.updateUser({ password: a });
      if (error) throw error;
      const s = (await SB.auth.getSession()).data.session;
      toast('Senha alterada'); d.remove();
      if (s) await enter(s); else showLogin();
    } catch (e) {
      b.disabled = false; b.textContent = 'Salvar nova senha';
      m.textContent = /different|same/i.test(e.message || '') ? 'Use uma senha diferente da anterior.' : /weak|short|least/i.test(e.message || '') ? 'Senha fraca. Use pelo menos 8 caracteres, com letras e números.' : 'Não foi possível salvar. Peça um novo link em "Esqueci minha senha".';
    }
  };
}
async function sair() {
  if (!CLOUD) return;
  const cur = recs(); let n = 0;
  for (const k in cur) if (synced[k] !== cj(cur[k])) n++;
  n += Object.keys(synced).filter(k => !(k in cur)).length;
  if (!confirm(n ? 'Há ' + n + ' alteração(ões) ainda não enviada(s) para a nuvem. Elas serão perdidas neste aparelho. Sair mesmo assim?' : 'Sair desta conta? Os dados continuam salvos na nuvem.')) return;
  try { await SB.auth.signOut(); } catch (e) {}
  ['bvc_db', 'bvc_synced', 'bvc_who'].forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
  location.reload();
}

/* opções, instalação e atualização */
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); DEF = e; });
const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function comoInstalar() {
  const ua = navigator.userAgent, ios = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1), and = /android/i.test(ua);
  const passos = ios ? ['Abra este endereço no <b>Safari</b> (o Chrome do iPhone não instala).', 'Toque no botão <b>Compartilhar</b> (quadrado com uma seta para cima).', 'Role e toque em <b>Adicionar à Tela de Início</b>.', 'Toque em <b>Adicionar</b>. O ícone aparece na tela inicial.']
    : and ? ['Abra este endereço no <b>Chrome</b>.', 'Toque no menu <b>⋮</b> (três pontinhos, no canto superior).', 'Toque em <b>Instalar aplicativo</b> (ou <b>Adicionar à tela inicial</b>).', 'Confirme em <b>Instalar</b>. O ícone aparece na tela inicial.']
    : ['Use o <b>Chrome</b> ou o <b>Edge</b>.', 'Clique no ícone de instalar na barra de endereço (um monitor com uma seta), ou no menu <b>⋮</b> → <b>Instalar Colaboradores</b>.', 'Confirme em <b>Instalar</b>.'];
  const o = modal(`<h2>Instalar o aplicativo</h2><p class="sub" style="margin:0 0 12px">${ios ? 'No iPhone ou iPad' : and ? 'No Android' : 'No computador'}:</p><ol style="padding-left:22px;line-height:1.8">${passos.map(x => '<li>' + x + '</li>').join('')}</ol><div class="tools" style="margin-top:16px"><button class="b s" onclick="this.closest('.ov').remove()">Fechar</button></div>`);
  return o;
}
window.addEventListener('appinstalled', () => { DEF = null; });
function opcoes() {
  const o = modal(`<h2>Opções</h2>
<div class="row"><div class="t"><b>Conta</b><br><small>${CLOUD ? esc(WHO || '—') : 'Modo local: os dados ficam só neste aparelho'}</small></div><span class="chip" id="sync2"></span></div>
${instalado() ? '<div class="row" style="margin-top:12px"><div class="t"><b>Aplicativo instalado</b><br><small>Este aparelho já usa o Colaboradores como aplicativo.</small></div><span class="chip g">Instalado</span></div>' : '<div class="row" style="margin-top:12px"><div class="t"><b>Instalar no celular ou computador</b><br><small>Deixa o Colaboradores como um aplicativo na tela inicial, sem precisar de loja.</small></div><button class="b" id="inst">Instalar aplicativo</button></div>'}
<div class="tools" style="margin-top:16px"><button class="b" onclick="bk()">Baixar backup</button><button class="b s" onclick="$('#imp').click()">Importar backup</button></div>
${opAparencia()}
${CLOUD ? '<div class="tools" style="margin-top:18px"><button class="b d" onclick="sair()">Sair desta conta</button></div>' : ''}
<div class="tools" style="margin-top:14px"><button class="b s" onclick="this.closest(\'.ov\').remove()">Fechar</button><small>Versão ${APPV.startsWith('__') ? 'de desenvolvimento' : APPV}</small></div>`);
  const [s, t] = setSync.last || ['local']; setSync(s, t);
  const i = $('#inst'); if (i) i.onclick = async () => { if (DEF) { DEF.prompt(); try { await DEF.userChoice; } catch (e) {} DEF = null; o.remove(); } else { o.remove(); comoInstalar(); } };
}
function avisoAtualizar() {
  if ($('#upd')) return;
  const d = document.createElement('div'); d.id = 'upd';
  d.innerHTML = 'Nova versão disponível <button class="b" style="padding:6px 14px">Atualizar</button>';
  d.querySelector('button').onclick = () => location.reload();
  document.body.appendChild(d);
}
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (w) w.addEventListener('statechange', () => { if (w.state == 'installed' && navigator.serviceWorker.controller) avisoAtualizar(); });
    });
    setInterval(() => reg.update().catch(() => {}), 3600e3);
  }).catch(() => {});
}

addEventListener('online', () => { if (!CLOUD || SHARE_T) return; if (!SES) start(); else { try { subscribe(); } catch (e) {} pullSafe(); schedPush(); } });
addEventListener('offline', () => { if (CLOUD) setSync('off', offTxt()); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && SES && navigator.onLine) pullSafe(); });
setInterval(() => { if (SES && !document.hidden && navigator.onLine) pullSafe(); }, 60000);
applyTheme(); applyBrand(); buildTabbar();
(function () { const s = $('#splash'); if (!s) return; const f = () => { s.classList.add('out'); setTimeout(() => s.remove(), 700); }; s.onclick = f; setTimeout(f, SHARE_T ? 0 : 1500); })();
if (SHARE_T) verCompartilhado(SHARE_T); else start();
