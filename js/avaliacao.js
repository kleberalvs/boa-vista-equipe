/* Destaque do mês: notas de 0,0 a 5,0 em 5 critérios, nota especial, ranking mensal e anual.
   Carregado ANTES de app.js: aqui só há declarações. Dados: db.av = { 'AAAA-MM': { m, s: { idDoColaborador: { n:[5 notas], b:bônus, t:texto, u:autor, at:data } } } } */
const AV_MAX = 1;   /* maior valor da nota especial, somada à média */
const CR_DEF = ['Qualidade do serviço', 'Cumprimento do horário', 'Iniciativa e proatividade', 'Trabalho em equipe', 'Zelo e organização'];
const CR_DESC = ['Acabamento, atenção aos detalhes e pouco retrabalho', 'Pontualidade, assiduidade e cumprimento da escala', 'Resolve sem precisar pedir e sugere melhorias', 'Colaboração com colegas, clientes e condôminos', 'Cuidado com o patrimônio, uniforme e organização'];
const TROFEU = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>';
function mesAtual() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
const avS = { m: mesAtual(), tab: 'mes', y: new Date().getFullYear() };
const r2 = x => Math.round(x * 100) / 100;
const f2 = x => x == null ? '—' : r2(x).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const f1 = x => x == null ? '—' : (Math.round(x * 10) / 10).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
function mesNome(m) { const [y, k] = m.split('-'); const s = new Date(+y, +k - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); }
function mesCurto(m) { const s = new Date(+m.slice(0, 4), +m.slice(5) - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''); return s.charAt(0).toUpperCase() + s.slice(1); }
function addM(m, k) { const d = new Date(+m.slice(0, 4), +m.slice(5) - 1 + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
const crit = () => (db.avc && db.avc.length == 5 ? db.avc : CR_DEF);
const avMes = m => ((db.av || {})[m] || {}).s || {};
const elegiveis = m => db.p.filter(p => !p.adm || p.adm.slice(0, 7) <= m);
function avCalc(e) {
  if (!e) return null;
  const n = (e.n || []).slice(0, 5), f = n.filter(x => typeof x == 'number').length, full = f == 5, b = +e.b || 0;
  const med = full ? n.reduce((a, c) => a + c, 0) / 5 : null;
  return { f, full, med, b, fin: full ? med + b : null, n };
}
function avRank(m) {
  const s = avMes(m), rows = elegiveis(m).map(p => ({ p, e: s[p.id], c: avCalc(s[p.id]) }));
  const ok = rows.filter(r => r.c && r.c.full).sort((a, b) => r2(b.c.fin) - r2(a.c.fin) || r2(b.c.med) - r2(a.c.med) || a.p.nome.localeCompare(b.p.nome, 'pt-BR'));
  let pos = 0, prev = null;
  ok.forEach((r, i) => { const k = r2(r.c.fin) + '|' + r2(r.c.med); if (k !== prev) { pos = i + 1; prev = k; } r.pos = pos; });
  const falta = rows.filter(r => !(r.c && r.c.full)).sort((a, b) => a.p.nome.localeCompare(b.p.nome, 'pt-BR'));
  return { ok, falta, total: rows.length };
}
const ini = p => esc(p.nome.split(' ').filter(x => x.length > 2).slice(0, 2).map(x => x[0]).join('').toUpperCase());

function avBarra() {
  const mes = avS.tab == 'mes', agora = mesAtual(), y = new Date().getFullYear();
  const rotulo = mes ? mesNome(avS.m) : String(avS.y);
  const fim = mes ? avS.m >= agora : avS.y >= y;
  const seta = (d, off) => `<button class="b s ic" ${off ? 'disabled style="opacity:.35"' : ''} onclick="avGo(${d})" aria-label="${d < 0 ? 'Anterior' : 'Próximo'}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${d < 0 ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}"/></svg></button>`;
  return `<div class="avbar"><div class="seg" role="group" aria-label="Período"><button class="${mes ? 'on' : ''}" onclick="avTab('mes')">Mês</button><button class="${mes ? '' : 'on'}" onclick="avTab('ano')">Ano</button></div><div class="mn">${seta(-1, false)}<b>${rotulo}</b>${seta(1, fim)}</div><button class="b s" onclick="avCrit()">Critérios</button></div>`;
}
function avGo(k) {
  if (avS.tab == 'mes') { const n = addM(avS.m, k); if (n > mesAtual()) return; avS.m = n; avS.y = +n.slice(0, 4); }
  else { const n = avS.y + k; if (n > new Date().getFullYear()) return; avS.y = n; }
  render(1);
}
function avTab(t) { avS.tab = t; if (t == 'mes' && avS.m.slice(0, 4) != String(avS.y)) avS.m = avS.y == new Date().getFullYear() ? mesAtual() : avS.y + '-12'; render(1); }

function avView() {
  return `<h1>Destaque do mês</h1><p class="sub">Notas de 0,0 a 5,0 em 5 critérios. A média, somada à nota especial, define o ranking e o destaque de cada mês.</p>${avBarra()}${avS.tab == 'mes' ? avMesHtml() : avAnoHtml()}`;
}
function avMesHtml() {
  const m = avS.m, R = avRank(m), w = R.ok.filter(r => r.pos == 1), cs = crit();
  let hero;
  if (w.length) {
    const un = w.length == 1 ? w[0] : null;
    hero = `<div class="av-win"><div class="tr">${TROFEU}</div><div class="wt"><small>Destaque de ${mesNome(m)}${w.length > 1 ? ' · empate' : ''}</small><h2>${w.map(r => esc(r.p.nome)).join(' e ')}</h2>${un ? `<small>${esc(un.p.cargo || '')}</small>` : ''}</div><div class="big">${f2(w[0].c.fin)}</div>${un ? `<div class="wb">${cs.map((c, i) => `<div><span>${esc(c)}</span><i><u data-w="${un.c.n[i] / 5 * 100}%"></u></i><b>${f1(un.c.n[i])}</b></div>`).join('')}${un.c.b ? `<div><span>Nota especial</span><i><u data-w="${un.c.b / AV_MAX * 100}%"></u></i><b>+${f1(un.c.b)}</b></div>` : ''}</div>` : ''}</div>`;
  } else hero = `<div class="card av-none"><b>Nenhum destaque em ${mesNome(m)} ainda</b><br><small>Avalie os 5 critérios de pelo menos um colaborador para aparecer o ranking.</small></div>`;
  const prog = `<div class="card" style="margin:16px 0"><div class="bar" style="margin:0"><div><span>Avaliações completas</span><b>${R.ok.length} de ${R.total}</b></div><i><u data-w="${R.total ? R.ok.length / R.total * 100 : 0}%"></u></i></div></div>`;
  const rank = R.ok.length ? `<h2 style="margin:22px 0 10px">Ranking</h2><div class="card">${R.ok.map(r => `<div class="row click" onclick="avEdit('${r.p.id}')"><span class="pos p${Math.min(r.pos, 4)}">${r.pos}</span><div class="t"><b>${esc(r.p.nome)}</b><br><small>Média ${f2(r.c.med)}${r.c.b ? ' + especial ' + f2(r.c.b) : ''}</small></div><b class="sc">${f2(r.c.fin)}</b></div>`).join('')}</div>` : '';
  const falta = R.falta.length ? `<h2 style="margin:22px 0 10px">Falta avaliar</h2><div class="card">${R.falta.map(r => `<div class="row click" onclick="avEdit('${r.p.id}')"><div class="av">${ini(r.p)}</div><div class="t"><b>${esc(r.p.nome)}</b><br><small>${r.c && r.c.f ? r.c.f + ' de 5 critérios' : 'Sem avaliação'}</small></div><span class="chip ${r.c && r.c.f ? 'o' : ''}">${r.c && r.c.f ? 'Incompleta' : 'Avaliar'}</span></div>`).join('')}</div>` : '';
  return hero + prog + rank + falta;
}
function avAnoHtml() {
  const y = avS.y, hoje = mesAtual(), tot = {};
  const linhas = [];
  for (let k = 1; k <= 12; k++) {
    const m = y + '-' + String(k).padStart(2, '0');
    if (m > hoje) break;
    const R = avRank(m), w = R.ok.filter(r => r.pos == 1);
    R.ok.forEach(r => { const t = tot[r.p.id] = tot[r.p.id] || { p: r.p, fin: [], vit: 0 }; t.fin.push(r.c.fin); if (r.pos == 1) t.vit++; });
    linhas.push(`<div class="row click" onclick="avS.m='${m}';avS.tab='mes';render(1)"><div class="mo">${mesCurto(m)}</div><div class="t">${w.length ? `<b>${w.map(r => esc(r.p.nome)).join(' e ')}</b><br><small>${f2(w[0].c.fin)}${w.length > 1 ? ' · empate' : ''} · ${R.ok.length} avaliado${R.ok.length == 1 ? '' : 's'}</small>` : '<span style="color:var(--mut)">Sem destaque</span>'}</div>${w.length ? '<span class="chip g">Destaque</span>' : ''}</div>`);
  }
  const L = Object.values(tot).map(t => ({ ...t, med: t.fin.reduce((a, b) => a + b, 0) / t.fin.length, best: Math.max(...t.fin) }));
  const porVit = [...L].sort((a, b) => b.vit - a.vit || b.med - a.med)[0], porMed = [...L].sort((a, b) => r2(b.med) - r2(a.med) || b.fin.length - a.fin.length)[0];
  const stats = L.length ? `<div class="grid g2" style="margin-bottom:16px"><div class="card stat"><span>Mais vezes destaque do mês</span><b style="font-size:24px">${porVit.vit ? esc(porVit.p.nome) : '—'}</b><span>${porVit.vit} ${porVit.vit == 1 ? 'vez' : 'vezes'} em ${y}</span></div><div class="card stat"><span>Maior média no ano</span><b style="font-size:24px">${esc(porMed.p.nome)}</b><span>${f2(porMed.med)} em ${porMed.fin.length} ${porMed.fin.length == 1 ? 'mês' : 'meses'}</span></div></div>` : '';
  const rk = L.length ? `<h2 style="margin:22px 0 10px">Classificação do ano</h2><div class="card">${[...L].sort((a, b) => b.vit - a.vit || r2(b.med) - r2(a.med)).map((t, i) => `<div class="row"><span class="pos p${Math.min(i + 1, 4)}">${i + 1}</span><div class="t"><b>${esc(t.p.nome)}</b><br><small>${t.vit} ${t.vit == 1 ? 'destaque' : 'destaques'} · ${t.fin.length} ${t.fin.length == 1 ? 'mês avaliado' : 'meses avaliados'} · melhor nota ${f2(t.best)}</small></div><b class="sc">${f2(t.med)}</b></div>`).join('')}</div>` : '';
  return stats + `<h2 style="margin:6px 0 10px">Destaque de cada mês</h2><div class="card">${linhas.join('') || '<small>Nenhum mês neste ano.</small>'}</div>` + rk;
}

/* ---- avaliar um colaborador ---- */
function avEdit(pid) {
  const p = db.p.find(x => x.id == pid), m = avS.m; if (!p) return;
  const e = avMes(m)[pid] || {}, cs = crit(), n = e.n || [];
  const lin = cs.map((c, i) => { const v = typeof n[i] == 'number' ? n[i] : ''; return `<div class="avc"><div class="avh"><b>${esc(c)}</b><small>${esc(CR_DESC[i] || '')}</small></div><div class="avi"><input type="range" class="rg" min="0" max="5" step="0.1" value="${v === '' ? 0 : v}" data-i="${i}" aria-label="${esc(c)}"><input type="number" class="nm" min="0" max="5" step="0.1" inputmode="decimal" placeholder="—" value="${v}" data-i="${i}"></div></div>`; }).join('');
  const o = modal(`<h2>${esc(p.nome)}</h2><p class="sub" style="margin:0 0 6px">${esc(mesNome(m))} · notas de 0,0 a 5,0</p><div>${lin}</div><div class="avc"><div class="avh"><b>Nota especial</b><small>Somada à média (de 0,0 a ${f1(AV_MAX)}). Use para reconhecer algo fora dos critérios.</small></div><div class="avi"><input type="range" id="av_br" min="0" max="${AV_MAX}" step="0.1" value="${+e.b || 0}" aria-label="Nota especial"><input type="number" id="av_b" min="0" max="${AV_MAX}" step="0.1" inputmode="decimal" placeholder="0,0" value="${e.b ? e.b : ''}"></div></div><label style="display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--mut);margin-top:12px">Observação (opcional)<textarea id="av_t" style="min-height:64px;width:100%">${esc(e.t || '')}</textarea></label><div class="avs"><div><small>Média</small><b id="av_m">—</b></div><div><small>Especial</small><b id="av_e">+0,00</b></div><div class="fin"><small>Nota final</small><b id="av_f">—</b></div></div><div class="tools" style="margin-top:16px"><button class="b" id="av_s">Salvar</button><button class="b s" id="av_n">Salvar e próximo</button>${avMes(m)[pid] ? '<button class="b d" id="av_d">Limpar</button>' : ''}<button class="b s" id="av_c">Cancelar</button></div>`);
  const nums = [...o.querySelectorAll('.nm')], rgs = [...o.querySelectorAll('.rg')], bn = $('#av_b'), br = $('#av_br');
  const cl = (x, mx) => Math.min(mx, Math.max(0, Math.round(x * 10) / 10));
  const val = (el, mx) => el.value === '' || isNaN(+el.value) ? null : cl(+el.value, mx);
  const calc = () => {
    const v = nums.map(x => val(x, 5)), cheio = v.every(x => x != null), b = val(bn, AV_MAX) || 0, med = cheio ? v.reduce((a, c) => a + c, 0) / 5 : null;
    $('#av_m').textContent = cheio ? f2(med) : (v.filter(x => x != null).length + ' de 5');
    $('#av_e').textContent = '+' + f2(b); $('#av_f').textContent = cheio ? f2(med + b) : '—';
  };
  nums.forEach((x, i) => { x.oninput = () => { const v = val(x, 5); if (v != null) rgs[i].value = v; calc(); }; });
  rgs.forEach((x, i) => { x.oninput = () => { nums[i].value = (+x.value).toFixed(1); calc(); }; });
  bn.oninput = () => { const v = val(bn, AV_MAX); br.value = v || 0; calc(); };
  br.oninput = () => { bn.value = +br.value ? (+br.value).toFixed(1) : ''; calc(); };
  calc();
  const guardar = prox => {
    const n2 = nums.map(x => val(x, 5)), b = val(bn, AV_MAX) || 0, t = $('#av_t').value.trim();
    const mm = (db.av = db.av || {}), antes = avCalc(avMes(m)[pid]);
    if (n2.every(x => x == null) && !b && !t) { if (mm[m] && mm[m].s) { delete mm[m].s[pid]; if (!Object.keys(mm[m].s).length) delete mm[m]; } }
    else { mm[m] = mm[m] || { m, s: {} }; mm[m].s[pid] = { n: n2, b, t, u: WHO, at: Date.now() }; }
    const dep = avCalc(avMes(m)[pid]);
    lg('Alterado', 'Avaliação', p.nome, [mesNome(m) + ': ' + (dep && dep.full ? 'média ' + f2(dep.med) + (dep.b ? ' + especial ' + f2(dep.b) : '') + ' = ' + f2(dep.fin) : dep ? dep.f + ' de 5 critérios' : 'avaliação removida')]);
    save(1); o.remove();
    if (prox) { const lista = elegiveis(m).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), ai = lista.findIndex(x => x.id == pid), seg = [...lista.slice(ai + 1), ...lista.slice(0, ai)].find(x => { const c = avCalc(avMes(m)[x.id]); return !(c && c.full); }); render(1); if (seg) setTimeout(() => avEdit(seg.id), 260); else toast('Todos avaliados em ' + mesNome(m)); }
    else { render(1); toast('Avaliação salva'); }
  };
  $('#av_s').onclick = () => guardar(false);
  $('#av_n').onclick = () => guardar(true);
  $('#av_c').onclick = () => o.remove();
  const d = $('#av_d'); if (d) d.onclick = () => { nums.forEach(x => x.value = ''); bn.value = ''; $('#av_t').value = ''; guardar(false); };
}
function avCrit() {
  const cs = crit();
  const o = modal(`<h2>Critérios de avaliação</h2><p class="sub" style="margin:0 0 12px">Os 5 critérios valem para todos os meses. Mudar o nome não altera as notas já lançadas.</p><div class="f" style="grid-template-columns:1fr">${cs.map((c, i) => `<label>Critério ${i + 1}<input class="cn" maxlength="40" value="${esc(c)}"></label>`).join('')}</div><div class="tools" style="margin-top:14px"><button class="b" id="cr_s">Salvar</button><button class="b s" id="cr_r">Restaurar padrão</button><button class="b s" id="cr_c">Cancelar</button></div>`);
  $('#cr_c').onclick = () => o.remove();
  $('#cr_r').onclick = () => { o.querySelectorAll('.cn').forEach((x, i) => x.value = CR_DEF[i]); };
  $('#cr_s').onclick = () => {
    const v = [...o.querySelectorAll('.cn')].map((x, i) => x.value.trim() || CR_DEF[i]);
    db.avc = v.every((x, i) => x == CR_DEF[i]) ? null : v;
    lg('Alterado', 'Avaliação', 'Critérios', ['Nomes dos critérios atualizados']); save(1); o.remove(); render(1); toast('Critérios atualizados');
  };
}
