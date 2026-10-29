/* Tema claro/escuro, imagem da empresa e capa, e link público de visualização.
   Carregado ANTES de app.js: aqui só há declarações. Nada deste arquivo roda sozinho. */

const SVG = (d, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICO = {
  moon: SVG('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  sun: SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  share: SVG('<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>'),
  cam: SVG('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>', 16)
};
const SHARE_T = (location.hash.match(/^#v=([A-Za-z0-9_-]{20,64})$/) || [])[1] || null;

/* ---------- celular: barra inferior, cartões e ajustes ---------- */
const isMob = () => matchMedia('(max-width:720px)').matches;
const TABS = [
  ['painel', 'Painel', '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>'],
  ['equipe', 'Equipe', '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17.5 14.2c2.4.2 4 2 4 4.8"/>'],
  ['escalas', 'Escalas', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'],
  ['ambientes', 'Ambientes', '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 9h2a2 2 0 0 1 2 2v10"/><path d="M8 7h4M8 11h4M8 15h4M2 21h20"/>']
];
const MAIS = ['ferias', 'documentos', 'relatorios', 'notas', 'historico'];
function buildTabbar() {
  const t = $('#tabbar'); if (!t) return;
  t.innerHTML = TABS.map(([v, n, d]) => `<button data-v="${v}" onclick="go('${v}')">${SVG(d, 24)}<span>${n}</span></button>`).join('') + `<button data-v="mais" onclick="menuMais()"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg><span>Mais</span></button>`;
  syncTab();
}
function syncTab() {
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.v == view || (b.dataset.v == 'mais' && MAIS.includes(view))));
}
function menuMais() {
  const o = modal(`<h2>Mais</h2><div class="mais"><button onclick="location.href='demandas/'"><span>Demandas da equipe</span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg></button>${MAIS.map(v => `<button class="${v == view ? 'on' : ''}" data-v="${v}"><span>${NAV[v]}</span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>`).join('')}</div>`);
  o.querySelectorAll('.mais button[data-v]').forEach(b => b.onclick = () => { o.remove(); go(b.dataset.v); });
}
const escMob = () => `<h1>Escalas</h1><p class="sub">Horário de entrada e saída de cada pessoa. Toque num cartão para editar.</p><div class="stack">${sorted().map(p => `<div class="card click" onclick="edit('${p.id}')"><div class="row nb"><div class="t"><b>${esc(p.nome)}</b></div><span class="chip g">${hh(week(p))}/sem</span></div>${grp(p).map(x => { const i = x.indexOf(': '); return `<div class="gl"><span>${esc(x.slice(0, i))}</span><b>${esc(x.slice(i + 2))}</b></div>`; }).join('') || '<small>Sem escala</small>'}</div>`).join('')}</div>`;
const ferMob = () => `<h1>Férias</h1><p class="sub">Após 12 meses de admissão o direito nasce e a empresa tem mais 12 meses para conceder. Informe quantos períodos já foram gozados.</p><div class="stack">${sorted().map(p => { const f = fer(p); return `<div class="card"><div class="row nb"><div class="t"><b>${esc(p.nome)}</b><br><small>Admissão ${fd(p.adm)}</small></div><span class="chip ${f.c}">${f.st}</span></div><div class="gl"><span>Direito em</span><b>${fx(f.aq)}</b></div><div class="gl"><span>Limite</span><b>${fx(f.lim)}</b></div><div class="f fm"><label>Gozados<input type="number" min="0" max="40" value="${esc(p.gozadas)}" onchange="upd('${p.id}','gozadas',this.value)"></label><label>Início<input type="date" value="${p.fIni}" onchange="upd('${p.id}','fIni',this.value)"></label><label>Fim<input type="date" value="${p.fFim}" onchange="upd('${p.id}','fFim',this.value)"></label></div></div>`; }).join('')}</div>`;
matchMedia('(max-width:720px)').addEventListener && matchMedia('(max-width:720px)').addEventListener('change', () => { try { render(1); } catch (e) {} });

/* ---------- tema ---------- */
const THEME_KEY = 'bvc_theme', mq = matchMedia('(prefers-color-scheme: dark)');
const themePref = () => { try { return localStorage.getItem(THEME_KEY) || 'auto'; } catch (e) { return 'auto'; } };
const themeEff = () => { const p = themePref(); return p == 'auto' ? (mq.matches ? 'dark' : 'light') : p; };
function applyTheme() {
  const t = themeEff();
  document.documentElement.dataset.theme = t;
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t == 'dark' ? '#000000' : '#f5f5f7';
  const b = $('#tbtn');
  if (b) { b.innerHTML = t == 'dark' ? ICO.sun : ICO.moon; const l = t == 'dark' ? 'Usar tema claro' : 'Usar tema escuro'; b.title = l; b.setAttribute('aria-label', l); }
  document.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x.dataset.t == themePref()));
}
function setTheme(p) { try { localStorage.setItem(THEME_KEY, p); } catch (e) {} applyTheme(); }
const alternarTema = () => setTheme(themeEff() == 'dark' ? 'light' : 'dark');
if (mq.addEventListener) mq.addEventListener('change', () => { if (themePref() == 'auto') applyTheme(); });

/* ---------- imagem da empresa e capa ---------- */
const brand = () => db.brand || (db.brand = {});
function applyBrand() {
  const b = brand();
  const cv = $('.cover'); if (cv) cv.style.backgroundImage = b.cover ? `url("${b.cover}")` : '';
  const av = $('.avatar img'); if (av) { av.src = b.logo || 'assets/logo.png'; av.className = b.logo ? '' : 'def'; }
}
const heroData = () => new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const hero = () => `<section class="hero${brand().pos == 'c' ? ' c' : ''}"><div class="cover"><button class="b s cam" onclick="menuImagem('capa')">${ICO.cam}<span>${brand().cover ? 'Alterar capa' : 'Adicionar capa'}</span></button></div><div class="hrow"><div class="avw"><div class="avatar"><img alt=""></div><button class="b s ic cam2" onclick="menuImagem('logo')" aria-label="Trocar imagem da empresa" title="Trocar imagem da empresa">${ICO.cam}</button></div><div class="hinfo"><p class="sub" style="margin:0">${heroData()}</p></div></div></section>`;

/* editor de enquadramento: arrastar para posicionar, controle para ampliar ou reduzir */
function editorImagem(src, tipo, blob) {
  const capa = tipo == 'capa', ar = capa ? 3.2 : 1, OW = capa ? 1600 : 512, OH = Math.round(OW / ar), lim = capa ? 450000 : 250000;
  const im = new Image();
  im.onerror = () => { if (blob) URL.revokeObjectURL(src); toast('Não foi possível usar essa imagem'); };
  im.onload = () => {
    const iw = im.naturalWidth || 1, ih = im.naturalHeight || 1;
    const o = modal(`<h2>${capa ? 'Ajustar capa' : 'Ajustar imagem'}</h2><p class="sub" style="margin:0 0 12px">Arraste a imagem para posicionar e use o controle para ampliar ou reduzir.</p><div id="cf" style="position:relative;width:${capa ? '100%' : 'min(100%,300px)'};aspect-ratio:${ar};margin:0 auto 14px;border-radius:${capa ? 16 : 24}px;overflow:hidden;background:var(--seg);touch-action:none;cursor:grab"><canvas id="cv" style="width:100%;height:100%;display:block"></canvas></div><label style="display:flex;gap:12px;align-items:center;font-size:13px;color:var(--mut)">Tamanho<input type="range" id="cz" min="0" max="100" step="1" value="0" style="flex:1;padding:0"></label><div class="tools" style="margin-top:16px"><button class="b" id="cs">Salvar</button><button class="b s" id="cc">Centralizar</button><button class="b s" id="cx">Cancelar</button></div>`);
    const fr = $('#cf'), cv = $('#cv'), zs = $('#cz'), fw = fr.getBoundingClientRect().width || 300, fh = fw / ar, dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(fw * dpr); cv.height = Math.round(fh * dpr);
    const base = Math.max(fw / iw, fh / ih), zmin = Math.min(fw / iw, fh / ih) / base, zmax = 4;
    let z = 1, ox = 0, oy = 0;
    zs.value = (1 - zmin) / (zmax - zmin) * 100;
    const clamp = () => {
      const sw = iw * base * z, sh = ih * base * z;
      ox = sw > fw ? Math.max(-(sw - fw) / 2, Math.min((sw - fw) / 2, ox)) : 0;
      oy = sh > fh ? Math.max(-(sh - fh) / 2, Math.min((sh - fh) / 2, oy)) : 0;
    };
    const paint = (x, k) => { const s = base * z * k; x.drawImage(im, fw * k / 2 + ox * k - iw * s / 2, fh * k / 2 + oy * k - ih * s / 2, iw * s, ih * s); };
    const draw = () => { clamp(); const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); paint(x, cv.width / fw); };
    zs.oninput = () => { z = zmin + (zmax - zmin) * zs.value / 100; draw(); };
    let drag = null;
    fr.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY, ox, oy }; fr.setPointerCapture(e.pointerId); fr.style.cursor = 'grabbing'; };
    fr.onpointermove = e => { if (!drag) return; ox = drag.ox + e.clientX - drag.x; oy = drag.oy + e.clientY - drag.y; draw(); };
    fr.onpointerup = fr.onpointercancel = () => { drag = null; fr.style.cursor = 'grab'; };
    fr.onwheel = e => { e.preventDefault(); zs.value = Math.max(0, Math.min(100, +zs.value - Math.sign(e.deltaY) * 4)); zs.oninput(); };
    const fim = () => { if (blob) URL.revokeObjectURL(src); o.remove(); };
    $('#cx').onclick = fim;
    $('#cc').onclick = () => { ox = oy = 0; z = 1; zs.value = (1 - zmin) / (zmax - zmin) * 100; draw(); };
    $('#cs').onclick = () => {
      try {
        let k = 1, out = null;
        for (let i = 0; i < 8 && !out; i++) {
          const c = document.createElement('canvas'); c.width = Math.round(OW * k); c.height = Math.round(OH * k);
          const x = c.getContext('2d'); paint(x, c.width / fw);
          let alpha = false; const d = x.getImageData(0, 0, c.width, c.height).data;
          for (let q = 3; q < d.length; q += 44) if (d[q] < 250) { alpha = true; break; }
          if (alpha) { const pn = c.toDataURL('image/png'); if (pn.length <= lim) out = pn; }
          else for (const ql of [.88, .78, .68]) { const j = c.toDataURL('image/jpeg', ql); if (j.length <= lim) { out = j; break; } }
          k *= .8;
        }
        if (!out) return toast('Imagem muito pesada. Use outra.');
        const bd = brand(); bd[capa ? 'cover' : 'logo'] = out; bd.t = Date.now();
        lg('Alterado', 'Marca', capa ? 'Capa' : 'Imagem da empresa', [capa ? 'Capa ajustada' : 'Imagem da empresa ajustada']);
        save(1); fim(); applyBrand(); render(1); toast(capa ? 'Capa atualizada' : 'Imagem atualizada');
      } catch (e) { toast('Não foi possível salvar a imagem'); }
    };
    draw();
  };
  im.src = src;
}
function escolherImagem(tipo) {
  const i = document.createElement('input');
  i.type = 'file'; i.accept = 'image/*'; i.hidden = true; document.body.appendChild(i);
  i.onchange = () => { const f = i.files[0]; i.remove(); if (f) editorImagem(URL.createObjectURL(f), tipo, true); };
  i.click();
}
function removerImagem(tipo) {
  const capa = tipo == 'capa', b = brand();
  delete b[capa ? 'cover' : 'logo']; b.t = Date.now();
  lg('Alterado', 'Marca', capa ? 'Capa' : 'Imagem da empresa', [capa ? 'Capa removida' : 'Imagem voltou ao padrão']);
  save(1); applyBrand(); render(1);
}
function menuImagem(tipo) {
  const capa = tipo == 'capa', tem = !!brand()[capa ? 'cover' : 'logo'];
  const o = modal(`<h2>${capa ? 'Capa' : 'Imagem da empresa'}</h2>${capa ? '' : `<div class="seg" id="posseg" role="group" aria-label="Posição da imagem" style="margin-bottom:14px"><button data-p="l" class="${brand().pos == 'c' ? '' : 'on'}">Alinhar à esquerda</button><button data-p="c" class="${brand().pos == 'c' ? 'on' : ''}">Centralizar</button></div>`}<p class="sub" style="margin:0 0 14px">${capa ? 'Use uma imagem larga, de preferência na horizontal. Ela aparece no topo do Painel.' : 'Aparece no topo do app e no Painel. Pode ser uma foto ou um logo (PNG com fundo transparente funciona bem).'} A imagem é reduzida automaticamente e vale para todos os aparelhos.</p><div class="tools"><button class="b" id="ei">Escolher imagem</button>${tem ? `<button class="b s" id="aj">Ajustar enquadramento</button><button class="b d" id="ri">${capa ? 'Remover capa' : 'Voltar à imagem padrão'}</button>` : ''}<button class="b s" onclick="this.closest('.ov').remove()">Cancelar</button></div>`);
  o.querySelectorAll('#posseg button').forEach(x => x.onclick = () => {
    const b = brand(), v = x.dataset.p;
    if ((b.pos || 'l') == v) return;
    b.pos = v; b.t = Date.now();
    lg('Alterado', 'Marca', 'Imagem da empresa', [v == 'c' ? 'Imagem centralizada no Painel' : 'Imagem alinhada à esquerda no Painel']);
    save(1); render(1);
    o.querySelectorAll('#posseg button').forEach(y => y.classList.toggle('on', y.dataset.p == v));
  });
  $('#ei').onclick = () => { o.remove(); escolherImagem(tipo); };
  const aj = $('#aj'); if (aj) aj.onclick = () => { o.remove(); editorImagem(brand()[capa ? 'cover' : 'logo'], tipo); };
  const r = $('#ri'); if (r) r.onclick = () => { o.remove(); removerImagem(tipo); };
}
const opAparencia = () => `<h2 style="margin-top:20px">Aparência</h2><div class="seg" role="group" aria-label="Tema">${[['light', 'Claro'], ['dark', 'Escuro'], ['auto', 'Automático']].map(([k, v]) => `<button data-t="${k}" class="${themePref() == k ? 'on' : ''}" onclick="setTheme('${k}')">${v}</button>`).join('')}</div><small style="display:block;margin-top:6px">O tema vale só para este aparelho.</small><div class="tools" style="margin-top:14px"><button class="b s" onclick="menuImagem('logo')">Imagem da empresa</button><button class="b s" onclick="menuImagem('capa')">Capa</button></div>`;

/* ---------- link público de visualização ---------- */
const SHAREABLE = { painel: 'Painel', equipe: 'Equipe', escalas: 'Escalas', ambientes: 'Ambientes', ferias: 'Férias', relatorios: 'Relatórios' };
const fdh = t => new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const linkDe = t => location.origin + location.pathname + '#v=' + t;
function novoToken() {
  const a = new Uint8Array(24); crypto.getRandomValues(a);
  return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
/* tira de dentro do HTML tudo que poderia executar código */
function limpaHTML(h) {
  const d = new DOMParser().parseFromString('<body>' + h, 'text/html');
  d.querySelectorAll('script,iframe,object,embed,link,meta,style,form,base,svg script').forEach(e => e.remove());
  d.querySelectorAll('*').forEach(e => [...e.attributes].forEach(a => {
    const n = a.name.toLowerCase(), v = a.value.trim().toLowerCase();
    if (n.startsWith('on') || (/^(href|src|xlink:href|action|formaction)$/.test(n) && /^(javascript|vbscript|data:text\/html)/.test(v))) e.removeAttribute(a.name);
  }));
  return d.body.innerHTML;
}
function capturar() {
  const c = $('#main').cloneNode(true);
  c.querySelectorAll('.hero,.tools,.sg,button,input,select,textarea,script').forEach(e => e.remove());
  c.querySelectorAll('*').forEach(e => { e.classList.remove('click'); e.removeAttribute('id'); });
  return limpaHTML(c.innerHTML);
}
const montaPayload = () => ({ html: capturar(), logo: brand().logo || null, page: view, ts: Date.now() });
async function listaLinks(box) {
  const { data, error } = await SB.from('shares').select('token,page,title,created_by,created_at,updated_at,expires_at').order('created_at', { ascending: false });
  if (error) {
    const falta = /shares|relation|schema cache|42P01|PGRST205/i.test((error.message || '') + (error.code || ''));
    box.innerHTML = '<small style="color:var(--c-r)">' + (falta ? 'O banco ainda não tem a tabela de links. Execute o arquivo supabase/atualizacao-2-compartilhamento.sql no SQL Editor do Supabase (passo a passo no LEIA-ME).' : 'Não foi possível carregar os links: ' + esc(error.message)) + '</small>';
    return false;
  }
  box.innerHTML = data.length ? data.map(s => {
    const exp = s.expires_at ? new Date(s.expires_at) : null, venc = exp && exp < new Date();
    return `<div class="row lk" data-t="${esc(s.token)}"><div class="t"><b>${esc(s.title || s.page)}</b><br><small>Atualizado em ${fdh(s.updated_at)}${s.created_by ? ' · ' + esc(s.created_by.split('@')[0]) : ''}</small></div><span class="chip ${venc ? 'r' : exp ? 'o' : 'g'}">${venc ? 'Expirado' : exp ? 'Até ' + exp.toLocaleDateString('pt-BR') : 'Sem validade'}</span><div class="tools" style="margin:0;gap:6px"><button class="b s" data-a="copy">Copiar</button>${navigator.share ? '<button class="b s" data-a="send">Enviar</button>' : ''}${s.page == view && SHAREABLE[view] ? '<button class="b s" data-a="upd">Atualizar</button>' : ''}<button class="b d" data-a="del">Revogar</button></div></div>`;
  }).join('') : '<small>Nenhum link criado.</small>';
  return true;
}
async function compartilhar() {
  if (!CLOUD || !SES) return toast('O compartilhamento precisa do login na nuvem');
  const pode = !!SHAREABLE[view];
  const o = modal(`<h2>Compartilhar</h2><p class="sub" style="margin:0 0 12px">Cria um link só para visualização, sem login. Quem tiver o link vê a página exatamente como ela está agora, sem poder alterar nada.</p>${pode ? `<div class="f" style="grid-template-columns:1fr 1fr"><label>Página<input value="${SHAREABLE[view]}" disabled></label><label>Validade<select id="sh_v"><option value="1">1 dia</option><option value="7" selected>7 dias</option><option value="30">30 dias</option><option value="0">Sem validade</option></select></label></div><div class="tools"><button class="b" id="sh_go">Criar link</button></div><small>Atenção: a página mostra dados dos colaboradores. Envie só para quem precisa.</small>` : '<small>Esta página não pode ser compartilhada. Abra Painel, Equipe, Escalas, Ambientes, Férias ou Relatórios e toque em Compartilhar.</small>'}<h2 style="margin-top:22px">Links ativos</h2><div id="sh_l"><small>Carregando…</small></div><div class="tools" style="margin-top:14px"><button class="b s" onclick="this.closest('.ov').remove()">Fechar</button></div>`);
  const box = $('#sh_l');
  await listaLinks(box);
  const go = $('#sh_go');
  if (go) go.onclick = async () => {
    go.disabled = true;
    const dias = +$('#sh_v').value, pl = montaPayload();
    if (JSON.stringify(pl).length > 1.5e6) { go.disabled = false; return toast('A página é grande demais para compartilhar'); }
    const t = novoToken();
    const { error } = await SB.from('shares').insert({ token: t, page: view, title: SHAREABLE[view], payload: pl, created_by: WHO, expires_at: dias ? new Date(Date.now() + dias * 864e5).toISOString() : null });
    go.disabled = false;
    if (error) return toast('Não foi possível criar o link');
    lg('Criado', 'Link público', SHAREABLE[view], ['Validade: ' + (dias ? dias + ' dia(s)' : 'sem validade')]); save(1);
    try { await navigator.clipboard.writeText(linkDe(t)); toast('Link criado e copiado'); } catch (e) { prompt('Copie o link:', linkDe(t)); }
    await listaLinks(box);
  };
  box.onclick = async e => {
    const b = e.target.closest('button[data-a]'); if (!b) return;
    const t = b.closest('[data-t]').dataset.t, a = b.dataset.a;
    if (a == 'copy') { try { await navigator.clipboard.writeText(linkDe(t)); toast('Link copiado'); } catch (x) { prompt('Copie o link:', linkDe(t)); } }
    else if (a == 'send') { try { await navigator.share({ title: 'Boa Vista Corporate · ' + (SHAREABLE[view] || ''), url: linkDe(t) }); } catch (x) {} }
    else if (a == 'upd') {
      const { error } = await SB.from('shares').update({ payload: montaPayload(), updated_at: new Date().toISOString() }).eq('token', t);
      if (error) return toast('Não foi possível atualizar');
      lg('Alterado', 'Link público', SHAREABLE[view], ['Conteúdo do link atualizado']); save(1); toast('Link atualizado'); await listaLinks(box);
    } else if (a == 'del') {
      if (!confirm('Revogar este link? Quem tiver o endereço deixa de conseguir abrir.')) return;
      const { error } = await SB.from('shares').delete().eq('token', t);
      if (error) return toast('Não foi possível revogar');
      lg('Excluído', 'Link público', b.closest('.row').querySelector('b').textContent, ['Link revogado']); save(1); toast('Link revogado'); await listaLinks(box);
    }
  };
}
async function verCompartilhado(t) {
  const body = $('#vbody'), msg = (a, b) => body.innerHTML = `<div class="card"><b>${a}</b><br><small>${b}</small></div>`;
  if (!CLOUD) return msg('Link indisponível', 'A nuvem não está configurada neste endereço.');
  try {
    const sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { data, error } = await sb.rpc('get_share', { p_token: t });
    if (error) throw error;
    if (!data) return msg('Este link não está mais disponível', 'Ele expirou ou foi desativado. Peça um novo link a quem compartilhou.');
    const p = data.payload || {};
    $('#vbadge').textContent = 'Somente leitura · atualizado em ' + fdh(data.updated_at);
    body.innerHTML = limpaHTML(p.html || ''); anim(body);
    document.title = (data.title || 'Visualização') + ' · Boa Vista Corporate';
  } catch (e) { msg('Não foi possível abrir o link', 'Verifique a internet e tente de novo.'); }
}
