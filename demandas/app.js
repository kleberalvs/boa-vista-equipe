/* Demandas · Boa Vista Corporate
   PWA para o gestor cadastrar a equipe e as demandas de cada departamento,
   e para os colaboradores concluírem com fotos, observações e feedbacks.
   Dados e login: Supabase (mesmo projeto do painel de Colaboradores). */
'use strict';

const APPV = '2026.10.29-10';
const DOMINIO = '@demandas.bvc.app';
const BUCKET = 'demandas-fotos';
const VAPID = 'BCTPmnPt7iJP_eJGL5fBUFuyBb9gcxdSXONE6Zwq1OWuyYGHQ5tmPVcRDn6rP1ObkYDnxcXeA4MlC88DL-sAmX4';   // chave pública das notificações (a privada fica só no Supabase)
const CFG = window.BVC_CFG || {};
const TABELAS = ['dm_execucoes', 'dm_demandas', 'dm_feedbacks', 'dm_comentarios', 'dm_perfis', 'dm_departamentos'];
const CORES = ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#30b0c7', '#ff2d55', '#5856d6', '#a2845e', '#8e8e93'];
const LOCAIS = ['Térreo', 'Recepção', '1º andar', '2º andar', '3º andar', '4º andar', '5º andar', '6º andar', '7º andar', '8º andar', 'Todos os andares', 'Banheiros', 'Copa', 'Escadas', 'Elevadores', 'Garagem', 'Fachada'];
const TIPOS_FB = { sugestao: ['Sugestão', '#007aff'], problema: ['Problema', '#ff3b30'], material: ['Falta de material', '#ff9500'], elogio: ['Elogio', '#34c759'], outro: ['Outro', '#8e8e93'] };
const SEM = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const SEM1 = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const S = {
  sb: null, user: null, me: null, montado: false,
  perfis: [], deps: [], dem: [], exe: [], fb: [],
  ex: {}, pend: {}, fila: [], urls: {}, msgs: [],
  tab: 'hoje', dia: null, f: {}, titulo: '', anim: true,
  rasc: null, fd: null, fu: null, ff: null, fdp: null, conversa: null, hist: null, bip: null
};

/* ---------------- ícones ---------------- */
const P = {
  sino: '<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  hoje: '<circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.8 2.8L16.2 9.8"/>',
  lista: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.6" cy="6.5" r=".6"/><circle cx="4.6" cy="12" r=".6"/><circle cx="4.6" cy="17.5" r=".6"/>',
  hist: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5"/><path d="M3.5 3.5v5h5"/><path d="M12 7.5V12l3 2"/>',
  equipe: '<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20c.6-3.5 3.1-5.4 6.2-5.4s5.6 1.9 6.2 5.4"/><path d="M15.8 4.8a3.4 3.4 0 0 1 0 6.4M18 14.9c1.9.6 3 2.3 3.3 5.1"/>',
  fb: '<path d="M4.5 4.5h15a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H11l-4.5 3.5V17h-2A1.5 1.5 0 0 1 3 15.5V6a1.5 1.5 0 0 1 1.5-1.5z"/><path d="M7.5 9h9M7.5 12.5h6"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  camera: '<path d="M4 7.5h3l1.8-2.5h6.4L17 7.5h3a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.4" r="3.6"/>',
  chev: '<path d="M9 5l7 7-7 7"/>', chevL: '<path d="M15 5l-7 7 7 7"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  pin: '<path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  relogio: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  pessoa: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c.8-3.9 3.8-6 7.5-6s6.7 2.1 7.5 6"/>',
  enviar: '<path d="M12 19V5.5M6.5 11L12 5.5 17.5 11"/>',
  desfazer: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  lixo: '<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  arquivo: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V9M10 13h4"/>',
  copiar: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  share: '<path d="M12 3.5v11.5M8 7.5l4-4 4 4"/><path d="M5.5 11.5v7.5a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-7.5"/>',
  chave: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16 7l2.5 2.5M13.5 9.5l2 2"/>',
  sair: '<path d="M14.5 4h3A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-3M10 16.5L5.5 12 10 7.5M5.5 12H15"/>',
  print: '<path d="M7 9V3.5h10V9"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/>',
  baixar: '<path d="M12 4v11.5M7 11l5 5 5-5M5 20h14"/>',
  foto: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.7"/><path d="M21 15.5l-5-5-9 9"/>',
  alerta: '<path d="M12 4.2l8.8 15.3H3.2z"/><path d="M12 10v4.2M12 17v.3"/>',
  repetir: '<path d="M4 11.5A7.5 7.5 0 0 1 17.5 7L20 9.5M20 4.5v5h-5M20 12.5A7.5 7.5 0 0 1 6.5 17L4 14.5M4 19.5v-5h5"/>',
  painel: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
  tag: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.3 7.3a1 1 0 0 1-1.4 0z"/><circle cx="8" cy="8" r="1.4"/>',
  ok: '<circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.8 2.8L16.2 9.8"/>',
  zap: '<path d="M13 3L5 13.5h6L10.5 21 19 10.5h-6z"/>'
};
const ic = (n, c = '') => `<svg class="i ${c}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

/* ---------------- utilidades ---------------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const p2 = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const hoje = () => iso(new Date());
const dIso = s => new Date(s + 'T12:00:00');
const addDias = (s, n) => { const d = dIso(s); d.setDate(d.getDate() + n); return iso(d); };
const isoDe = ts => iso(new Date(ts));
const hora = ts => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const fmtLonga = s => { const t = dIso(s).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }); return t.charAt(0).toUpperCase() + t.slice(1); };
const fmtCurta = s => dIso(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const fmtDataHora = ts => `${fmtCurta(isoDe(ts))} às ${hora(ts)}`;
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const gestor = () => S.me && S.me.papel === 'gestor';
const donoPainel = () => gestor() && S.me.login.includes('@');   // conta do painel (proprietário): vê tudo
const dep = id => S.deps.find(d => d.id === id);
const perfil = id => S.perfis.find(p => p.id === id);
const dem = id => S.dem.find(d => d.id === id);
const depsDe = d => (d && Array.isArray(d.departamentos) && d.departamentos.length ? d.departamentos : d ? [d.departamento_id] : []).filter(id => dep(id));
const temDep = (d, id) => depsDe(d).includes(id);
const chipsDeps = d => depsDe(d).map(id => `<span class="chip c" style="--c:${corDep(id)}">${esc(dep(id).nome)}</span>`).join('');
const primeiroNome = n => String(n || '').trim().split(/\s+/)[0] || '—';
const nomeDe = id => { const p = perfil(id); return p ? p.nome : 'Ex-colaborador'; };
const ini = n => { const w = String(n || '?').trim().split(/\s+/); return ((w[0] || '?')[0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase(); };
const corDep = id => (dep(id) || {}).cor || '#8e8e93';
const corPessoa = p => !p ? '#8e8e93' : p.papel === 'gestor' ? '#1c1c1e' : corDep((p.departamentos || [])[0]);
const loginVisivel = p => p.login.includes('@') ? p.login : '@' + p.login;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function diasTxt(a) {
  const v = [...(a || [])].sort((x, y) => x - y), s = v.join(',');
  if (s === '0,1,2,3,4,5,6') return 'Todos os dias';
  if (s === '1,2,3,4,5') return 'Seg a Sex';
  if (s === '1,2,3,4,5,6') return 'Seg a Sáb';
  if (s === '0,6') return 'Fins de semana';
  if (!v.length) return 'Nenhum dia';
  return v.map(d => SEM[d]).join(', ');
}
function prazoTxt(p) {
  if (!p) return 'Sem prazo';
  const h = hoje();
  if (p === h) return 'Hoje';
  if (p === addDias(h, 1)) return 'Amanhã';
  if (p === addDias(h, -1)) return 'Ontem';
  return dIso(p).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
}
function saudacao() { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
function slug(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, ''); }
function gerarSenha() { const a = new Uint32Array(1); crypto.getRandomValues(a); return String(100000 + a[0] % 900000); }

function erroTxt(e) {
  const m = String((e && (e.message || e.error_description || e.msg)) || e || 'Erro desconhecido');
  if (/Invalid login credentials/i.test(m)) return 'Usuário ou senha incorretos.';
  if (/banned/i.test(m)) return 'Este acesso foi desativado. Fale com o gestor.';
  if (/Failed to fetch|NetworkError|Load failed|network|fetch/i.test(m)) return 'Sem conexão com a internet.';
  if (/reaberta/i.test(m) && /does not exist|schema cache|could not find/i.test(m)) return 'Falta ativar "reabrir mantém as fotos" no banco: rode a atualização 5 no Supabase (supabase/atualizacao-5-reabrir-mantem-fotos.sql).';
  if (/departamentos/i.test(m) && /does not exist|schema cache|could not find/i.test(m)) return 'Falta ativar vários departamentos no banco: rode a atualização 4 no Supabase (supabase/atualizacao-4-varios-departamentos.sql).';
  if (/dm_demandas_departamento_id_fkey/i.test(m)) return 'Este departamento ainda tem demandas. Mova ou exclua as demandas antes.';
  if (/row-level security|permission denied/i.test(m)) return 'Você não tem permissão para isso.';
  if (/Password should be at least|at least 6/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/same.*password|different from the old/i.test(m)) return 'A nova senha precisa ser diferente da atual.';
  if (/duplicate key.*dm_departamentos_nome/i.test(m)) return 'Já existe um departamento com esse nome.';
  return m.replace(/^.*?ERROR:\s*/, '');
}
const rede = e => !navigator.onLine || /Failed to fetch|NetworkError|Load failed|network|fetch|timeout/i.test(String((e && (e.message || e.name)) || e));
const faltaBanco = e => e && (/PGRST20[25]|42P01|42883/.test(String(e.code)) || /Could not find the (table|function)|does not exist/i.test(String(e.message)));

let tT;
function toast(msg, acao) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>` + (acao ? `<button>${esc(acao.txt)}</button>` : '');
  if (acao) t.querySelector('button').onclick = () => { t.classList.remove('on'); acao.fn(); };
  t.classList.add('on');
  clearTimeout(tT);
  tT = setTimeout(() => t.classList.remove('on'), acao ? 7000 : 2800);
}

function perguntar(titulo, msg, ok = 'OK', perigo = false) {
  return new Promise(res => {
    const d = document.createElement('div');
    d.className = 'alertbg';
    d.innerHTML = `<div class="alert" role="alertdialog"><b>${esc(titulo)}</b>${msg ? `<p>${esc(msg)}</p>` : ''}<div class="ab"><button data-v="0">Cancelar</button><button data-v="1" class="${perigo ? 'red' : ''}"><b>${esc(ok)}</b></button></div></div>`;
    d.onclick = e => { const b = e.target.closest('button'); if (!b && e.target !== d) return; d.remove(); res(!!b && b.dataset.v === '1'); };
    document.body.appendChild(d);
  });
}

/* ---------------- fila offline (IndexedDB) ---------------- */
const IDB = {
  db: null,
  abrir() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((ok, err) => {
      const r = indexedDB.open('bvc-demandas', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('fila', { keyPath: 'id' });
      r.onsuccess = () => { this.db = r.result; ok(r.result); };
      r.onerror = () => err(r.error);
    });
  },
  async tx(modo, fn) {
    const db = await this.abrir();
    return new Promise((ok, err) => {
      const t = db.transaction('fila', modo); const req = fn(t.objectStore('fila'));
      t.oncomplete = () => ok(req && req.result); t.onerror = () => err(t.error);
    });
  },
  // Fotos guardadas como bytes (o Safari em aba anônima não aceita guardar arquivos de imagem).
  // Se o aparelho não deixar guardar nada, a conclusão fica na memória e é enviada na hora.
  async todos() {
    let l = [];
    try { l = (await this.tx('readonly', s => s.getAll())) || []; } catch (e) { }
    l = l.map(i => ({ ...i, blobs: (i.blobs || []).map(b => b && b.buf ? new Blob([b.buf], { type: b.type || 'image/jpeg' }) : b) }));
    const ids = new Set(l.map(i => i.id));
    return [...l, ...[...MEM.values()].filter(i => !ids.has(i.id))];
  },
  async por(i) {
    try {
      const blobs = await Promise.all((i.blobs || []).map(async b => b instanceof Blob ? { buf: await b.arrayBuffer(), type: b.type || 'image/jpeg' } : b));
      await this.tx('readwrite', s => s.put({ ...i, blobs }));
      MEM.delete(i.id); return 'aparelho';
    } catch (e) { MEM.set(i.id, i); return 'memoria'; }
  },
  async tirar(id) { MEM.delete(id); try { await this.tx('readwrite', s => s.delete(id)); } catch (e) { } }
};
const MEM = new Map();

async function lerFila() {
  Object.values(S.pend).forEach(p => (p.fotos || []).forEach(u => URL.revokeObjectURL(u)));
  S.fila = S.user ? (await IDB.todos()).filter(i => i.uid === S.user.id) : [];
  S.pend = {};
  for (const it of S.fila) S.pend[it.rec.demanda_id + '|' + it.rec.ref] = { ...it.rec, fotos: it.blobs.map(b => URL.createObjectURL(b)), _pend: true, _fila: it.id };
}
const feito = (id, ref) => S.ex[id + '|' + ref] || S.pend[id + '|' + ref] || null;

let enviando = false;
async function enviarFila() {
  if (enviando || !S.sb || !S.user || !navigator.onLine) return;
  enviando = true;
  let mudou = false;
  try {
    const itens = (await IDB.todos()).filter(i => i.uid === S.user.id);
    for (const it of itens) {
      const fotos = [];
      try {
        const mes = (it.rec.ref === 'unica' ? isoDe(it.rec.concluida_em) : it.rec.ref).slice(0, 7);
        for (let i = 0; i < it.blobs.length; i++) {
          const path = `${S.user.id}/${mes}/${it.id}-${i + 1}.jpg`;
          const { error } = await S.sb.storage.from(BUCKET).upload(path, it.blobs[i], { contentType: 'image/jpeg', upsert: true });
          if (error) throw error;
          fotos.push(path);
        }
        const { error } = await S.sb.from('dm_execucoes').insert({ ...it.rec, fotos });
        if (error) {
          if (error.code === '23505' && /pkey/.test(error.message)) { /* já tinha sido enviada */ }
          else if (error.code === '23505') { await S.sb.storage.from(BUCKET).remove(fotos); toast(`“${it.rec.titulo}” já tinha sido concluída por outra pessoa.`); }
          else throw error;
        }
        await IDB.tirar(it.id); mudou = true;
      } catch (e) {
        if (rede(e)) break;
        it.tent = (it.tent || 0) + 1;
        if (it.tent >= 4) { await IDB.tirar(it.id); mudou = true; toast(`Não foi possível enviar “${it.rec.titulo}”: ${erroTxt(e)}`); }
        else { await IDB.por(it); toast('Erro ao enviar conclusão: ' + erroTxt(e)); }
        break;
      }
    }
  } finally {
    enviando = false;
    await lerFila();
    if (mudou) await recarregar(true); else render();
  }
}

/* ---------------- fotos ---------------- */
async function comprimir(file, max = 1280, q = 0.7) {   // ~150–250 KB por foto, nítida na tela do celular
  let img;
  try { img = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch (e) { img = await new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = URL.createObjectURL(file); }); }
  const w = img.width, h = img.height, s = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise(ok => c.toBlob(ok, 'image/jpeg', q));
}
function escolherFotos(max, fn) {
  const inp = $('#fotoIn');
  inp.multiple = max > 1; inp.value = '';
  inp.onchange = async () => {
    const arqs = [...inp.files].slice(0, max);
    if (!arqs.length) return;
    toast(arqs.length > 1 ? 'Preparando fotos…' : 'Preparando foto…');
    const out = [];
    for (const f of arqs) { try { const b = await comprimir(f); if (b) out.push({ blob: b, url: URL.createObjectURL(b) }); } catch (e) { toast('Não consegui abrir uma das fotos.'); } }
    $('#toast').classList.remove('on');
    fn(out);
  };
  inp.click();
}
const imgFoto = (p, extra = '') => /^(blob:|data:|https?:)/.test(p) ? `<img src="${esc(p)}" alt="" ${extra}>` : `<img data-foto="${esc(p)}" alt="" ${extra}>`;
async function hidratarFotos(raiz = document) {
  const els = [...raiz.querySelectorAll('img[data-foto]:not([src])')];
  if (!els.length) return;
  const falta = [...new Set(els.map(e => e.dataset.foto).filter(p => !S.urls[p] || S.urls[p].exp < Date.now()))];
  if (falta.length && navigator.onLine) {
    try {
      const { data } = await S.sb.storage.from(BUCKET).createSignedUrls(falta, 6 * 3600);
      (data || []).forEach(r => { if (r.signedUrl) S.urls[r.path] = { u: r.signedUrl, exp: Date.now() + 5 * 3600e3 }; });
    } catch (e) { /* sem internet */ }
  }
  els.forEach(e => { const u = S.urls[e.dataset.foto]; if (u) e.src = u.u; });
}
let VW = null;
function verFoto(el) {
  const box = el.closest('[data-gal]');
  const imgs = [...box.querySelectorAll('img')].filter(i => i.src);
  const i = Math.max(0, imgs.indexOf(el.tagName === 'IMG' ? el : el.querySelector('img')));
  VW = { l: imgs.map(x => x.src), i };
  mostrarFoto(); $('#viewer').classList.add('on');
}
function mostrarFoto() {
  if (!VW || !VW.l.length) return;
  $('#vimg').src = VW.l[VW.i];
  $('#vcnt').textContent = VW.l.length > 1 ? `${VW.i + 1} de ${VW.l.length}` : '';
  $('#viewer .prev').hidden = $('#viewer .next').hidden = VW.l.length < 2;
}
function passarFoto(n) { if (!VW) return; VW.i = (VW.i + n + VW.l.length) % VW.l.length; mostrarFoto(); }
function fecharFoto() { $('#viewer').classList.remove('on'); VW = null; }

/* ---------------- dados ---------------- */
function indexar() {
  S.ex = {};
  for (const e of S.exe) if (!e.reaberta_em) S.ex[e.demanda_id + '|' + e.ref] = e;
  S.me = S.user ? perfil(S.user.id) || S.me : null;
}
function salvarCache() {
  try { localStorage.setItem('dm_cache', JSON.stringify({ uid: S.user.id, t: Date.now(), d: { perfis: S.perfis, deps: S.deps, dem: S.dem, exe: S.exe, fb: S.fb } })); } catch (e) { /* sem espaço */ }
}
function lerCache() { try { const c = JSON.parse(localStorage.getItem('dm_cache') || 'null'); return c && S.user && c.uid === S.user.id ? c : null; } catch (e) { return null; } }

async function carregar() {
  const desde = new Date(Date.now() - 45 * 864e5).toISOString();
  const sb = S.sb;
  const r = await Promise.all([
    sb.from('dm_perfis').select('*').order('nome'),
    sb.from('dm_departamentos').select('*').order('ordem').order('nome'),
    sb.from('dm_demandas').select('*').order('criado_em'),
    sb.from('dm_execucoes').select('*').or(`ref.eq.unica,concluida_em.gte.${desde}`).order('concluida_em', { ascending: false }).limit(4000),
    sb.from('dm_feedbacks').select('*').order('criado_em', { ascending: false }).limit(300)
  ]);
  for (const x of r) if (x.error) throw x.error;
  [S.perfis, S.deps, S.dem, S.exe, S.fb] = r.map(x => x.data || []);
  indexar(); salvarCache(); S.carregadoEm = Date.now();
}
let tRec;
function recarregar(ja) {
  clearTimeout(tRec);
  return new Promise(ok => {
    tRec = setTimeout(async () => {
      try {
        await carregar();
        if (S.me && !S.me.ativo) { telaSemAcesso(true); return ok(); }
        render(); if (S.rasc && $('#sheet').classList.contains('on') && S.folhaTipo === 'item') atualizarItem();
      } catch (e) { if (!rede(e)) console.warn(e); render(); }
      ok();
    }, ja ? 0 : 450);
  });
}

function realtime() {
  if (S.ch || !S.sb) return;
  S.ch = S.sb.channel('dm-' + S.user.id);
  for (const t of TABELAS) S.ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, p => aoMudar(t, p));
  S.ch.subscribe();
}
function aoMudar(t, p) {
  const n = p.new || {};
  if (t === 'dm_execucoes' && p.eventType === 'INSERT' && n.concluida_por !== S.user.id && gestor())
    toast(`${primeiroNome(nomeDe(n.concluida_por))} concluiu “${n.titulo || 'uma demanda'}”`);
  if (t === 'dm_feedbacks' && p.eventType === 'INSERT' && gestor() && n.autor !== S.user.id) toast('Novo feedback recebido');
  if (t === 'dm_feedbacks' && p.eventType === 'UPDATE' && n.autor === S.user.id && n.resposta && !gestor()) toast('O gestor respondeu seu feedback');
  if (t === 'dm_comentarios') { if (S.conversa && (n.demanda_id === S.conversa || p.eventType === 'DELETE')) carregarConversa(); return; }
  recarregar();
}

/* Itens previstos/feitos em um dia */
function itensDoDia(D) {
  const h = hoje(), dow = dIso(D).getDay(), out = [];
  for (const d of S.dem) {
    if (d.tipo === 'diaria') {
      const ex = feito(d.id, D);
      const prevista = d.ativa && (d.dias_semana || []).includes(dow) && isoDe(d.criado_em) <= D;
      if (prevista || ex) out.push({ d, ref: D, ex });
    } else {
      const ex = feito(d.id, 'unica');
      if (ex) { if (isoDe(ex.concluida_em) === D) out.push({ d, ref: 'unica', ex }); }
      else if (D === h && d.ativa) out.push({ d, ref: 'unica', ex: null, atrasada: !!(d.prazo && d.prazo < h), futura: !!(d.prazo && d.prazo > h) });
    }
  }
  return out;
}
const PESO = { urgente: 0, alta: 1, normal: 2 };
function ordenar(l) {
  return l.sort((a, b) => {
    if (!!a.ex !== !!b.ex) return a.ex ? 1 : -1;
    if (a.ex) return new Date(b.ex.concluida_em) - new Date(a.ex.concluida_em);
    return (b.atrasada - a.atrasada) || (PESO[a.d.prioridade] - PESO[b.d.prioridade]) || String(a.d.prazo || '9').localeCompare(String(b.d.prazo || '9'))
      || String(a.d.horario || '~').localeCompare(String(b.d.horario || '~')) || a.d.titulo.localeCompare(b.d.titulo);
  });
}
function resumo(its) {
  const contam = its.filter(i => !i.futura);
  return { total: contam.length, feitas: contam.filter(i => i.ex).length, atrasadas: its.filter(i => i.atrasada).length };
}

/* ---------------- telas de entrada ---------------- */
function tirarSplash() { $('#splash').classList.add('out'); }
function telaLogin(msg) {
  tirarSplash(); S.montado = false;
  document.body.style.overflow = '';
  $('#app').innerHTML = `<div class="full"><form class="login" onsubmit="return entrarLogin(event)" autocomplete="on">
    <img class="appic" src="icons/icon-192.png" alt="">
    <h1>Demandas</h1>
    <img class="logo" src="../assets/logo.png" alt="Boa Vista Corporate">
    <div class="grp">
      <div class="fld"><input id="lu" class="l" name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="Usuário" required></div>
      <div class="fld"><input id="lp" class="l" name="password" type="password" autocomplete="current-password" placeholder="Senha" required></div>
    </div>
    <div class="err" id="lerr">${esc(msg || '')}</div>
    <button class="btn" id="lbtn" type="submit">Entrar</button>
    <p class="note" style="text-align:center;margin-top:18px">Não tem acesso? Peça ao seu gestor.</p>
  </form></div>`;
  setTimeout(() => { const u = $('#lu'); if (u && matchMedia('(min-width:700px)').matches) u.focus(); }, 50);
}
async function entrarLogin(e) {
  e.preventDefault();
  let u = $('#lu').value.trim().toLowerCase().replace(/^@/, '');
  const p = $('#lp').value, b = $('#lbtn');
  if (!u.includes('@')) u += DOMINIO;
  b.disabled = true; b.textContent = 'Entrando…'; $('#lerr').textContent = '';
  const { data, error } = await S.sb.auth.signInWithPassword({ email: u, password: p });
  if (error) { $('#lerr').textContent = erroTxt(error); b.disabled = false; b.textContent = 'Entrar'; return false; }
  S.user = data.user;
  await entrar();
  return false;
}
function telaCheia(html) {
  tirarSplash(); S.montado = false;
  $('#app').innerHTML = `<div class="full"><div class="login setup">${html}</div></div>`;
}
function telaSetup(tipo) {
  const sql = 'https://github.com/kleberalvs/boavista/blob/main/supabase/atualizacao-3-demandas.sql';
  telaCheia(tipo === 'config'
    ? `<div class="empty"><div class="ic" style="--c:var(--orange)">${ic('alerta')}</div><b>Configuração não encontrada</b>O arquivo config.js do painel não foi carregado.</div>`
    : `<div class="empty" style="padding-bottom:12px"><div class="ic">${ic('zap')}</div><b>Falta ativar o banco das demandas</b>Uma única vez, no Supabase:</div>
       <div class="card pad"><ol style="margin:0">
         <li>Abra o projeto no <b>supabase.com</b> → <b>SQL Editor</b> → <b>New query</b>.</li>
         <li>Cole todo o conteúdo do arquivo <a href="${sql}" target="_blank" rel="noopener">atualizacao-3-demandas.sql</a> e clique em <b>Run</b>.</li>
         <li>Volte aqui e toque em <b>Recarregar</b>. Você entra como gestor.</li>
       </ol></div>
       <div class="stack" style="margin-top:16px"><button class="btn" onclick="location.reload()">Recarregar</button><button class="btn gray" onclick="sair(true)">Sair</button></div>`);
}
function telaSemAcesso(inativo) {
  telaCheia(`<div class="empty"><div class="ic" style="--c:var(--orange)">${ic('pessoa')}</div><b>${inativo ? 'Acesso desativado' : 'Sem acesso às demandas'}</b>${inativo ? 'Seu acesso foi desativado pelo gestor.' : 'Sua conta ainda não foi liberada no app de demandas. Peça ao gestor para criar o seu usuário.'}</div>
    <button class="btn gray" onclick="sair(true)">Sair</button>`);
}
function telaErro(msg) {
  telaCheia(`<div class="empty"><div class="ic" style="--c:var(--red)">${ic('alerta')}</div><b>Não foi possível abrir</b>${esc(msg)}</div>
    <div class="stack"><button class="btn" onclick="location.reload()">Tentar de novo</button><button class="btn gray" onclick="sair(true)">Sair</button></div>`);
}

async function entrar() {
  await lerFila();
  const c = lerCache();
  if (c && !S.montado) { Object.assign(S, c.d); indexar(); if (S.me && S.me.ativo) montar(); }
  try {
    const { data, error } = await S.sb.rpc('dm_bootstrap');
    if (error) throw error;
    if (data === 'sem_acesso') return telaSemAcesso(false);
    if (data === 'gestor') toast('Bem-vindo! Você é o gestor das demandas.');
    await carregar();
    if (!S.me) return telaSemAcesso(false);
    if (!S.me.ativo) return telaSemAcesso(true);
    if (!S.montado) montar(); else render();
    realtime(); enviarFila();
  } catch (e) {
    if (faltaBanco(e)) return telaSetup('sql');
    if (rede(e)) { if (S.montado) { render(); return; } return telaErro('Sem conexão com a internet. Conecte-se para o primeiro acesso.'); }
    if (/JWT|refresh|session/i.test(e.message || '')) { await S.sb.auth.signOut().catch(() => {}); return telaLogin('Sua sessão expirou. Entre de novo.'); }
    telaErro(erroTxt(e));
  }
}
async function sair(direto) {
  if (!direto && !(await perguntar('Sair do app?', S.fila.length ? `Há ${plural(S.fila.length, 'conclusão', 'conclusões')} ainda não enviada(s). Elas serão perdidas.` : '', 'Sair', true))) return;
  try { localStorage.removeItem('dm_cache'); } catch (e) { }
  try { await S.sb.auth.signOut(); } catch (e) { }
  location.reload();
}

/* ---------------- estrutura ---------------- */
function abas() {
  return gestor()
    ? [['hoje', 'Hoje', 'hoje'], ['demandas', 'Demandas', 'lista'], ['historico', 'Histórico', 'hist'], ['equipe', 'Equipe', 'equipe'], ['feedback', 'Feedback', 'fb']]
    : [['hoje', 'Hoje', 'hoje'], ['historico', 'Histórico', 'hist'], ['feedback', 'Feedback', 'fb']];
}
function montar() {
  S.montado = true; tirarSplash();
  $('#app').innerHTML = '<aside id="side"></aside><main id="main"></main><nav id="tabbar" aria-label="Menu"></nav>';
  render();
  atualizarEstadoPush(); revalidarPush();
  setTimeout(abrirDoLink, 300);
}
function ir(t) {
  if (S.tab === t) { scrollTo({ top: 0, behavior: 'smooth' }); return; }
  S.tab = t; S.anim = true; render(); scrollTo(0, 0);
  if (t === 'feedback' && !gestor()) marcarRespostasVistas();
}
function badgeFb() {
  if (!S.me) return 0;
  if (gestor()) return S.fb.filter(f => f.status === 'novo').length;
  const vistos = respostasVistas();
  return S.fb.filter(f => f.autor === S.user.id && f.resposta && !vistos.includes(f.id + f.respondido_em)).length;
}
function respostasVistas() { try { return JSON.parse(localStorage.getItem('dm_vistos') || '[]'); } catch (e) { return []; } }
function marcarRespostasVistas() {
  try { localStorage.setItem('dm_vistos', JSON.stringify(S.fb.filter(f => f.resposta).map(f => f.id + f.respondido_em).slice(0, 300))); } catch (e) { }
}
function render() {
  if (!S.montado || !S.me) return;
  const tabs = abas();
  if (!tabs.some(t => t[0] === S.tab)) S.tab = 'hoje';
  const nb = badgeFb();
  const a = document.activeElement, fid = a && a.id && $('#main') && $('#main').contains(a) ? a.id : null, sel = fid ? a.selectionStart : null;
  $('#tabbar').innerHTML = tabs.map(([k, n, i]) => `<button class="${S.tab === k ? 'on' : ''}" onclick="ir('${k}')">${ic(i)}<span>${n}</span>${k === 'feedback' && nb ? `<i class="badge">${nb}</i>` : ''}</button>`).join('');
  $('#side').innerHTML = `<div class="brand"><img src="../assets/logo.png" alt="Boa Vista Corporate"></div>
    <nav>${tabs.map(([k, n, i]) => `<button class="${S.tab === k ? 'on' : ''}" onclick="ir('${k}')">${ic(i)}<span>${n}</span>${k === 'feedback' && nb ? `<i class="badge">${nb}</i>` : ''}</button>`).join('')}${donoPainel() ? `<button onclick="location.href='../'" title="Voltar ao painel de Colaboradores" style="margin-top:14px">${ic('painel')}<span>Painel da equipe ↗</span></button>` : ''}</nav>
    <button class="me" onclick="abrirPerfil()"><span class="av" style="background:${corPessoa(S.me)}">${esc(ini(S.me.nome))}</span><span><b>${esc(S.me.nome)}</b><small>${gestor() ? 'Gestor' : esc(nomesDeps(S.me.departamentos) || 'Colaborador')}</small></span></button>`;
  const v = { hoje: vHoje, demandas: vDemandas, historico: vHistorico, equipe: vEquipe, feedback: vFeedback }[S.tab];
  let corpo;
  try { corpo = v(); } catch (e) { console.error(e); corpo = `<div class="empty"><b>Algo deu errado</b>${esc(e.message)}</div>`; }
  $('#main').innerHTML = `<div class="topbar" id="topbar"><span class="t">${esc(S.titulo)}</span></div><div class="wrap ${S.anim ? 'anim' : ''}">${barraRede()}${corpo}</div>`;
  S.anim = false;
  topo();
  hidratarFotos($('#main'));
  if (fid) { const el = document.getElementById(fid); if (el) { el.focus(); try { el.setSelectionRange(sel, sel); } catch (e) { } } }
}
function topo() { const t = $('#topbar'); if (t) t.classList.toggle('on', scrollY > 44); }
const nomesDeps = ids => (ids || []).map(id => (dep(id) || {}).nome).filter(Boolean).join(', ');
function cab(t, sub, acts = '') {
  S.titulo = t;
  return `<img class="mlogo" src="../assets/logo.png" alt="Boa Vista Corporate"><div class="lt"><h1>${esc(t)}</h1><div class="acts">${acts}<button class="av me-btn" style="background:${corPessoa(S.me)}" onclick="abrirPerfil()" aria-label="Meu perfil">${esc(ini(S.me.nome))}</button></div></div>${sub ? `<p class="sub">${esc(sub)}</p>` : '<div style="height:14px"></div>'}`;
}
function barraRede() {
  if (!navigator.onLine) return `<div class="net">${ic('alerta', 's')} Sem internet${S.fila.length ? ` · ${plural(S.fila.length, 'conclusão aguardando', 'conclusões aguardando')} envio` : ' · mostrando os últimos dados'}</div>`;
  if (S.fila.length) return `<div class="net">${ic('repetir', 's')} Enviando ${plural(S.fila.length, 'conclusão', 'conclusões')}…</div>`;
  return '';
}
function anel(n, t, cor = '#34c759', sz = 66, sw = 7) {
  const r = (sz - sw) / 2, c = 2 * Math.PI * r, p = t ? n / t : 0;
  return `<svg class="ring" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}" aria-hidden="true"><circle class="bg" cx="${sz / 2}" cy="${sz / 2}" r="${r}" stroke-width="${sw}"/><circle class="fg" cx="${sz / 2}" cy="${sz / 2}" r="${r}" stroke-width="${sw}" stroke="${cor}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - p)).toFixed(2)}" transform="rotate(-90 ${sz / 2} ${sz / 2})"/><text x="50%" y="50%" style="font-size:${sz > 50 ? 16 : 11.5}px">${t ? Math.round(p * 100) + '%' : '—'}</text></svg>`;
}
const seg = (opcoes, atual, fn) => `<div class="seg" role="tablist">${opcoes.map(([v, t]) => `<button role="tab" class="${atual === v ? 'on' : ''}" onclick="${fn}('${v}')">${t}</button>`).join('')}</div>`;
function filtro(chave, v) { S.f[chave] = v; render(); }
const vazio = (icone, t, txt, cor, extra = '') => `<div class="empty"><div class="ic" style="--c:${cor || 'var(--blue)'}">${ic(icone)}</div><b>${esc(t)}</b>${esc(txt || '')}${extra}</div>`;

/* Linha de demanda */
function linha(it, o = {}) {
  const { d, ex } = it, meus = (!gestor() && S.me && S.me.departamentos) || [], c = corDep(depsDe(d).find(x => meus.includes(x)) || d.departamento_id), ok = !!ex, wait = ex && ex._pend;
  const m = [];
  if (o.dep) m.push(chipsDeps(d) || '<span class="chip">—</span>');
  if (ok) m.push(wait ? '<span class="chip orange">Aguardando envio</span>' : `${esc(primeiroNome(nomeDe(ex.concluida_por)))} · ${hora(ex.concluida_em)}`);
  else if (d.tipo === 'especifica') m.push(it.atrasada ? `<span class="chip red">Atrasada · ${esc(prazoTxt(d.prazo))}</span>` : d.prazo ? `${ic('cal', 'xs')} ${esc(prazoTxt(d.prazo))}` : 'Específica');
  if (!ok && d.horario) m.push(`${ic('relogio', 'xs')} ${esc(d.horario)}`);
  if (d.local) m.push(`${ic('pin', 'xs')} ${esc(d.local)}`);
  if (!ok && d.prioridade !== 'normal') m.push(`<span class="chip ${d.prioridade === 'urgente' ? 'red' : 'orange'}">${d.prioridade === 'urgente' ? 'Urgente' : 'Alta'}</span>`);
  if (!ok && d.exige_foto) m.push(`${ic('camera', 'xs')} Foto`);
  if (o.gestor && !ok && d.responsavel) m.push(`${ic('pessoa', 'xs')} ${esc(primeiroNome(nomeDe(d.responsavel)))}`);
  if (ok && ex.observacao) m.push(`${ic('fb', 'xs')}`);
  const fotos = ok ? (ex.fotos || []).slice(0, 2) : [];
  return `<button class="row" style="--ind:54px" onclick="abrirItem('${d.id}','${it.ref}')">
    <span class="chk ${ok ? (wait ? 'wait' : 'ok') : ''}" style="--c:${c}">${ok ? ic('check', 'xs') : ''}</span>
    <span class="grow"><div class="t1">${esc(d.titulo)}</div>${m.length ? `<div class="t2">${m.join('')}</div>` : ''}</span>
    ${fotos.length ? `<span class="thumbs">${fotos.map(f => imgFoto(f)).join('')}</span>` : ''}
    <span class="chev">${ic('chev', 's')}</span></button>`;
}
function listaAgrupada(its, o = {}) {
  if (!o.agrupar) return `<div class="list">${its.map(i => linha(i, o)).join('')}</div>`;
  const grupos = {};
  const meus = (S.me && S.me.departamentos) || [];
  its.forEach(i => { const k = depsDe(i.d).find(x => meus.includes(x)) || i.d.departamento_id; (grupos[k] = grupos[k] || []).push(i); });
  return S.deps.filter(d => grupos[d.id]).map(d => `<div class="sec"><span>${esc(d.nome)}</span></div><div class="list">${grupos[d.id].map(i => linha(i, o)).join('')}</div>`).join('');
}

/* ---------------- HOJE ---------------- */
function vHoje() { return gestor() ? vHojeGestor() : vHojeColab(); }

function vHojeColab() {
  const h = hoje(), its = ordenar(itensDoDia(h)), r = resumo(its);
  const aba = S.f.hc || 'fazer';
  const pend = its.filter(i => !i.ex && !i.futura), prox = its.filter(i => i.futura), feitas = its.filter(i => i.ex);
  const multi = ((S.me && S.me.departamentos) || []).length > 1 && new Set(its.map(i => depsDe(i.d).find(x => S.me.departamentos.includes(x)) || i.d.departamento_id)).size > 1;
  const msg = !r.total ? 'Nenhuma demanda prevista para hoje.' : r.feitas === r.total ? 'Tudo concluído. Ótimo trabalho!' : `${plural(r.total - r.feitas, 'demanda pendente', 'demandas pendentes')} de ${r.total}${r.atrasadas ? ` · ${r.atrasadas} atrasada${r.atrasadas > 1 ? 's' : ''}` : ''}`;
  let html = cab('Hoje', fmtLonga(h)) + avisoPush();
  html += `<div class="card hero">${anel(r.feitas, r.total)}<div><div class="big">${saudacao()}, ${esc(primeiroNome(S.me.nome))}</div><div class="muted">${esc(msg)}</div></div></div><div style="height:18px"></div>`;
  html += seg([['fazer', `A fazer${pend.length ? ' (' + pend.length + ')' : ''}`], ['feitas', `Concluídas${feitas.length ? ' (' + feitas.length + ')' : ''}`]], aba, "filtro.bind(null,'hc')");
  if (aba === 'fazer') {
    if (!pend.length && !prox.length) html += vazio('ok', r.total ? 'Tudo feito por hoje' : 'Dia livre', r.total ? 'Suas demandas de hoje estão concluídas.' : 'Quando o gestor criar demandas para você, elas aparecem aqui.', 'var(--green)');
    if (pend.length) html += listaAgrupada(pend, { agrupar: multi });
    if (prox.length) html += `<div class="sec"><span>Próximas</span></div><div class="list">${prox.map(i => linha(i)).join('')}</div>`;
  } else {
    html += feitas.length ? listaAgrupada(feitas, { agrupar: multi }) : vazio('hoje', 'Nada concluído ainda', 'Toque em uma demanda para registrar a conclusão com fotos.');
  }
  return html;
}

function vHojeGestor() {
  const h = hoje(), D = S.dia || h, eHoje = D === h;
  const todos = ordenar(itensDoDia(D));
  const fdep = S.f.hdep && dep(S.f.hdep) ? S.f.hdep : null;
  const its = fdep ? todos.filter(i => temDep(i.d, fdep)) : todos;
  const r = resumo(todos), aba = S.f.hg || 'pend';
  const pend = its.filter(i => !i.ex && !i.futura), feitas = its.filter(i => i.ex), prox = its.filter(i => i.futura);
  const novosFb = S.fb.filter(f => f.status === 'novo').length;
  const acts = `<button class="circ" onclick="mudarDia(-1)" aria-label="Dia anterior">${ic('chevL', 's')}</button><button class="circ" onclick="mudarDia(1)" aria-label="Próximo dia" ${eHoje ? 'disabled' : ''}>${ic('chev', 's')}</button><button class="circ blue" onclick="formDemanda()" aria-label="Nova demanda">${ic('mais', 's')}</button>`;
  let html = cab(eHoje ? 'Hoje' : (D === addDias(h, -1) ? 'Ontem' : fmtCurta(D)), fmtLonga(D), acts) + (eHoje ? avisoPush() : '');
  if (!eHoje) html += `<div style="margin:-6px 0 14px"><button class="pill" onclick="S.dia=null;render()">${ic('cal', 's')} Voltar para hoje</button></div>`;
  html += `<div class="card hero">${anel(r.feitas, r.total)}<div style="flex:1"><div class="big">${r.feitas} de ${r.total}</div><div class="muted">${eHoje ? 'demandas concluídas hoje' : 'demandas concluídas neste dia'}${r.atrasadas ? ` · <span style="color:var(--red)">${r.atrasadas} atrasada${r.atrasadas > 1 ? 's' : ''}</span>` : ''}</div>
    ${novosFb ? `<button class="chip blue" style="margin-top:8px" onclick="ir('feedback')">${ic('fb', 'xs')} ${plural(novosFb, 'feedback novo', 'feedbacks novos')}</button>` : ''}</div></div>`;
  const usados = S.deps.filter(d => todos.some(i => temDep(i.d, d.id)));
  if (usados.length) {
    html += `<div class="sec"><span>Departamentos</span>${fdep ? `<button onclick="filtro('hdep',null)">Ver todos</button>` : ''}</div><div class="deps">${usados.map(d => {
      const di = todos.filter(i => temDep(i.d, d.id)), rr = resumo(di);
      return `<button class="card dep ${fdep === d.id ? 'on' : ''}" style="--c:${d.cor}" onclick="filtro('hdep',${fdep === d.id ? 'null' : `'${d.id}'`})">${anel(rr.feitas, rr.total, d.cor, 44, 5)}<b>${esc(d.nome)}</b><span>${rr.feitas} de ${rr.total} concluídas</span></button>`;
    }).join('')}</div>`;
  }
  html += '<div style="height:18px"></div>' + seg([['pend', `Pendentes${pend.length ? ' (' + pend.length + ')' : ''}`], ['feitas', `Concluídas${feitas.length ? ' (' + feitas.length + ')' : ''}`]], aba, "filtro.bind(null,'hg')");
  if (aba === 'pend') {
    if (pend.length) html += `<div class="list">${pend.map(i => linha(i, { dep: !fdep, gestor: true })).join('')}</div>`;
    else html += S.dem.length ? vazio('ok', eHoje ? 'Nada pendente' : 'Nada ficou pendente', eHoje ? 'Todas as demandas previstas foram concluídas.' : '', 'var(--green)')
      : vazio('lista', 'Comece criando as demandas', 'Cadastre as tarefas diárias e específicas de cada departamento.', null, `<div style="margin-top:16px"><button class="btn sm" style="margin:0 auto" onclick="formDemanda()">${ic('mais', 's')} Nova demanda</button></div>`);
    if (eHoje && prox.length) html += `<div class="sec"><span>Próximas (prazo futuro)</span></div><div class="list">${prox.map(i => linha(i, { dep: !fdep, gestor: true })).join('')}</div>`;
  } else {
    html += feitas.length ? `<div class="list">${feitas.map(i => linha(i, { dep: !fdep, gestor: true })).join('')}</div>` : vazio('hoje', 'Nenhuma conclusão ainda', 'As conclusões aparecem aqui em tempo real, com fotos e observações.');
  }
  return html;
}
function mudarDia(n) { const h = hoje(); let d = addDias(S.dia || h, n); if (d >= h) d = null; S.dia = d; render(); }

/* ---------------- FOLHA (janela) ---------------- */
function folha({ titulo, esq, dir, corpo, tipo }) {
  const sh = $('#sheet');
  S.folhaTipo = tipo || '';
  sh.innerHTML = `<div class="hd"><div>${esq ? `<button class="link" onclick="${esq[1]}">${esc(esq[0])}</button>` : ''}</div><b>${esc(titulo)}</b><div class="r">${dir ? `<button class="link" id="dirBtn" onclick="${dir[1]}">${esc(dir[0])}</button>` : ''}</div></div><div class="bd" id="sbd">${corpo}</div>`;
  sh.querySelector('.bd').scrollTop = 0;
  requestAnimationFrame(() => { sh.classList.add('on'); $('#veil').classList.add('on'); });
  document.body.style.overflow = 'hidden';
  hidratarFotos(sh);
}
function corpoFolha(html) { const b = $('#sbd'); if (!b) return; const y = b.scrollTop; b.innerHTML = html; b.scrollTop = y; hidratarFotos(b); }
function fecharFolha() {
  $('#sheet').classList.remove('on'); $('#veil').classList.remove('on');
  document.body.style.overflow = ''; S.conversa = null; S.folhaTipo = '';
  if (S.rasc) (S.rasc.fotos || []).forEach(f => URL.revokeObjectURL(f.url));
  S.rasc = null;
}
function ocupado(b, txt) { if (!b) return () => { }; const o = b.textContent, d = b.disabled; b.disabled = true; b.textContent = txt || 'Salvando…'; return () => { b.disabled = d; b.textContent = o; }; }

/* ---------------- DEMANDA: ver e concluir ---------------- */
function abrirItem(id, ref, exHist) {
  S.rasc = { id, ref, fotos: [], obs: '', exHist: exHist || null };
  S.conversa = dem(id) ? id : null; S.msgs = [];
  const d = dem(id);
  folha({ titulo: d && d.tipo === 'diaria' ? 'Demanda diária' : 'Demanda', tipo: 'item', esq: ['Fechar', 'fecharFolha()'], dir: gestor() && d ? ['Editar', `formDemanda('${id}')`] : null, corpo: corpoItem() });
  carregarConversa();
}
function abrirExec(exId) {
  const ex = S.exe.find(e => e.id === exId) || (S.hist && S.hist.l.find(e => e.id === exId));
  if (ex) abrirItem(ex.demanda_id, ex.ref, ex);
}
function atualizarItem() { const ta = $('#obsIn'); if (ta && S.rasc) S.rasc.obs = ta.value; corpoFolha(corpoItem()); }
function corpoItem() {
  const { id, ref } = S.rasc, d = dem(id);
  const ex = feito(id, ref) || (S.rasc.exHist && !S.rasc.exHist.reaberta_em && !S.exe.find(e => e.id === S.rasc.exHist.id) && !S.rasc.apagado ? S.rasc.exHist : null);
  const titulo = d ? d.titulo : (ex && ex.titulo) || 'Demanda';
  const depId = d ? d.departamento_id : ex && ex.departamento_id, dp = dep(depId), c = corDep(depId);
  const h = hoje();
  const chips = [];
  if (d && depsDe(d).length) chips.push(chipsDeps(d)); else if (dp) chips.push(`<span class="chip c" style="--c:${c}">${esc(dp.nome)}</span>`);
  if (d) {
    chips.push(d.tipo === 'diaria' ? `<span class="chip">${ic('repetir', 'xs')} ${esc(diasTxt(d.dias_semana))}</span>` : `<span class="chip ${!ex && d.prazo && d.prazo < h ? 'red' : ''}">${ic('cal', 'xs')} ${d.prazo ? 'Prazo: ' + esc(prazoTxt(d.prazo)) : 'Sem prazo'}</span>`);
    if (d.prioridade !== 'normal') chips.push(`<span class="chip ${d.prioridade === 'urgente' ? 'red' : 'orange'}">${d.prioridade === 'urgente' ? 'Urgente' : 'Prioridade alta'}</span>`);
    if (d.exige_foto) chips.push(`<span class="chip blue">${ic('camera', 'xs')} Pede foto</span>`);
    if (!d.ativa) chips.push('<span class="chip">Arquivada</span>');
  }
  let html = `<div class="dt"><div class="chips">${chips.join('')}</div><h2>${esc(titulo)}</h2>${d && d.descricao ? `<p class="desc">${esc(d.descricao)}</p>` : ''}</div>`;
  const info = [];
  if (ref !== 'unica' && ref !== h) info.push(['cal', 'Dia', fmtLonga(ref)]);
  if (d && d.local) info.push(['pin', 'Local', d.local]);
  if (d && d.horario) info.push(['relogio', 'Horário', d.horario]);
  if (d && d.responsavel) info.push(['pessoa', 'Responsável', nomeDe(d.responsavel)]);
  if (info.length) html += `<div class="list" style="margin-top:14px">${info.map(([i, k, v]) => `<div class="row" style="--ind:50px"><span style="color:var(--label2)">${ic(i)}</span><span class="grow"><div class="t2" style="margin:0">${k}</div><div class="t1" style="font-size:16px">${esc(v)}</div></span></div>`).join('')}</div>`;

  if (ex) {
    const meu = ex.concluida_por === S.user.id, recente = Date.now() - new Date(ex.concluida_em) < 12 * 3600e3;
    html += `<div style="height:16px"></div><div class="okbox ${ex._pend ? 'wait' : ''}"><span class="chk ${ex._pend ? 'wait' : 'ok'}">${ic('check', 'xs')}</span><span>${ex._pend ? 'Concluída · aguardando internet para enviar' : `Concluída por ${esc(meu ? 'você' : nomeDe(ex.concluida_por))}<br><span style="font-weight:400;opacity:.85">${esc(fmtLonga(isoDe(ex.concluida_em)))}, às ${hora(ex.concluida_em)}</span>`}</span></div>`;
    if ((ex.fotos || []).length) html += `<div class="cap">Fotos do serviço</div><div class="photos" data-gal>${ex.fotos.map(f => `<button class="ph" onclick="verFoto(this)">${imgFoto(f)}</button>`).join('')}</div>`;
    if (ex.observacao) html += `<div class="cap">Observação</div><div class="obs">${esc(ex.observacao)}</div>`;
    if (ex._pend || gestor() || (meu && recente)) html += `<div style="height:16px"></div><button class="btn red" onclick="desfazer()">${ic('desfazer', 's')} ${gestor() && !meu ? 'Reabrir demanda' : 'Desfazer conclusão'}</button>`;
  } else if (d && d.ativa && (ref === h || ref === 'unica')) {
    const r = S.rasc, falta = d.exige_foto && !r.fotos.length;
    html += `<div class="cap">Fotos do serviço${d.exige_foto ? ' · obrigatória' : ''}</div>
      <div class="photos" data-gal>${r.fotos.map((f, i) => `<div class="ph"><img src="${f.url}" alt="" onclick="verFoto(this)"><button class="x" onclick="tirarFoto(${i})" aria-label="Remover foto">${ic('x', 'xs')}</button></div>`).join('')}
      ${r.fotos.length < 6 ? `<button class="add" onclick="addFotos()">${ic('camera')}<span>${r.fotos.length ? 'Mais' : 'Tirar foto'}</span></button>` : ''}</div>
      <div class="cap">Observação</div>
      <div class="grp"><div class="fld"><textarea id="obsIn" placeholder="Como ficou? Algo que o gestor precisa saber?" oninput="S.rasc.obs=this.value">${esc(r.obs)}</textarea></div></div>
      <div style="height:18px"></div>
      <button class="btn green" id="btnConcluir" onclick="concluir()" ${falta ? 'disabled' : ''}>${ic('check', 's')} Marcar como concluída</button>
      ${falta ? '<p class="note" style="text-align:center">Adicione pelo menos uma foto para concluir.</p>' : ''}`;
  } else if (d && !d.ativa) {
    html += `<div style="height:16px"></div><div class="okbox wait">Esta demanda está arquivada.</div>`;
  } else {
    html += `<div style="height:16px"></div><div class="okbox wait">${ic('alerta', 's')} Não foi concluída neste dia.</div>`;
  }
  const reabertas = [...S.exe, ...((S.hist && S.hist.l) || [])].filter((e, i, a) => e.reaberta_em && e.demanda_id === id && e.ref === ref && a.findIndex(x => x.id === e.id) === i)
    .sort((a, b) => new Date(b.concluida_em) - new Date(a.concluida_em));
  if (reabertas.length) {
    html += `<div class="cap">Conclusões anteriores (reabertas)</div>` + reabertas.map(e => `<div class="card" style="padding:12px 14px;margin-bottom:10px">
      <div class="t2" style="margin:0 0 8px">Concluída por ${esc(e.concluida_por === S.user.id ? 'você' : nomeDe(e.concluida_por))} em ${esc(fmtDataHora(e.concluida_em))} · reaberta${e.reaberta_por ? ' por ' + esc(e.reaberta_por === S.user.id ? 'você' : primeiroNome(nomeDe(e.reaberta_por))) : ''} em ${esc(fmtDataHora(e.reaberta_em))}</div>
      ${(e.fotos || []).length ? `<div class="photos" data-gal style="margin:0">${e.fotos.map(f => `<button class="ph" onclick="verFoto(this)">${imgFoto(f)}</button>`).join('')}</div>` : '<span class="muted small">Sem fotos.</span>'}</div>`).join('');
  }
  if (d) html += `<div class="cap">Conversa sobre esta demanda</div><div class="chat" id="chat">${htmlChat()}</div>
    <div class="composer"><textarea id="msgIn" rows="1" placeholder="Escreva uma mensagem…" oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"></textarea><button onclick="enviarMsg()" aria-label="Enviar">${ic('enviar', 's')}</button></div>`;
  return html;
}
function addFotos() { escolherFotos(6 - S.rasc.fotos.length, fs => { if (!S.rasc) return; S.rasc.fotos.push(...fs); atualizarItem(); }); }
function tirarFoto(i) { const [f] = S.rasc.fotos.splice(i, 1); if (f) URL.revokeObjectURL(f.url); atualizarItem(); }

async function concluir() {
  const { id, ref, fotos } = S.rasc, d = dem(id);
  if (!d) return;
  if (d.exige_foto && !fotos.length) return toast('Adicione pelo menos uma foto.');
  if (feito(id, ref)) return toast('Esta demanda já foi concluída.');
  const obs = (($('#obsIn') || {}).value || '').trim();
  const rid = crypto.randomUUID();
  const item = { id: rid, uid: S.user.id, tent: 0, blobs: fotos.map(f => f.blob), rec: { id: rid, demanda_id: id, ref, titulo: d.titulo, departamento_id: d.departamento_id, concluida_por: S.user.id, concluida_em: new Date().toISOString(), observacao: obs || null } };
  const onde = await IDB.por(item);
  await lerFila();
  fecharFolha(); render();
  if (navigator.vibrate) navigator.vibrate(12);
  toast(navigator.onLine ? 'Demanda concluída' : onde === 'memoria' ? 'Sem internet: mantenha o app aberto até a conexão voltar para enviar.' : 'Concluída. Será enviada quando houver internet.');
  enviarFila();
}
async function desfazer() {
  const { id, ref } = S.rasc, ex = feito(id, ref) || S.rasc.exHist;
  if (!ex) return;
  if (!(await perguntar(gestor() && ex.concluida_por !== S.user.id ? 'Reabrir esta demanda?' : 'Desfazer a conclusão?', ex._pend ? 'A conclusão ainda não enviada será descartada.' : 'A observação será apagada. As fotos ficam guardadas na demanda e no histórico, e a demanda volta a ficar pendente.', gestor() && ex.concluida_por !== S.user.id ? 'Reabrir' : 'Desfazer', true))) return;
  if (ex._pend) { await IDB.tirar(ex._fila); await lerFila(); render(); atualizarItem(); return toast('Conclusão desfeita'); }
  const mud = { reaberta_em: new Date().toISOString(), reaberta_por: S.user.id, observacao: null };
  const { error } = await S.sb.from('dm_execucoes').update(mud).eq('id', ex.id);
  if (error) return toast(erroTxt(error));
  S.exe.forEach(e => { if (e.id === ex.id) Object.assign(e, mud); }); indexar(); S.rasc.apagado = true;
  if (S.hist) S.hist.l.forEach(e => { if (e.id === ex.id) Object.assign(e, mud); });
  if (S.rasc.exHist && S.rasc.exHist.id === ex.id) Object.assign(S.rasc.exHist, mud);
  render(); atualizarItem(); toast(gestor() && ex.concluida_por !== S.user.id ? 'Demanda reaberta' : 'Conclusão desfeita');
}

/* Conversa */
function htmlChat() {
  if (!S.msgs.length) return '<p class="muted small" style="margin:0 4px">Nenhuma mensagem. Use para tirar dúvidas ou avisar algo sobre esta demanda.</p>';
  return S.msgs.map(m => { const eu = m.autor === S.user.id; return `<div class="msg ${eu ? 'me' : ''}"><small>${eu ? 'Você' : esc(primeiroNome(nomeDe(m.autor)))} · ${esc(fmtDataHora(m.criado_em))}</small>${esc(m.texto)}</div>`; }).join('');
}
async function carregarConversa() {
  const id = S.conversa;
  if (!id || !navigator.onLine) return;
  const { data, error } = await S.sb.from('dm_comentarios').select('*').eq('demanda_id', id).order('criado_em');
  if (error || S.conversa !== id) return;
  S.msgs = data || [];
  const el = $('#chat'); if (el) el.innerHTML = htmlChat();
}
async function enviarMsg() {
  const ta = $('#msgIn'), t = ta.value.trim();
  if (!t) return;
  if (!navigator.onLine) return toast('Sem internet. Tente de novo quando conectar.');
  ta.value = ''; ta.style.height = 'auto';
  const { error } = await S.sb.from('dm_comentarios').insert({ demanda_id: S.conversa, autor: S.user.id, texto: t });
  if (error) { ta.value = t; return toast(erroTxt(error)); }
  carregarConversa();
}

/* ---------------- DEMANDAS (gestor) ---------------- */
function vDemandas() {
  const t = S.f.dt || 'diaria', fdep = S.f.dd && dep(S.f.dd) ? S.f.dd : null, q = slug(S.f.dq || '').replace(/\./g, ' ');
  let l = S.dem.filter(d => t === 'arq' ? !d.ativa : d.ativa && d.tipo === t);
  if (fdep) l = l.filter(d => temDep(d, fdep));
  if (q) l = l.filter(d => slug(d.titulo + ' ' + (d.local || '') + ' ' + (d.descricao || '')).replace(/\./g, ' ').includes(q));
  l.sort((a, b) => t === 'especifica' ? (!!feito(a.id, 'unica') - !!feito(b.id, 'unica')) || String(a.prazo || '9').localeCompare(String(b.prazo || '9')) || a.titulo.localeCompare(b.titulo) : a.titulo.localeCompare(b.titulo));
  const ativas = S.dem.filter(d => d.ativa);
  let html = cab('Demandas', `${plural(ativas.filter(d => d.tipo === 'diaria').length, 'diária', 'diárias')} · ${plural(ativas.filter(d => d.tipo === 'especifica' && !feito(d.id, 'unica')).length, 'específica em aberto', 'específicas em aberto')}`,
    `<button class="circ blue" onclick="formDemanda()" aria-label="Nova demanda">${ic('mais', 's')}</button>`);
  html += seg([['diaria', 'Diárias'], ['especifica', 'Específicas'], ['arq', 'Arquivadas']], t, "filtro.bind(null,'dt')");
  html += `<div class="pills"><button class="pill ${!fdep ? 'on' : ''}" onclick="filtro('dd',null)">Todos</button>${S.deps.map(d => `<button class="pill ${fdep === d.id ? 'on' : ''}" style="--c:${d.cor}" onclick="filtro('dd','${d.id}')"><span class="dot" style="background:${fdep === d.id ? '#fff' : d.cor}"></span>${esc(d.nome)}</button>`).join('')}</div>`;
  html += `<label class="search">${ic('lista', 's')}<input id="dq" type="search" placeholder="Buscar demanda" value="${esc(S.f.dq || '')}" oninput="S.f.dq=this.value;render()"></label>`;
  if (!l.length) return html + vazio(t === 'arq' ? 'arquivo' : 'lista', q ? 'Nada encontrado' : t === 'arq' ? 'Nenhuma demanda arquivada' : 'Nenhuma demanda aqui', t === 'arq' ? 'Demandas arquivadas deixam de aparecer para a equipe, mas o histórico fica guardado.' : 'Toque em + para criar.', null);
  const lin = d => {
    const ex = d.tipo === 'especifica' ? feito(d.id, 'unica') : null, sub = [];
    if (d.tipo === 'diaria') sub.push(`${ic('repetir', 'xs')} ${esc(diasTxt(d.dias_semana))}`);
    else if (ex) sub.push(`<span class="chip green">${ic('check', 'xs')} ${esc(primeiroNome(nomeDe(ex.concluida_por)))} · ${fmtCurta(isoDe(ex.concluida_em))}</span>`);
    else sub.push(d.prazo && d.prazo < hoje() ? `<span class="chip red">Atrasada · ${esc(prazoTxt(d.prazo))}</span>` : `${ic('cal', 'xs')} ${esc(d.prazo ? prazoTxt(d.prazo) : 'Sem prazo')}`);
    if (d.horario) sub.push(`${ic('relogio', 'xs')} ${esc(d.horario)}`);
    if (d.local) sub.push(`${ic('pin', 'xs')} ${esc(d.local)}`);
    if (d.responsavel) sub.push(`${ic('pessoa', 'xs')} ${esc(primeiroNome(nomeDe(d.responsavel)))}`);
    if (depsDe(d).length > 1) sub.push(`<span class="chip">${depsDe(d).length === S.deps.length ? 'Todos os departamentos' : depsDe(d).map(id => dep(id).nome).join(' + ')}</span>`);
    if (d.exige_foto) sub.push(ic('camera', 'xs'));
    if (d.prioridade !== 'normal') sub.push(`<span class="chip ${d.prioridade === 'urgente' ? 'red' : 'orange'}">${d.prioridade === 'urgente' ? 'Urgente' : 'Alta'}</span>`);
    return `<button class="row" style="--ind:32px" onclick="${d.tipo === 'especifica' || !d.ativa ? `abrirItem('${d.id}','${d.tipo === 'diaria' ? hoje() : 'unica'}')` : `formDemanda('${d.id}')`}"><span class="bar" style="background:${corDep(d.departamento_id)}"></span><span class="grow"><div class="t1">${esc(d.titulo)}</div><div class="t2">${sub.join('')}</div></span><span class="chev">${ic('chev', 's')}</span></button>`;
  };
  if (fdep) return html + `<div class="list">${l.map(lin).join('')}</div>`;
  return html + S.deps.filter(dp => l.some(d => d.departamento_id === dp.id)).map(dp => `<div class="sec"><span>${esc(dp.nome)}</span><span>${l.filter(d => d.departamento_id === dp.id).length}</span></div><div class="list">${l.filter(d => d.departamento_id === dp.id).map(lin).join('')}</div>`).join('');
}

function formDemanda(id, copia) {
  if (!S.deps.length) { toast('Crie um departamento primeiro.'); S.tab = 'equipe'; S.f.eq = 'deps'; fecharFolha(); render(); return; }
  const d = id ? dem(id) : null;
  S.fd = d ? JSON.parse(JSON.stringify(d)) : copia || { titulo: '', descricao: '', departamento_id: (S.f.dd && dep(S.f.dd) ? S.f.dd : S.f.hdep && dep(S.f.hdep) ? S.f.hdep : S.deps[0].id), departamentos: null, tipo: S.f.dt === 'especifica' ? 'especifica' : 'diaria', dias_semana: [1, 2, 3, 4, 5], prazo: null, horario: '', local: '', prioridade: 'normal', responsavel: null, exige_foto: false, ativa: true };
  S.fd.departamentos = depsDe(S.fd).length ? [...depsDe(S.fd)] : [S.fd.departamento_id];
  S.conversa = null; S.rasc = null;
  folha({ titulo: d ? 'Editar demanda' : 'Nova demanda', tipo: 'demanda', esq: ['Cancelar', 'fecharFolha()'], dir: [d ? 'Salvar' : 'Criar', 'salvarDemanda()'], corpo: corpoFD() });
  if (!d) setTimeout(() => { const i = $('#fdT'); if (i && matchMedia('(min-width:700px)').matches) i.focus(); }, 350);
}
function corpoFD() {
  const f = S.fd, doDep = p => (p.departamentos || []).some(x => f.departamentos.includes(x));
  const pessoas = S.perfis.filter(p => p.ativo).sort((a, b) => (doDep(b) - doDep(a)) || a.nome.localeCompare(b.nome));
  const todosDeps = S.deps.length > 1 && S.deps.every(d => f.departamentos.includes(d.id));
  const locais = [...new Set([...LOCAIS, ...S.dem.map(d => d.local).filter(Boolean)])];
  let h = `<div class="cap">Demanda</div><div class="grp">
    <div class="fld"><input id="fdT" class="l" maxlength="160" placeholder="Título (ex.: Limpar banheiros do 3º andar)" value="${esc(f.titulo)}" oninput="S.fd.titulo=this.value"></div>
    <div class="fld"><textarea placeholder="Detalhes, passo a passo ou materiais (opcional)" oninput="S.fd.descricao=this.value">${esc(f.descricao || '')}</textarea></div></div>
    <div class="cap">Departamentos</div><div class="grp"><div class="fld blk"><div class="pills wrap">${S.deps.map(d => `<button class="pill ${f.departamentos.includes(d.id) ? 'on' : ''}" style="--c:${d.cor}" onclick="fdDep('${d.id}')">${f.departamentos.includes(d.id) ? ic('check', 'xs') : ''}${esc(d.nome)}</button>`).join('')}${S.deps.length > 1 ? `<button class="pill ${todosDeps ? 'on' : ''}" onclick="fdTodos()">${todosDeps ? ic('check', 'xs') : ''}Todos</button>` : ''}</div></div></div>
    <p class="note">${f.departamentos.length > 1 ? 'Aparece para as pessoas de todos os departamentos marcados. Quem concluir primeiro resolve.' : 'Toque em mais de um departamento para que todos possam resolver.'}</p>
    <div class="cap">Frequência</div>${seg([['diaria', 'Diária (repete)'], ['especifica', 'Específica (uma vez)']], f.tipo, "fdSet.bind(null,'tipo')").replace('class="seg"', 'class="seg" style="margin:0 0 10px"')}`;
  if (f.tipo === 'diaria') {
    h += `<div class="grp"><div class="fld blk"><div class="days">${SEM1.map((l, i) => `<button class="${f.dias_semana.includes(i) ? 'on' : ''}" onclick="fdDia(${i})" aria-label="${SEM[i]}">${l}</button>`).join('')}</div>
      <div class="pills wrap" style="margin-top:12px"><button class="pill" onclick="fdSet('dias_semana',[1,2,3,4,5])">Seg a Sex</button><button class="pill" onclick="fdSet('dias_semana',[1,2,3,4,5,6])">Seg a Sáb</button><button class="pill" onclick="fdSet('dias_semana',[0,1,2,3,4,5,6])">Todos os dias</button></div></div></div>
      <p class="note">Aparece para a equipe em cada dia marcado: ${esc(diasTxt(f.dias_semana).toLowerCase())}.</p>`;
  } else {
    h += `<div class="grp"><div class="fld"><label>Prazo</label><input type="date" value="${esc(f.prazo || '')}" onchange="S.fd.prazo=this.value||null"></div></div><p class="note">Fica na lista até alguém concluir. O prazo é opcional.</p>`;
  }
  h += `<div class="cap">Onde e quando</div><div class="grp">
      <div class="fld"><label>Local</label><input list="dlLocais" placeholder="Ex.: 3º andar" value="${esc(f.local || '')}" oninput="S.fd.local=this.value"></div>
      <div class="fld"><label>Horário</label><input placeholder="Ex.: até 10h" value="${esc(f.horario || '')}" oninput="S.fd.horario=this.value"></div></div>
    <datalist id="dlLocais">${locais.map(l => `<option value="${esc(l)}">`).join('')}</datalist>
    <div class="cap">Quem faz</div><div class="grp"><div class="fld"><label>Responsável</label><select onchange="S.fd.responsavel=this.value||null">
      <option value="">${f.departamentos.length > 1 ? 'Qualquer pessoa dos departamentos' : 'Qualquer pessoa do departamento'}</option>${pessoas.map(p => `<option value="${p.id}" ${f.responsavel === p.id ? 'selected' : ''}>${esc(p.nome)}${doDep(p) ? '' : ' (outro depto.)'}</option>`).join('')}</select></div></div>
    <p class="note">Com responsável, só essa pessoa vê a demanda.</p>
    <div class="cap">Prioridade</div>${seg([['normal', 'Normal'], ['alta', 'Alta'], ['urgente', 'Urgente']], f.prioridade, "fdSet.bind(null,'prioridade')").replace('class="seg"', 'class="seg" style="margin:0"')}
    <div class="grp" style="margin-top:22px"><div class="fld"><label>Exigir foto para concluir</label><label class="sw"><input type="checkbox" ${f.exige_foto ? 'checked' : ''} onchange="S.fd.exige_foto=this.checked"><span></span></label></div></div>`;
  if (f.id) {
    h += `<div class="cap">Mais opções</div><div class="list">
      <button class="row tap" onclick="duplicarDemanda()"><span style="color:var(--blue)">${ic('copiar')}</span><span class="grow t1">Duplicar</span></button>
      <button class="row tap" onclick="arquivarDemanda()"><span style="color:var(--blue)">${ic('arquivo')}</span><span class="grow t1">${f.ativa ? 'Arquivar (sai da lista da equipe)' : 'Reativar'}</span></button>
      <button class="row tap" onclick="excluirDemanda()"><span style="color:var(--red)">${ic('lixo')}</span><span class="grow t1" style="color:var(--red)">Excluir com o histórico</span></button></div>
      <p class="note">Criada em ${esc(fmtDataHora(f.criado_em))}.</p>`;
  }
  return h + '<div style="height:20px"></div>';
}
function fdSet(k, v) { S.fd[k] = v; corpoFolha(corpoFD()); }
function fdDep(id) {
  const a = S.fd.departamentos;
  if (a.includes(id)) { if (a.length === 1) return toast('Marque pelo menos um departamento.'); S.fd.departamentos = a.filter(x => x !== id); }
  else S.fd.departamentos = [...a, id];
  corpoFolha(corpoFD());
}
function fdTodos() {
  const todos = S.deps.every(d => S.fd.departamentos.includes(d.id));
  S.fd.departamentos = todos ? [S.fd.departamentos[0]] : S.deps.map(d => d.id);
  corpoFolha(corpoFD());
}
function fdDia(i) { const a = S.fd.dias_semana; S.fd.dias_semana = a.includes(i) ? a.filter(x => x !== i) : [...a, i].sort(); corpoFolha(corpoFD()); }
async function salvarDemanda() {
  const f = S.fd;
  f.titulo = (f.titulo || '').trim();
  if (!f.titulo) { toast('Dê um título para a demanda.'); const i = $('#fdT'); if (i) i.focus(); return; }
  if (f.tipo === 'diaria' && !f.dias_semana.length) return toast('Escolha pelo menos um dia da semana.');
  const deps = S.deps.filter(d => f.departamentos.includes(d.id)).map(d => d.id);
  if (!deps.length) return toast('Marque pelo menos um departamento.');
  const dados = { titulo: f.titulo, descricao: (f.descricao || '').trim() || null, departamento_id: deps[0], departamentos: deps, tipo: f.tipo, dias_semana: f.tipo === 'diaria' ? f.dias_semana : [], prazo: f.tipo === 'especifica' ? f.prazo || null : null, horario: (f.horario || '').trim() || null, local: (f.local || '').trim() || null, prioridade: f.prioridade, responsavel: f.responsavel || null, exige_foto: !!f.exige_foto };
  const fim = ocupado($('#dirBtn'));
  const { error } = f.id ? await S.sb.from('dm_demandas').update(dados).eq('id', f.id) : await S.sb.from('dm_demandas').insert(dados);
  fim();
  if (error) return toast(erroTxt(error));
  fecharFolha(); toast(f.id ? 'Demanda atualizada' : 'Demanda criada');
  if (!f.id) { S.f.dt = f.tipo; }
  recarregar(true);
}
function duplicarDemanda() { const c = { ...S.fd, titulo: S.fd.titulo + ' (cópia)', ativa: true }; delete c.id; delete c.criado_em; delete c.atualizado_em; delete c.criado_por; formDemanda(null, c); }
async function arquivarDemanda() {
  const f = S.fd;
  const { error } = await S.sb.from('dm_demandas').update({ ativa: !f.ativa }).eq('id', f.id);
  if (error) return toast(erroTxt(error));
  fecharFolha(); toast(f.ativa ? 'Demanda arquivada' : 'Demanda reativada'); recarregar(true);
}
async function excluirDemanda() {
  const f = S.fd, n = S.exe.filter(e => e.demanda_id === f.id).length;
  if (!(await perguntar('Excluir esta demanda?', n ? `Ela tem ${plural(n, 'conclusão registrada', 'conclusões registradas')}. Tudo será apagado, inclusive as fotos. Para manter o histórico, use Arquivar.` : 'Esta ação não pode ser desfeita.', 'Excluir', true))) return;
  const fotos = S.exe.filter(e => e.demanda_id === f.id).flatMap(e => e.fotos || []);
  const { error } = await S.sb.from('dm_demandas').delete().eq('id', f.id);
  if (error) return toast(erroTxt(error));
  if (fotos.length) S.sb.storage.from(BUCKET).remove(fotos).catch(() => { });
  fecharFolha(); toast('Demanda excluída'); recarregar(true);
}

/* ---------------- HISTÓRICO ---------------- */
function periodo() {
  const h = hoje(), p = S.f.hp || '7';
  if (p === 'hoje') return [h, h];
  if (p === '30') return [addDias(h, -29), h];
  if (p === 'per') return [S.f.hde || addDias(h, -6), S.f.hate || h];
  return [addDias(h, -6), h];
}
async function buscarHist() {
  const [de, ate] = periodo(), k = de + ate;
  if (S.hist && S.hist.k === k) return;
  S.hist = { k, l: [], carregando: true }; render();
  const ini = new Date(de + 'T00:00:00').toISOString(), fim = new Date(addDias(ate, 1) + 'T00:00:00').toISOString();
  const { data, error } = await S.sb.from('dm_execucoes').select('*').gte('concluida_em', ini).lt('concluida_em', fim).order('concluida_em', { ascending: false }).limit(5000);
  if (S.hist.k !== k) return;
  S.hist = { k, l: data || [], erro: error && erroTxt(error) }; render();
}
function execsDoPeriodo() {
  const [de, ate] = periodo(), limite = addDias(hoje(), -44);
  let l;
  if (de >= limite) l = [...S.exe, ...Object.values(S.pend)];
  else { if (!S.hist || S.hist.k !== de + ate) { setTimeout(buscarHist); return null; } if (S.hist.carregando) return null; l = [...S.hist.l, ...Object.values(S.pend)]; }
  return l.filter(e => { const d = isoDe(e.concluida_em); return d >= de && d <= ate; }).sort((a, b) => new Date(b.concluida_em) - new Date(a.concluida_em));
}
function vHistorico() {
  const p = S.f.hp || '7', [de, ate] = periodo();
  let l = execsDoPeriodo();
  const acts = gestor() ? `<button class="circ" onclick="exportarCSV()" aria-label="Baixar planilha">${ic('baixar', 's')}</button><button class="circ" onclick="print()" aria-label="Imprimir">${ic('print', 's')}</button>` : '';
  let html = cab('Histórico', p === 'hoje' ? fmtLonga(de) : `${fmtCurta(de)} a ${fmtCurta(ate)}`, acts);
  html += seg([['hoje', 'Hoje'], ['7', '7 dias'], ['30', '30 dias'], ['per', 'Período']], p, "filtro.bind(null,'hp')");
  if (p === 'per') html += `<div class="grp" style="margin-bottom:14px"><div class="fld"><label>De</label><input type="date" value="${de}" max="${ate}" onchange="S.f.hde=this.value;render()"></div><div class="fld"><label>Até</label><input type="date" value="${ate}" max="${hoje()}" onchange="S.f.hate=this.value;render()"></div></div>`;
  const meusDeps = gestor() ? S.deps : S.deps.filter(d => (S.me.departamentos || []).includes(d.id));
  if (gestor()) {
    html += `<div class="pills"><button class="pill ${!S.f.hd ? 'on' : ''}" onclick="filtro('hd',null)">Todos</button>${meusDeps.map(d => `<button class="pill ${S.f.hd === d.id ? 'on' : ''}" style="--c:${d.cor}" onclick="filtro('hd','${d.id}')">${esc(d.nome)}</button>`).join('')}</div>
      <div class="grp" style="margin-bottom:14px"><div class="fld"><label>Pessoa</label><select onchange="filtro('hpe',this.value||null)"><option value="">Todas</option>${S.perfis.map(x => `<option value="${x.id}" ${S.f.hpe === x.id ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></div></div>`;
  } else {
    html += `<div class="pills"><button class="pill ${S.f.hmeu !== false ? 'on' : ''}" onclick="filtro('hmeu',true)">Minhas</button><button class="pill ${S.f.hmeu === false ? 'on' : ''}" onclick="filtro('hmeu',false)">Do meu setor</button></div>`;
  }
  if (!l) return html + '<div class="empty"><div class="spin" style="margin:0 auto"></div></div>';
  if (S.hist && S.hist.erro && de < addDias(hoje(), -44)) html += `<div class="net">${esc(S.hist.erro)}</div>`;
  if (gestor()) { if (S.f.hd) l = l.filter(e => e.departamento_id === S.f.hd); if (S.f.hpe) l = l.filter(e => e.concluida_por === S.f.hpe); }
  else if (S.f.hmeu !== false) l = l.filter(e => e.concluida_por === S.user.id);
  S.histVis = l;
  if (!l.length) return html + vazio('hist', 'Nenhuma conclusão no período', 'As demandas concluídas aparecem aqui com fotos e observações.');
  const ativas = l.filter(e => !e.reaberta_em), comFoto = ativas.filter(e => (e.fotos || []).length).length, comObs = ativas.filter(e => e.observacao).length;
  html += `<div class="stat"><div class="card"><b>${ativas.length}</b><span>concluídas</span></div><div class="card"><b>${comFoto}</b><span>com foto</span></div><div class="card"><b>${comObs}</b><span>com observação</span></div></div>`;
  const dias = {};
  l.forEach(e => (dias[isoDe(e.concluida_em)] = dias[isoDe(e.concluida_em)] || []).push(e));
  for (const [d, es] of Object.entries(dias)) {
    html += `<div class="sec"><span>${esc(fmtLonga(d))}</span><span>${es.length}</span></div><div class="list">${es.map(e => {
      const dm = dem(e.demanda_id), dp = dep(e.departamento_id || (dm && dm.departamento_id)), f = (e.fotos || [])[0];
      return `<button class="row" style="--ind:68px" onclick="${e._pend ? `abrirItem('${e.demanda_id}','${e.ref}')` : `abrirExec('${e.id}')`}">
        ${f ? `<span class="thumbs">${imgFoto(f)}</span>` : `<span class="chk ${e._pend ? 'wait' : 'ok'}" style="margin:0 7px">${ic('check', 'xs')}</span>`}
        <span class="grow"><div class="t1">${esc(e.titulo || (dm && dm.titulo) || 'Demanda')}</div>
        <div class="t2">${e.reaberta_em ? '<span class="chip red">Reaberta</span>' : ''}${dp ? `<span class="chip c" style="--c:${dp.cor}">${esc(dp.nome)}</span>` : ''}${esc(primeiroNome(nomeDe(e.concluida_por)))} · ${hora(e.concluida_em)}${(e.fotos || []).length > 1 ? ` · ${ic('foto', 'xs')} ${e.fotos.length}` : ''}</div>
        ${e.observacao ? `<div class="t2" style="font-style:italic;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">“${esc(e.observacao)}”</div>` : ''}</span>
        <span class="chev">${ic('chev', 's')}</span></button>`;
    }).join('')}</div>`;
  }
  return html;
}
function exportarCSV() {
  const l = S.histVis || [];
  if (!l.length) return toast('Nada para exportar no período.');
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const linhas = [['Data', 'Hora', 'Demanda', 'Departamento', 'Tipo', 'Concluída por', 'Observação', 'Fotos', 'Situação'].map(q).join(';')];
  l.forEach(e => { const dm = dem(e.demanda_id); linhas.push([fmtCurta(isoDe(e.concluida_em)) + '/' + isoDe(e.concluida_em).slice(0, 4), hora(e.concluida_em), e.titulo || (dm && dm.titulo), (dep(e.departamento_id) || {}).nome, e.ref === 'unica' ? 'Específica' : 'Diária', nomeDe(e.concluida_por), e.observacao, (e.fotos || []).length, e.reaberta_em ? 'Reaberta em ' + fmtDataHora(e.reaberta_em) : 'Concluída'].map(q).join(';')); });
  const [de, ate] = periodo();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  a.download = `demandas-concluidas_${de}_a_${ate}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ---------------- EQUIPE (gestor) ---------------- */
function vEquipe() {
  const aba = S.f.eq || 'pessoas';
  let html = cab('Equipe', null, `<button class="circ blue" onclick="${aba === 'pessoas' ? 'formUsuario()' : 'formDep()'}" aria-label="${aba === 'pessoas' ? 'Novo usuário' : 'Novo departamento'}">${ic('mais', 's')}</button>`);
  html += seg([['pessoas', 'Pessoas'], ['deps', 'Departamentos']], aba, "filtro.bind(null,'eq')");
  const h = hoje();
  if (aba === 'pessoas') {
    const lin = p => {
      const n = S.exe.filter(e => e.concluida_por === p.id && isoDe(e.concluida_em) === h).length;
      return `<button class="row ${p.ativo ? '' : 'off'}" style="--ind:64px" onclick="formUsuario('${p.id}')"><span class="av" style="background:${corPessoa(p)}">${esc(ini(p.nome))}</span>
        <span class="grow"><div class="t1">${esc(p.nome)}${p.id === S.user.id ? ' <span class="muted small">(você)</span>' : ''}</div><div class="t2">${esc(loginVisivel(p))}${p.departamentos && p.departamentos.length ? ' · ' + esc(nomesDeps(p.departamentos)) : ''}${p.ativo ? '' : ' <span class="chip">Inativo</span>'}</div></span>
        ${n ? `<span class="num">${n} hoje</span>` : ''}<span class="chev">${ic('chev', 's')}</span></button>`;
    };
    const ges = S.perfis.filter(p => p.papel === 'gestor'), col = S.perfis.filter(p => p.papel !== 'gestor').sort((a, b) => (b.ativo - a.ativo) || a.nome.localeCompare(b.nome));
    if (!col.length) html += `<div class="card pad" style="margin-bottom:6px"><b>Crie o acesso da sua equipe</b><p class="muted" style="margin:6px 0 12px;font-size:15px">Cada pessoa recebe um usuário e uma senha, sem precisar de e-mail. Ela vê só as demandas do(s) seu(s) departamento(s).</p><button class="btn sm" onclick="formUsuario()">${ic('mais', 's')} Novo usuário</button></div>`;
    else html += `<div class="sec"><span>Colaboradores</span><span>${col.filter(p => p.ativo).length}</span></div><div class="list">${col.map(lin).join('')}</div>`;
    html += `<div class="sec"><span>Gestores</span></div><div class="list">${ges.map(lin).join('')}</div>`;
    html += `<p class="note">Endereço para a equipe: <b>${esc(urlApp())}</b></p>`;
  } else {
    html += S.deps.length ? `<div class="list">${S.deps.map(d => {
      const nd = S.dem.filter(x => temDep(x, d.id) && x.ativa).length, np = S.perfis.filter(p => p.ativo && (p.departamentos || []).includes(d.id)).length;
      return `<button class="row" style="--ind:42px" onclick="formDep('${d.id}')"><span class="dot" style="background:${d.cor};width:14px;height:14px"></span><span class="grow"><div class="t1">${esc(d.nome)}</div><div class="t2">${plural(nd, 'demanda ativa', 'demandas ativas')} · ${plural(np, 'pessoa', 'pessoas')}</div></span><span class="chev">${ic('chev', 's')}</span></button>`;
    }).join('')}</div>` : vazio('tag', 'Nenhum departamento', 'Crie departamentos como Limpeza, Manutenção e Recepção.');
  }
  return html;
}
const urlApp = () => location.origin + location.pathname.replace(/index\.html$/, '');

function formUsuario(id) {
  const p = id ? perfil(id) : null;
  S.fu = p ? { id: p.id, nome: p.nome, login: p.login, papel: p.papel, departamentos: [...(p.departamentos || [])], ativo: p.ativo }
    : { nome: '', login: '', senha: gerarSenha(), papel: 'colaborador', departamentos: S.deps.length === 1 ? [S.deps[0].id] : [], manual: false };
  if (!p && donoPainel() && !S.equipe) carregarEquipePainel();
  folha({ titulo: p ? p.nome : 'Novo usuário', tipo: 'usuario', esq: ['Cancelar', 'fecharFolha()'], dir: [p ? 'Salvar' : 'Criar', 'salvarUsuario()'], corpo: corpoFU() });
}
function corpoFU() {
  const f = S.fu, novo = !f.id, eu = f.id === S.user.id;
  let h = '';
  if (!novo) {
    const n30 = S.exe.filter(e => e.concluida_por === f.id && Date.now() - new Date(e.concluida_em) < 30 * 864e5).length;
    h += `<div class="prof"><span class="av l" style="background:${corPessoa(perfil(f.id))}">${esc(ini(f.nome))}</span><div class="muted">${esc(loginVisivel(f))}${f.ativo ? '' : ' · inativo'}</div><div class="small muted" style="margin-top:4px">${plural(n30, 'demanda concluída', 'demandas concluídas')} nos últimos 30 dias</div></div>`;
  }
  if (novo && S.equipe && S.equipe.length) {
    const tem = new Set(S.perfis.map(x => slug(x.nome)));
    const livres = S.equipe.filter(x => !tem.has(slug(x.nome)));
    h += `<div class="cap">Da equipe do painel</div><div class="grp"><div class="fld"><select id="fuEq" onchange="fuEquipe(this.value)" style="flex:1;border:0;background:none;font:inherit;color:inherit;padding:0">
      <option value="">${livres.length ? 'Escolher colaborador…' : 'Todos da equipe já têm acesso'}</option>${livres.map(x => `<option value="${esc(x.id)}" ${f.eq === x.id ? 'selected' : ''}>${esc(x.nome)}${x.cargo ? ' · ' + esc(x.cargo) : ''}</option>`).join('')}</select></div></div>
      <p class="note">Preenche o nome e sugere o departamento pelo cargo. Ou digite abaixo para alguém de fora da lista.</p>`;
  }
  h += `<div class="cap">Dados</div><div class="grp"><div class="fld"><label>Nome</label><input id="fuNome" maxlength="80" placeholder="Nome e sobrenome" value="${esc(f.nome)}" oninput="fuNome(this.value)"></div>`;
  if (novo) h += `<div class="fld"><label>Usuário</label><input id="fuLogin" maxlength="31" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="ex.: maria" value="${esc(f.login)}" oninput="S.fu.login=this.value.toLowerCase().replace(/\\s/g,'');S.fu.manual=true"></div>
      <div class="fld"><label>Senha</label><input id="fuSenha" class="cred" style="font-size:17px" maxlength="40" value="${esc(f.senha)}" oninput="S.fu.senha=this.value"><button class="link" style="font-size:15px" onclick="S.fu.senha=gerarSenha();$('#fuSenha').value=S.fu.senha">Gerar</button></div>`;
  h += `</div>`;
  if (novo) h += `<p class="note">A pessoa entra só com o usuário e a senha, sem e-mail. Depois de criar, você pode enviar o acesso pelo WhatsApp.</p>`;
  h += `<div class="cap">Departamentos</div><div class="grp"><div class="fld blk">${S.deps.length ? `<div class="pills wrap">${S.deps.map(d => `<button class="pill ${f.departamentos.includes(d.id) ? 'on' : ''}" style="--c:${d.cor}" onclick="fuDep('${d.id}')">${f.departamentos.includes(d.id) ? ic('check', 'xs') : ''}${esc(d.nome)}</button>`).join('')}</div>` : '<span class="muted">Crie departamentos na aba Departamentos.</span>'}</div></div>
    <p class="note">A pessoa vê as demandas de todos os departamentos marcados.</p>`;
  if (!eu) h += `<div class="cap">Papel</div>${seg([['colaborador', 'Colaborador'], ['gestor', 'Gestor']], f.papel, 'fuPapel').replace('class="seg"', 'class="seg" style="margin:0"')}
    <p class="note">${f.papel === 'gestor' ? 'Gestor cria demandas e usuários e vê tudo. Não tem acesso ao painel de Colaboradores.' : 'Colaborador vê e conclui as demandas dos seus departamentos e envia feedbacks.'}</p>`;
  if (!novo && !eu) {
    h += `<div class="cap">Acesso</div><div class="list">
      <button class="row tap" onclick="novaSenha()"><span style="color:var(--blue)">${ic('chave')}</span><span class="grow t1">Redefinir senha</span><span class="chev">${ic('chev', 's')}</span></button>
      <button class="row tap" onclick="alternarAtivo()"><span style="color:${f.ativo ? 'var(--red)' : 'var(--green)'}">${ic(f.ativo ? 'x' : 'check')}</span><span class="grow t1" style="color:${f.ativo ? 'var(--red)' : 'var(--green)'}">${f.ativo ? 'Desativar acesso' : 'Reativar acesso'}</span></button></div>
      <p class="note">${f.ativo ? 'Ao desativar, a pessoa não consegue mais entrar. O histórico continua guardado.' : 'Acesso desativado.'}</p>`;
  }
  return h + '<div style="height:20px"></div>';
}
function fuNome(v) {
  S.fu.nome = v;
  if (S.fu.id || S.fu.manual) return;
  const w = slug(v).split('.').filter(Boolean);
  let l = w[0] || '';
  if (l && S.perfis.some(p => p.login === l) && w.length > 1) l = w[0] + '.' + w[w.length - 1];
  let n = 2, b = l; while (l && S.perfis.some(p => p.login === l)) l = b + n++;
  S.fu.login = l; const i = $('#fuLogin'); if (i) i.value = l;
}
async function carregarEquipePainel() {
  try {
    const { data, error } = await S.sb.from('records').select('id,data').eq('kind', 'p');
    if (error) throw error;
    S.equipe = (data || []).map(r => ({ id: r.id, nome: String((r.data || {}).nome || '').trim(), cargo: String((r.data || {}).cargo || '').trim() }))
      .filter(x => x.nome).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  } catch (e) { S.equipe = []; return; }
  if (S.fu && !S.fu.id && $('#sheet').classList.contains('on')) { const n = $('#fuNome'); if (n) S.fu.nome = n.value; corpoFolha(corpoFU()); }
}
function depDoCargo(c) {
  const t = slug(c), achar = re => (S.deps.find(d => re.test(slug(d.nome))) || {}).id;
  if (/limp|servicos.gerais|asg|zelad|copeir/.test(t)) return achar(/limp/);
  if (/manut|eletric|predial|tecnico.de.manut/.test(t)) return achar(/manut/);
  if (/recep|portar|atend/.test(t)) return achar(/recep|portar/);
  if (/(^|\.)ti(\.|$)|tecnologia|informatica|suporte|analista.de.ti/.test(t)) return achar(/(^|\.)ti(\.|$)|tecnologia|informatica/);
  return null;
}
function fuEquipe(id) {
  const x = (S.equipe || []).find(e => e.id === id); S.fu.eq = id;
  if (!x) return;
  S.fu.manual = false; fuNome(x.nome);
  const d = depDoCargo(x.cargo); if (d) S.fu.departamentos = [d];
  corpoFolha(corpoFU());
}
function fuDep(id) { const a = S.fu.departamentos; S.fu.departamentos = a.includes(id) ? a.filter(x => x !== id) : [...a, id]; const n = $('#fuNome'); if (n) S.fu.nome = n.value; corpoFolha(corpoFU()); }
function fuPapel(v) { S.fu.papel = v; const n = $('#fuNome'); if (n) S.fu.nome = n.value; corpoFolha(corpoFU()); }
async function salvarUsuario() {
  const f = S.fu; f.nome = (f.nome || '').trim();
  if (!f.nome) return toast('Informe o nome.');
  if (f.papel === 'colaborador' && !f.departamentos.length) return toast('Marque pelo menos um departamento.');
  const fim = ocupado($('#dirBtn'));
  if (f.id) {
    const { error } = await S.sb.from('dm_perfis').update({ nome: f.nome, papel: f.papel, departamentos: f.departamentos }).eq('id', f.id);
    fim();
    if (error) return toast(erroTxt(error));
    fecharFolha(); toast('Usuário atualizado'); recarregar(true); return;
  }
  const login = (f.login || '').trim().toLowerCase().replace(/^@/, '');
  const { error } = await S.sb.rpc('dm_criar_usuario', { p_nome: f.nome, p_login: login, p_senha: f.senha, p_papel: f.papel, p_departamentos: f.departamentos });
  fim();
  if (error) return toast(erroTxt(error));
  recarregar(true);
  credenciais(f.nome, login, f.senha, true);
}
function credenciais(nome, login, senha, novo) {
  const txt = `Olá, ${primeiroNome(nome)}! Este é o seu acesso ao app de Demandas do Boa Vista Corporate.\n\nEndereço: ${urlApp()}\nUsuário: ${login}\nSenha: ${senha}\n\nDica: abra o endereço no celular e toque em "Adicionar à Tela de Início" para usar como aplicativo.`;
  S.credTxt = txt;
  folha({ titulo: novo ? 'Acesso criado' : 'Nova senha', tipo: 'cred', dir: ['OK', 'fecharFolha()'], corpo: `
    <div class="empty" style="padding:16px 0 8px"><div class="ic" style="--c:var(--green)">${ic('check')}</div><b>${esc(nome)}</b>${novo ? 'já pode entrar no app.' : 'Senha redefinida.'}</div>
    <div class="grp"><div class="fld"><label>Endereço</label><input readonly value="${esc(urlApp())}" style="font-size:15px"></div><div class="fld"><label>Usuário</label><span class="cred" style="margin-left:auto">${esc(login)}</span></div><div class="fld"><label>Senha</label><span class="cred" style="margin-left:auto">${esc(senha)}</span></div></div>
    <p class="note">Anote ou envie agora: por segurança, a senha não fica visível depois.</p>
    <div class="stack" style="margin-top:18px">
      <a class="btn green" href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">${ic('fb', 's')} Enviar pelo WhatsApp</a>
      ${navigator.share ? `<button class="btn tint" onclick="navigator.share({text:S.credTxt}).catch(()=>{})">${ic('share', 's')} Compartilhar…</button>` : ''}
      <button class="btn tint" onclick="copiar(S.credTxt)">${ic('copiar', 's')} Copiar</button></div>` });
}
async function copiar(t) { try { await navigator.clipboard.writeText(t); toast('Copiado'); } catch (e) { toast('Não foi possível copiar'); } }
function novaSenha() {
  const f = S.fu, s = gerarSenha();
  folha({ titulo: 'Redefinir senha', tipo: 'senha', esq: ['Cancelar', `formUsuario('${f.id}')`], dir: ['Salvar', 'salvarNovaSenha()'], corpo: `
    <div class="cap">Nova senha de ${esc(primeiroNome(f.nome))}</div><div class="grp"><div class="fld"><input id="nsIn" class="l cred" style="font-size:20px" maxlength="40" value="${s}"><button class="link" style="font-size:15px" onclick="$('#nsIn').value=gerarSenha()">Gerar</button></div></div>
    <p class="note">Mínimo de 6 caracteres. A senha antiga deixa de funcionar.</p>` });
}
async function salvarNovaSenha() {
  const s = $('#nsIn').value.trim(), f = S.fu;
  if (s.length < 6) return toast('A senha precisa ter pelo menos 6 caracteres.');
  const fim = ocupado($('#dirBtn'));
  const { error } = await S.sb.rpc('dm_redefinir_senha', { p_id: f.id, p_senha: s });
  fim();
  if (error) return toast(erroTxt(error));
  credenciais(f.nome, f.login, s, false);
}
async function alternarAtivo() {
  const f = S.fu;
  if (f.ativo && !(await perguntar(`Desativar ${primeiroNome(f.nome)}?`, 'A pessoa não consegue mais entrar no app. Você pode reativar depois.', 'Desativar', true))) return;
  const { error } = await S.sb.rpc('dm_definir_ativo', { p_id: f.id, p_ativo: !f.ativo });
  if (error) return toast(erroTxt(error));
  fecharFolha(); toast(f.ativo ? 'Acesso desativado' : 'Acesso reativado'); recarregar(true);
}

function formDep(id) {
  const d = id ? dep(id) : null;
  S.fdp = d ? { ...d } : { nome: '', cor: CORES[S.deps.length % CORES.length], ordem: S.deps.length + 1 };
  folha({ titulo: d ? 'Departamento' : 'Novo departamento', tipo: 'dep', esq: ['Cancelar', 'fecharFolha()'], dir: [d ? 'Salvar' : 'Criar', 'salvarDep()'], corpo: corpoDep() });
}
function corpoDep() {
  const f = S.fdp;
  return `<div class="cap">Nome</div><div class="grp"><div class="fld"><input id="dpNome" class="l" maxlength="60" placeholder="Ex.: Limpeza" value="${esc(f.nome)}" oninput="S.fdp.nome=this.value"></div></div>
    <div class="cap">Cor</div><div class="grp"><div class="palette">${CORES.map(c => `<button class="${f.cor === c ? 'on' : ''}" style="--c:${c}" onclick="S.fdp.nome=$('#dpNome').value;S.fdp.cor='${c}';corpoFolha(corpoDep())" aria-label="Cor ${c}"></button>`).join('')}</div></div>
    ${f.id ? `<div style="height:22px"></div><div class="list"><button class="row tap" onclick="excluirDep()"><span style="color:var(--red)">${ic('lixo')}</span><span class="grow t1" style="color:var(--red)">Excluir departamento</span></button></div><p class="note">Só é possível excluir departamentos sem demandas.</p>` : ''}`;
}
async function salvarDep() {
  const f = S.fdp; f.nome = (f.nome || '').trim();
  if (!f.nome) return toast('Informe o nome.');
  const fim = ocupado($('#dirBtn'));
  const dados = { nome: f.nome, cor: f.cor, ordem: f.ordem || 0 };
  const { error } = f.id ? await S.sb.from('dm_departamentos').update(dados).eq('id', f.id) : await S.sb.from('dm_departamentos').insert(dados);
  fim();
  if (error) return toast(erroTxt(error));
  fecharFolha(); toast(f.id ? 'Departamento atualizado' : 'Departamento criado'); recarregar(true);
}
async function excluirDep() {
  const f = S.fdp;
  if (!(await perguntar(`Excluir ${f.nome}?`, 'As pessoas deixam de estar ligadas a ele.', 'Excluir', true))) return;
  const { error } = await S.sb.from('dm_departamentos').delete().eq('id', f.id);
  if (error) return toast(erroTxt(error));
  for (const p of S.perfis.filter(p => (p.departamentos || []).includes(f.id)))
    await S.sb.from('dm_perfis').update({ departamentos: p.departamentos.filter(x => x !== f.id) }).eq('id', p.id);
  fecharFolha(); toast('Departamento excluído'); recarregar(true);
}

/* ---------------- FEEDBACK ---------------- */
function vFeedback() {
  const g = gestor();
  let l = g ? S.fb : S.fb.filter(f => f.autor === S.user.id);
  let html = cab('Feedback', g ? 'Sugestões, problemas e recados da equipe' : 'Fale com o gestor: sugestões, problemas, falta de material', `<button class="circ blue" onclick="formFeedback()" aria-label="Novo feedback">${ic('mais', 's')}</button>`);
  if (g) {
    const aba = S.f.fa || 'abertos';
    const ab = l.filter(f => f.status !== 'resolvido');
    html += seg([['abertos', `Abertos${ab.length ? ' (' + ab.length + ')' : ''}`], ['resolvidos', 'Resolvidos']], aba, "filtro.bind(null,'fa')");
    l = aba === 'abertos' ? ab : l.filter(f => f.status === 'resolvido');
    if (!l.length) return html + vazio('fb', aba === 'abertos' ? 'Nenhum feedback em aberto' : 'Nada resolvido ainda', aba === 'abertos' ? 'Quando alguém da equipe enviar uma sugestão ou problema, aparece aqui.' : '', 'var(--green)');
  } else {
    html += `<button class="btn" onclick="formFeedback()">${ic('fb', 's')} Enviar feedback ou observação</button><div style="height:6px"></div>`;
    if (!l.length) return html + vazio('fb', 'Nenhum envio ainda', 'Use este espaço para sugerir melhorias, avisar problemas ou pedir material.');
    html += `<div class="sec"><span>Meus envios</span></div>`;
  }
  html += `<div class="stack">${l.map(f => {
    const [tn, tc] = TIPOS_FB[f.tipo] || TIPOS_FB.outro, dp = dep(f.departamento_id);
    return `<div class="card fb" role="button" tabindex="0" onclick="abrirFb('${f.id}')" style="cursor:pointer">
      <div class="top">${g ? `<span class="av" style="width:28px;height:28px;font-size:11.5px;background:${corPessoa(perfil(f.autor))}">${esc(ini(nomeDe(f.autor)))}</span><b style="font-size:15px">${esc(primeiroNome(nomeDe(f.autor)))}</b>` : ''}
        <span class="chip c" style="--c:${tc}">${esc(tn)}</span>${dp ? `<span class="chip c" style="--c:${dp.cor}">${esc(dp.nome)}</span>` : ''}
        ${f.status === 'novo' ? `<span class="chip blue">${g ? 'Novo' : 'Enviado'}</span>` : f.status === 'resolvido' ? '<span class="chip green">Resolvido</span>' : !g ? '<span class="chip">Lido</span>' : ''}
        <span class="muted" style="white-space:nowrap;margin-left:auto">${esc(fmtDataHora(f.criado_em))}</span></div>
      <p>${esc(f.texto)}</p>
      ${f.foto ? `<div class="thumbs" style="margin-top:8px">${imgFoto(f.foto)}</div>` : ''}
      ${f.resposta ? `<div class="reply"><b>Resposta${g ? '' : ' do gestor'}</b>${esc(f.resposta)}</div>` : ''}</div>`;
  }).join('')}</div>`;
  return html;
}
function formFeedback() {
  S.ff = { tipo: 'sugestao', departamento_id: (S.me.departamentos || [])[0] || null, texto: '', foto: null };
  folha({ titulo: 'Novo feedback', tipo: 'fb', esq: ['Cancelar', 'fecharFolha()'], dir: ['Enviar', 'enviarFeedback()'], corpo: corpoFF() });
}
function corpoFF() {
  const f = S.ff;
  return `<div class="cap">Tipo</div><div class="grp"><div class="fld blk"><div class="pills wrap">${Object.entries(TIPOS_FB).map(([k, [n, c]]) => `<button class="pill ${f.tipo === k ? 'on' : ''}" style="--c:${c}" onclick="ffSet('tipo','${k}')">${esc(n)}</button>`).join('')}</div></div></div>
    <div class="cap">Mensagem</div><div class="grp"><div class="fld"><textarea id="ffTxt" maxlength="4000" placeholder="${f.tipo === 'material' ? 'O que está faltando e onde?' : f.tipo === 'problema' ? 'O que aconteceu e onde?' : 'Escreva aqui…'}" oninput="S.ff.texto=this.value">${esc(f.texto)}</textarea></div></div>
    <div class="cap">Departamento</div><div class="grp"><div class="fld"><label>Sobre</label><select onchange="S.ff.departamento_id=this.value||null"><option value="">Geral</option>${S.deps.map(d => `<option value="${d.id}" ${f.departamento_id === d.id ? 'selected' : ''}>${esc(d.nome)}</option>`).join('')}</select></div></div>
    <div class="cap">Foto (opcional)</div><div class="photos" data-gal>${f.foto ? `<div class="ph"><img src="${f.foto.url}" alt="" onclick="verFoto(this)"><button class="x" onclick="ffSet('foto',null)" aria-label="Remover foto">${ic('x', 'xs')}</button></div>` : `<button class="add" onclick="escolherFotos(1,fs=>{if(fs[0])ffSet('foto',fs[0])})">${ic('camera')}<span>Adicionar</span></button>`}</div>
    <div style="height:20px"></div>`;
}
function ffSet(k, v) { const t = $('#ffTxt'); if (t) S.ff.texto = t.value; S.ff[k] = v; corpoFolha(corpoFF()); }
async function enviarFeedback() {
  const f = S.ff; const t = $('#ffTxt'); if (t) f.texto = t.value;
  f.texto = (f.texto || '').trim();
  if (!f.texto) return toast('Escreva a mensagem.');
  if (!navigator.onLine) return toast('Sem internet. Tente de novo quando conectar.');
  const fim = ocupado($('#dirBtn'), 'Enviando…');
  let foto = null;
  if (f.foto) {
    foto = `${S.user.id}/feedback/${crypto.randomUUID()}.jpg`;
    const { error } = await S.sb.storage.from(BUCKET).upload(foto, f.foto.blob, { contentType: 'image/jpeg' });
    if (error) { fim(); return toast('Erro ao enviar a foto: ' + erroTxt(error)); }
  }
  const { error } = await S.sb.from('dm_feedbacks').insert({ autor: S.user.id, tipo: f.tipo, departamento_id: f.departamento_id, texto: f.texto, foto });
  fim();
  if (error) return toast(erroTxt(error));
  fecharFolha(); toast(gestor() ? 'Registrado' : 'Enviado ao gestor'); recarregar(true);
}
async function abrirFb(id) {
  const f = S.fb.find(x => x.id === id); if (!f) return;
  const g = gestor(), [tn, tc] = TIPOS_FB[f.tipo] || TIPOS_FB.outro, dp = dep(f.departamento_id);
  if (g && f.status === 'novo') { f.status = 'lido'; S.sb.from('dm_feedbacks').update({ status: 'lido' }).eq('id', id).then(() => recarregar()); render(); }
  let h = `<div class="prof" style="text-align:left;display:flex;gap:12px;align-items:center"><span class="av" style="background:${corPessoa(perfil(f.autor))}">${esc(ini(nomeDe(f.autor)))}</span><div><b>${esc(nomeDe(f.autor))}</b><div class="muted small">${esc(fmtLonga(isoDe(f.criado_em)))}, às ${hora(f.criado_em)}</div></div></div>
    <div class="chips" style="margin:12px 0"><span class="chip c" style="--c:${tc}">${esc(tn)}</span>${dp ? `<span class="chip c" style="--c:${dp.cor}">${esc(dp.nome)}</span>` : ''}${f.status === 'resolvido' ? '<span class="chip green">Resolvido</span>' : ''}</div>
    <div class="obs">${esc(f.texto)}</div>
    ${f.foto ? `<div class="cap">Foto</div><div class="photos" data-gal><button class="ph" onclick="verFoto(this)">${imgFoto(f.foto)}</button></div>` : ''}`;
  if (g) {
    h += `<div class="cap">Resposta para ${esc(primeiroNome(nomeDe(f.autor)))}</div><div class="grp"><div class="fld"><textarea id="fbResp" placeholder="Escreva uma resposta (a pessoa vê no app)">${esc(f.resposta || '')}</textarea></div></div>
      <div class="stack" style="margin-top:16px"><button class="btn" onclick="responderFb('${id}',false)">${ic('enviar', 's')} Enviar resposta</button>
      <button class="btn ${f.status === 'resolvido' ? 'tint' : 'green'}" onclick="responderFb('${id}',true)">${f.status === 'resolvido' ? 'Reabrir' : ic('check', 's') + ' Marcar como resolvido'}</button>
      <button class="btn red" onclick="excluirFb('${id}')">${ic('lixo', 's')} Excluir</button></div>`;
  } else {
    h += f.resposta ? `<div class="reply" style="margin-top:14px"><b>Resposta do gestor · ${esc(fmtDataHora(f.respondido_em))}</b>${esc(f.resposta)}</div>` : `<p class="note" style="margin-top:12px">${f.status === 'novo' ? 'Enviado. O gestor ainda não viu.' : 'O gestor já viu sua mensagem.'}</p>`;
    if (f.status === 'novo') h += `<div style="height:16px"></div><button class="btn red" onclick="excluirFb('${id}')">${ic('lixo', 's')} Apagar envio</button>`;
  }
  folha({ titulo: 'Feedback', tipo: 'fbv', esq: ['Fechar', 'fecharFolha()'], corpo: h + '<div style="height:16px"></div>' });
}
async function responderFb(id, alternarResolvido) {
  const f = S.fb.find(x => x.id === id); if (!f) return;
  const r = ($('#fbResp') || {}).value; const resp = (r || '').trim();
  const dados = {};
  if (resp !== (f.resposta || '')) Object.assign(dados, { resposta: resp || null, respondido_por: S.user.id, respondido_em: new Date().toISOString() });
  if (alternarResolvido) dados.status = f.status === 'resolvido' ? 'lido' : 'resolvido';
  else if (!resp) return toast('Escreva a resposta.');
  if (!Object.keys(dados).length) return fecharFolha();
  const { error } = await S.sb.from('dm_feedbacks').update(dados).eq('id', id);
  if (error) return toast(erroTxt(error));
  fecharFolha(); toast(dados.status === 'resolvido' ? 'Marcado como resolvido' : dados.status ? 'Reaberto' : 'Resposta enviada'); recarregar(true);
}
async function excluirFb(id) {
  if (!(await perguntar('Excluir este feedback?', '', 'Excluir', true))) return;
  const f = S.fb.find(x => x.id === id);
  const { error } = await S.sb.from('dm_feedbacks').delete().eq('id', id);
  if (error) return toast(erroTxt(error));
  if (f && f.foto) S.sb.storage.from(BUCKET).remove([f.foto]).catch(() => { });
  fecharFolha(); toast('Excluído'); recarregar(true);
}

/* ---------------- PERFIL ---------------- */
function abrirPerfil() {
  const m = S.me;
  folha({ titulo: 'Meu perfil', tipo: 'perfil', dir: ['OK', 'fecharFolha()'], corpo: `
    <div class="prof"><span class="av l" style="background:${corPessoa(m)}">${esc(ini(m.nome))}</span><h2>${esc(m.nome)}</h2><div class="muted">${esc(loginVisivel(m))}</div>
      <div class="chips" style="justify-content:center;margin-top:10px"><span class="chip blue">${gestor() ? 'Gestor' : 'Colaborador'}</span>${(m.departamentos || []).map(id => dep(id)).filter(Boolean).map(d => `<span class="chip c" style="--c:${d.cor}">${esc(d.nome)}</span>`).join('')}</div></div>
    <div style="height:18px"></div><div class="list">
      ${m.login.includes('@') ? '' : `<button class="row tap" onclick="trocarSenha()"><span style="color:var(--blue)">${ic('chave')}</span><span class="grow t1">Trocar minha senha</span><span class="chev">${ic('chev', 's')}</span></button>`}
      ${linhaPush()}
      <button class="row tap" onclick="instalar()"><span style="color:var(--blue)">${ic('baixar')}</span><span class="grow t1">Instalar como aplicativo</span><span class="chev">${ic('chev', 's')}</span></button>
      ${gestor() && m.login.includes('@') ? `<a class="row tap" href="../" style="color:inherit;text-decoration:none"><span style="color:var(--blue)">${ic('painel')}</span><span class="grow t1">Painel de Colaboradores</span><span class="chev">${ic('chev', 's')}</span></a>` : ''}
      <button class="row tap" onclick="sair()"><span style="color:var(--red)">${ic('sair')}</span><span class="grow t1" style="color:var(--red)">Sair</span></button></div>
    <p class="note" style="text-align:center;margin-top:18px">Demandas · Boa Vista Corporate · versão ${APPV}</p>` });
}
function trocarSenha() {
  folha({ titulo: 'Trocar senha', tipo: 'senha', esq: ['Cancelar', 'abrirPerfil()'], dir: ['Salvar', 'salvarMinhaSenha()'], corpo: `
    <div class="cap">Nova senha</div><div class="grp"><div class="fld"><input id="ms1" class="l" type="password" autocomplete="new-password" placeholder="Nova senha (mínimo 6)"></div><div class="fld"><input id="ms2" class="l" type="password" autocomplete="new-password" placeholder="Repita a nova senha"></div></div>` });
}
async function salvarMinhaSenha() {
  const a = $('#ms1').value, b = $('#ms2').value;
  if (a.length < 6) return toast('A senha precisa ter pelo menos 6 caracteres.');
  if (a !== b) return toast('As senhas não são iguais.');
  const fim = ocupado($('#dirBtn'));
  const { error } = await S.sb.auth.updateUser({ password: a });
  fim();
  if (error) return toast(erroTxt(error));
  fecharFolha(); toast('Senha alterada');
}
async function instalar() {
  if (S.bip) { S.bip.prompt(); try { await S.bip.userChoice; } catch (e) { } S.bip = null; return; }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const ja = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  folha({ titulo: 'Instalar', tipo: 'inst', esq: ['Voltar', 'abrirPerfil()'], corpo: ja ? vazio('check', 'Já está instalado', 'Você está usando o app pela tela de início.', 'var(--green)') : `
    <div class="cap">${ios ? 'iPhone e iPad (Safari)' : 'Android (Chrome)'}</div><div class="card pad"><ol style="margin:0;padding-left:20px;line-height:1.7">${ios
      ? '<li>Toque em <b>Compartilhar</b> (o quadrado com a seta, na barra do Safari).</li><li>Escolha <b>Adicionar à Tela de Início</b>.</li><li>Toque em <b>Adicionar</b>.</li>'
      : '<li>Toque no menu <b>⋮</b> do Chrome.</li><li>Escolha <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>.</li><li>Confirme.</li>'}</ol></div>
    <p class="note">No computador (Chrome ou Edge), use o ícone de instalar na barra de endereço.</p>` });
}

/* Arrastar a folha para baixo fecha (pela barrinha/cabeçalho, ou pelo conteúdo quando ele já está no topo) — só no celular */
(function arrastarFolha() {
  const sh = () => $('#sheet');
  let y0 = 0, dy = 0, ativo = false, decidido = false, amostras = [];
  const celular = () => !matchMedia('(min-width:700px)').matches;
  addEventListener('touchstart', e => {
    const s = sh(); if (!s || !s.classList.contains('on') || !celular() || e.touches.length !== 1) return;
    if (!s.contains(e.target) || e.target.closest('input,textarea,select,.photos,.composer')) return;
    const bd = s.querySelector('.bd'), noCab = !!e.target.closest('.hd');
    if (!noCab && bd && bd.scrollTop > 0) return;
    y0 = e.touches[0].clientY; dy = 0; amostras = []; ativo = true; decidido = noCab;
  }, { passive: true });
  addEventListener('touchmove', e => {
    if (!ativo) return;
    const s = sh(), d = e.touches[0].clientY - y0;
    if (!decidido) { if (Math.abs(d) < 8) return; if (d < 0) { ativo = false; return; } decidido = true; }
    dy = Math.max(0, d);
    amostras.push([performance.now(), dy]); if (amostras.length > 6) amostras.shift();
    if (dy > 0 && e.cancelable) e.preventDefault();
    s.style.transition = 'none'; s.style.transform = `translateY(${dy}px)`;
    $('#veil').style.opacity = String(Math.max(0, 1 - dy / (s.offsetHeight || 600)));
  }, { passive: false });
  const soltar = () => {
    if (!ativo) return; ativo = false;
    const s = sh(), a = amostras[0], z = amostras[amostras.length - 1], v = a && z && z[0] > a[0] ? (z[1] - a[1]) / (z[0] - a[0]) : 0, fechar = dy > Math.min(140, (s.offsetHeight || 600) * 0.3) || (v > 0.4 && dy > 30);
    s.style.transition = ''; $('#veil').style.opacity = '';
    if (fechar) { s.style.transform = ''; fecharFolha(); }
    else s.style.transform = '';
    dy = 0;
  };
  addEventListener('touchend', soltar); addEventListener('touchcancel', soltar);
})();

/* ---------------- notificações no celular ---------------- */
const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const b64u = s => { const p = '='.repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
async function swPronto() { return Promise.race([navigator.serviceWorker.ready, sleep(8000).then(() => null)]); }
async function estadoPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return ehIOS() && !instalado() ? 'instalar' : 'sem';
  if (Notification.permission === 'denied') return 'negado';
  try { const r = await swPronto(); const sub = r && await r.pushManager.getSubscription(); return sub && Notification.permission === 'granted' ? 'ativo' : 'inativo'; } catch (e) { return 'inativo'; }
}
async function atualizarEstadoPush() { const e = await estadoPush(); if (e !== S.push) { S.push = e; render(); if ($('#sheet').classList.contains('on') && S.folhaTipo === 'perfil') abrirPerfil(); } return e; }
async function registrarPush(sub) {
  const j = sub.toJSON();
  const { error } = await S.sb.rpc('dm_push_registrar', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_aparelho: (navigator.userAgentData && navigator.userAgentData.platform) || (ehIOS() ? 'iPhone/iPad' : navigator.platform || '') });
  if (error) throw error;
}
async function ativarNotificacoes() {
  const e = await estadoPush();
  if (e === 'instalar') return instalar();
  if (e === 'sem') return toast('Este navegador não recebe notificações.');
  if (e === 'negado') return perguntar('Notificações bloqueadas', ehIOS() ? 'Libere em Ajustes › Notificações › Demandas e tente de novo.' : 'Libere as notificações deste site nas configurações do navegador (ícone ao lado do endereço) e tente de novo.', 'OK');
  try {
    if (await Notification.requestPermission() !== 'granted') { await atualizarEstadoPush(); return toast('Notificações não autorizadas.'); }
    const r = await swPronto(); if (!r) throw new Error('O app ainda está carregando. Tente de novo em alguns segundos.');
    const sub = (await r.pushManager.getSubscription()) || await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID) });
    await registrarPush(sub);
    try { localStorage.setItem('dm_push_aviso', 'fechado'); } catch (x) { }
    toast(gestor() ? 'Pronto! Você será avisado de conclusões e feedbacks.' : 'Pronto! Você será avisado de novas demandas e respostas.');
  } catch (x) { toast(/dm_push_registrar/.test(String(x && x.message)) ? 'Falta ativar as notificações no banco: rode a atualização 6 no Supabase.' : 'Não foi possível ativar: ' + erroTxt(x)); }
  atualizarEstadoPush();
}
async function desativarNotificacoes() {
  try { const r = await swPronto(), sub = r && await r.pushManager.getSubscription(); if (sub) { await S.sb.rpc('dm_push_remover', { p_endpoint: sub.endpoint }); await sub.unsubscribe(); } toast('Notificações desativadas neste aparelho.'); }
  catch (x) { toast(erroTxt(x)); }
  atualizarEstadoPush();
}
async function revalidarPush() {   // mantém o aparelho ligado à pessoa certa (ex.: celular compartilhado)
  try { if (Notification.permission !== 'granted') return; const r = await swPronto(), sub = r && await r.pushManager.getSubscription(); if (sub) await registrarPush(sub); } catch (x) { }
}
function avisoPush() {
  if (!['inativo', 'instalar'].includes(S.push)) return '';
  try { if (localStorage.getItem('dm_push_aviso') === 'fechado') return ''; } catch (x) { }
  return `<div class="card" style="display:flex;gap:12px;align-items:center;padding:14px 16px;margin-bottom:14px"><span style="color:var(--blue)">${ic('sino')}</span>
    <div style="flex:1"><b style="font-size:15px">Receba avisos no celular</b><div class="muted small">${S.push === 'instalar' ? 'No iPhone, adicione o app à Tela de Início para receber notificações.' : gestor() ? 'Demandas concluídas e feedbacks novos, mesmo com o app fechado.' : 'Novas demandas e respostas do gestor, mesmo com o app fechado.'}</div>
    <div style="display:flex;gap:8px;margin-top:10px"><button class="btn sm" onclick="ativarNotificacoes()">${S.push === 'instalar' ? 'Como instalar' : 'Ativar'}</button><button class="btn sm tint" onclick="try{localStorage.setItem('dm_push_aviso','fechado')}catch(e){};render()">Agora não</button></div></div></div>`;
}
const linhaPush = () => {
  const e = S.push || 'inativo';
  const txt = { ativo: 'Notificações ativadas', inativo: 'Ativar notificações', negado: 'Notificações bloqueadas', instalar: 'Ativar notificações', sem: 'Notificações indisponíveis' }[e];
  const sub = { ativo: 'Toque para desativar neste aparelho', negado: 'Libere nos ajustes do celular', instalar: 'Primeiro adicione o app à Tela de Início', sem: 'Este navegador não suporta', inativo: gestor() ? 'Conclusões e feedbacks, com o app fechado' : 'Novas demandas e respostas do gestor' }[e];
  return `<button class="row tap" onclick="${e === 'ativo' ? 'desativarNotificacoes()' : 'ativarNotificacoes()'}"><span style="color:${e === 'ativo' ? 'var(--green)' : 'var(--blue)'}">${ic('sino')}</span><span class="grow"><div class="t1">${txt}</div><div class="t2">${sub}</div></span>${e === 'ativo' ? `<span style="color:var(--green)">${ic('check', 's')}</span>` : `<span class="chev">${ic('chev', 's')}</span>`}</button>`;
};
/* abrir direto o que a notificação mostrou: #d=<demanda>~<dia> ou #fb=<feedback> */
function abrirDoLink(ultima) {
  const h = decodeURIComponent(location.hash || ''); if (!S.montado || !h) return;
  let m, achou = false;
  if ((m = h.match(/^#d=([0-9a-f-]{36})~(unica|\d{4}-\d{2}-\d{2})$/))) {
    if (dem(m[1]) || S.exe.some(e => e.demanda_id === m[1])) { achou = true; const ex = S.exe.find(e => e.demanda_id === m[1] && e.ref === m[2] && !e.reaberta_em); abrirItem(m[1], m[2], ex); }
  } else if ((m = h.match(/^#fb=([0-9a-f-]{36})$/))) {
    if (S.fb.some(f => f.id === m[1])) { achou = true; ir('feedback'); abrirFb(m[1]); }
  } else return;
  if (!achou && !ultima) { carregar().then(() => { render(); abrirDoLink(true); }).catch(() => abrirDoLink(true)); return; }   // item novo: busca e tenta de novo
  history.replaceState(null, '', location.pathname + location.search);
}
addEventListener('hashchange', () => abrirDoLink());
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => {
  if (e.data && e.data.tipo === 'abrir' && e.data.url) { const u = new URL(e.data.url); if (u.hash) { history.replaceState(null, '', location.pathname + u.hash); abrirDoLink(); } }
});

/* ---------------- início ---------------- */
addEventListener('scroll', topo, { passive: true });
addEventListener('online', () => { render(); enviarFila(); recarregar(); });
addEventListener('offline', () => render());
addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('#viewer').classList.contains('on')) fecharFoto(); else if ($('#sheet').classList.contains('on')) fecharFolha(); } if ($('#viewer').classList.contains('on') && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) passarFoto(e.key === 'ArrowLeft' ? -1 : 1); });
addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.bip = e; });
let diaAtual = hoje();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !S.montado) return;
  if (diaAtual !== hoje()) { diaAtual = hoje(); S.dia = null; render(); }
  if (Date.now() - (S.carregadoEm || 0) > 30000) recarregar();
  enviarFila();
});
setInterval(() => { if (S.montado && diaAtual !== hoje()) { diaAtual = hoje(); S.dia = null; render(); } }, 60000);

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  const antes = navigator.serviceWorker.controller && /\/demandas\//.test(navigator.serviceWorker.controller.scriptURL);
  navigator.serviceWorker.register('sw.js').catch(() => { });
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (antes) toast('Nova versão disponível', { txt: 'Atualizar', fn: () => location.reload() }); });
}

(async function boot() {
  if (!CFG.url || !CFG.key || !window.supabase) return telaSetup('config');
  S.sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });  // mesma sessão do painel: o gestor entra uma vez só
  let session = null;
  try { ({ data: { session } } = await S.sb.auth.getSession()); } catch (e) { }
  if (!session) return telaLogin();
  S.user = session.user;
  await entrar();
})();
