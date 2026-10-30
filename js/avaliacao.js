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
/* ---- análises ---- */
const mediaEq = R => R.ok.length ? R.ok.reduce((a, r) => a + r.c.fin, 0) / R.ok.length : null;
function porCriterio(R) { return crit().map((nome, i) => ({ nome, v: R.ok.length ? R.ok.reduce((a, r) => a + r.c.n[i], 0) / R.ok.length : null })); }
function venceu(id, m) { return avRank(m).ok.some(r => r.pos == 1 && r.p.id == id); }
function seqVitorias(id, m) { let k = 0, mm = m; while (k < 120 && venceu(id, mm)) { k++; mm = addM(mm, -1); } return k; }
function vitoriasAntes(id, m) { return Object.keys(db.av || {}).filter(x => x < m && venceu(id, x)).length; }
function setaDelta(d) { if (d == null || Math.abs(d) < 0.005) return ''; return `<span class="dl ${d > 0 ? 'up' : 'dn'}">${d > 0 ? '▲' : '▼'} ${f2(Math.abs(d))}</span>`; }
function avInsights(m) {
  const R = avRank(m), P = avRank(addM(m, -1)), out = [], w = R.ok.filter(r => r.pos == 1);
  if (!R.ok.length) return out;
  if (w.length == 1) {
    const k = seqVitorias(w[0].p.id, m), ant = vitoriasAntes(w[0].p.id, m);
    if (k > 1) out.push(['up', `<b>${esc(w[0].p.nome)}</b> é destaque pelo <b>${k}º mês seguido</b>.`]);
    else if (!ant) out.push(['up', `<b>${esc(w[0].p.nome)}</b> é destaque pela <b>primeira vez</b>.`]);
    else out.push(['up', `<b>${esc(w[0].p.nome)}</b> volta a ser destaque (${ant + 1}ª vez).`]);
  } else out.push(['up', `Empate no topo: <b>${w.map(r => esc(r.p.nome)).join(' e ')}</b>.`]);
  const prev = {}; P.ok.forEach(r => prev[r.p.id] = r.c.fin);
  const dif = R.ok.filter(r => prev[r.p.id] != null).map(r => ({ r, d: r.c.fin - prev[r.p.id] }));
  const alta = [...dif].sort((a, b) => b.d - a.d)[0], queda = [...dif].sort((a, b) => a.d - b.d)[0];
  if (alta && alta.d > 0.04) out.push(['up', `Maior evolução: <b>${esc(alta.r.p.nome)}</b> (${setaDelta(alta.d)} em relação a ${mesCurto(addM(m, -1)).toLowerCase()}).`]);
  if (queda && queda.d < -0.04) out.push(['dn', `Maior queda: <b>${esc(queda.r.p.nome)}</b> (${setaDelta(queda.d)} em relação a ${mesCurto(addM(m, -1)).toLowerCase()}).`]);
  const pc = porCriterio(R).sort((a, b) => b.v - a.v);
  out.push(['', `Ponto forte da equipe: <b>${esc(pc[0].nome)}</b> (média ${f2(pc[0].v)}).`]);
  if (pc[4].v < pc[0].v - 0.01) out.push(['dn', `Ponto a melhorar: <b>${esc(pc[4].nome)}</b> (média ${f2(pc[4].v)}).`]);
  const esp = R.ok.filter(r => r.c.b > 0).length;
  if (esp) out.push(['', `<b>${esp}</b> ${esp == 1 ? 'colaborador recebeu' : 'colaboradores receberam'} nota especial neste mês.`]);
  if (R.falta.length) out.push(['', `Faltam <b>${R.falta.length}</b> ${R.falta.length == 1 ? 'avaliação' : 'avaliações'} para fechar o mês.`]);
  return out;
}
function avEvolucao(m, n) {
  const ms = []; for (let k = n - 1; k >= 0; k--) ms.push(addM(m, -k));
  const v = ms.map(x => mediaEq(avRank(x)));
  if (v.every(x => x == null)) return '';
  return `<div class="cols avc6">${ms.map((x, i) => `<div class="col"><b>${v[i] == null ? '' : f2(v[i])}</b><i><u data-h="${v[i] == null ? 0 : Math.max(4, v[i] / 5 * 100)}%" style="background:${x == m ? 'var(--g)' : 'color-mix(in srgb,var(--g) 38%,var(--seg))'}"></u></i><span>${mesCurto(x)}</span></div>`).join('')}</div>`;
}
function avDistrib(R) {
  const f = [[4.5, 99, 'Excelente (4,5 ou mais)'], [4, 4.4999, 'Muito bom (4,0 a 4,4)'], [3, 3.9999, 'Bom (3,0 a 3,9)'], [-1, 2.9999, 'Atenção (abaixo de 3,0)']];
  const c = f.map(([lo, hi, n]) => ({ n, v: R.ok.filter(r => r.c.fin >= lo && r.c.fin <= hi).length }));
  const mx = Math.max(1, ...c.map(x => x.v));
  return c.map(x => `<div class="bar"><div><span>${x.n}</span><b>${x.v}</b></div><i><u data-w="${x.v / mx * 100}%"></u></i></div>`).join('');
}
function tile(t, v, sub) { return `<div class="card stat"><span>${t}</span><b style="font-size:${String(v).length > 12 ? 18 : 32}px">${v}</b><span>${sub || ''}</span></div>`; }

function avMesHtml() {
  const m = avS.m, R = avRank(m), w = R.ok.filter(r => r.pos == 1), cs = crit(), P = avRank(addM(m, -1));
  const mediaA = mediaEq(R), mediaP = mediaEq(P), pc = porCriterio(R);
  let hero;
  if (w.length) {
    const un = w.length == 1 ? w[0] : null;
    hero = `<div class="av-win"><div class="tr">${TROFEU}</div><div class="wt"><small>Destaque de ${mesNome(m)}${w.length > 1 ? ' · empate' : ''}</small><h2>${w.map(r => esc(r.p.nome)).join(' e ')}</h2>${un ? `<small>${esc(un.p.cargo || '')}</small>` : ''}</div><div class="big">${f2(w[0].c.fin)}</div>${un ? `<div class="wb">${cs.map((c, i) => `<div><span>${esc(c)}</span><i><u data-w="${un.c.n[i] / 5 * 100}%"></u></i><b>${f1(un.c.n[i])}</b></div>`).join('')}${un.c.b ? `<div><span>Nota especial</span><i><u data-w="${un.c.b / AV_MAX * 100}%"></u></i><b>+${f1(un.c.b)}</b></div>` : ''}</div>` : ''}</div>`;
  } else hero = `<div class="card av-none"><div class="tr2">${TROFEU}</div><b>Nenhum destaque em ${mesNome(m)} ainda</b><br><small>Quando você avaliar os 5 critérios de pelo menos um colaborador, o destaque, o ranking e as análises aparecem aqui.</small><ol class="como"><li>Toque num colaborador em <b>Falta avaliar</b>.</li><li>Dê notas de 0,0 a 5,0 nos 5 critérios (e, se quiser, uma nota especial).</li><li>Use <b>Salvar e próximo</b> para avaliar todos em sequência.</li></ol></div>`;
  const tiles = R.ok.length ? `<div class="grid g4" style="margin-top:16px">${tile('Média da equipe', f2(mediaA), setaDelta(mediaP == null ? null : mediaA - mediaP) + (mediaP == null ? '' : ' vs mês anterior'))}${tile('Avaliações completas', R.ok.length + ' de ' + R.total, Math.round(R.ok.length / R.total * 100) + '% concluído')}${tile('Maior nota', f2(R.ok[0].c.fin), esc(R.ok[0].p.nome.split(' ')[0]))}${tile('Ponto forte', esc([...pc].sort((a, b) => b.v - a.v)[0].nome), 'média ' + f2([...pc].sort((a, b) => b.v - a.v)[0].v))}</div>` : `<div class="card" style="margin-top:16px"><div class="bar" style="margin:0"><div><span>Avaliações completas</span><b>0 de ${R.total}</b></div><i><u data-w="0%"></u></i></div></div>`;
  const graf = R.ok.length ? `<div class="grid g2" style="margin-top:16px"><div class="card"><h2>Média por critério</h2>${pc.map(x => `<div class="bar"><div><span>${esc(x.nome)}</span><b>${f2(x.v)}</b></div><i><u data-w="${x.v / 5 * 100}%"></u></i></div>`).join('')}</div><div class="card"><h2>Distribuição das notas</h2>${avDistrib(R)}</div></div><div class="card" style="margin-top:16px"><h2>Evolução da média da equipe</h2><p class="sub" style="margin:0 0 6px;font-size:13px">Últimos 6 meses</p>${avEvolucao(m, 6)}</div>` : '';
  const ins = avInsights(m);
  const insH = ins.length ? `<div class="card" style="margin-top:16px"><h2>Insights</h2>${ins.map(([c, t]) => `<div class="ins ${c}"><i></i><span>${t}</span></div>`).join('')}</div>` : '';
  const rank = R.ok.length ? `<h2 style="margin:24px 0 10px">Ranking de ${mesNome(m)}</h2><div class="card">${R.ok.map(r => `<div class="row click" onclick="avEdit('${r.p.id}')"><span class="pos p${Math.min(r.pos, 4)}">${r.pos}</span><div class="t"><b>${esc(r.p.nome)}</b><br><small>Média ${f2(r.c.med)}${r.c.b ? ' + especial ' + f2(r.c.b) : ''} · ${esc(r.p.cargo || '')}</small></div><b class="sc">${f2(r.c.fin)}</b></div>`).join('')}</div>` : '';
  const falta = R.falta.length ? `<h2 style="margin:24px 0 10px">Falta avaliar</h2><div class="card">${R.falta.map(r => `<div class="row click" onclick="avEdit('${r.p.id}')"><div class="av">${ini(r.p)}</div><div class="t"><b>${esc(r.p.nome)}</b><br><small>${r.c && r.c.f ? r.c.f + ' de 5 critérios' : 'Sem avaliação'}</small></div><span class="chip ${r.c && r.c.f ? 'o' : ''}">${r.c && r.c.f ? 'Incompleta' : 'Avaliar'}</span></div>`).join('')}</div>` : '';
  const rel = `<div class="tools" style="margin-top:20px"><button class="b s" onclick="avRelat('dm')">Relatório do mês</button><button class="b s" onclick="avRelat('da')">Relatório do ano</button><button class="b s" onclick="avRelat('dh')">Histórico de destaques</button></div>`;
  return hero + tiles + graf + insH + rank + falta + rel;
}
function avRelat(k) { S.rep = k; avS.y = +avS.m.slice(0, 4); go('relatorios'); }
function avAnoHtml() {
  const y = avS.y, hoje = mesAtual(), tot = {}, linhas = [], meses = [], medias = [];
  for (let k = 1; k <= 12; k++) {
    const m = y + '-' + String(k).padStart(2, '0');
    if (m > hoje) break;
    const R = avRank(m), w = R.ok.filter(r => r.pos == 1);
    meses.push(m); medias.push(mediaEq(R));
    R.ok.forEach(r => { const t = tot[r.p.id] = tot[r.p.id] || { p: r.p, fin: {}, vit: 0 }; t.fin[m] = r.c.fin; if (r.pos == 1) t.vit++; });
    linhas.push(`<div class="row click" onclick="avS.m='${m}';avS.tab='mes';render(1)"><div class="mo">${mesCurto(m)}</div><div class="t">${w.length ? `<b>${w.map(r => esc(r.p.nome)).join(' e ')}</b><br><small>${f2(w[0].c.fin)}${w.length > 1 ? ' · empate' : ''} · ${R.ok.length} avaliado${R.ok.length == 1 ? '' : 's'}</small>` : '<span style="color:var(--mut)">Sem destaque</span>'}</div>${w.length ? '<span class="chip g">Destaque</span>' : ''}</div>`);
  }
  const L = Object.values(tot).map(t => { const v = Object.values(t.fin); return { ...t, n: v.length, med: v.reduce((a, b) => a + b, 0) / v.length, best: Math.max(...v) }; });
  if (!L.length) return `<div class="card av-none"><div class="tr2">${TROFEU}</div><b>Sem avaliações em ${y}</b><br><small>Avalie os colaboradores na aba Mês para ver o resumo do ano.</small></div>`;
  const porVit = [...L].sort((a, b) => b.vit - a.vit || b.med - a.med)[0], porMed = [...L].sort((a, b) => r2(b.med) - r2(a.med) || b.n - a.n)[0];
  const comDest = meses.filter(m => avRank(m).ok.length).length, mAno = medias.filter(x => x != null), mediaAno = mAno.length ? mAno.reduce((a, b) => a + b, 0) / mAno.length : null;
  const melhorMes = meses.map((m, i) => ({ m, v: medias[i] })).filter(x => x.v != null).sort((a, b) => b.v - a.v)[0];
  const stats = `<div class="grid g4">${tile('Mais vezes destaque', esc(porVit.vit ? porVit.p.nome.split(' ').slice(0, 2).join(' ') : '—'), porVit.vit + (porVit.vit == 1 ? ' vez' : ' vezes') + ' em ' + y)}${tile('Maior média no ano', esc(porMed.p.nome.split(' ').slice(0, 2).join(' ')), f2(porMed.med) + ' em ' + porMed.n + (porMed.n == 1 ? ' mês' : ' meses'))}${tile('Média da equipe no ano', f2(mediaAno), comDest + (comDest == 1 ? ' mês avaliado' : ' meses avaliados'))}${tile('Melhor mês da equipe', melhorMes ? mesCurto(melhorMes.m) : '—', melhorMes ? 'média ' + f2(melhorMes.v) : '')}</div>`;
  const evo = `<div class="card" style="margin-top:16px"><h2>Evolução da média da equipe</h2>${(() => { const v = medias; return `<div class="cols avc6 av12">${meses.map((x, i) => `<div class="col"><b>${v[i] == null ? '' : f1(v[i])}</b><i><u data-h="${v[i] == null ? 0 : Math.max(4, v[i] / 5 * 100)}%" style="background:${x == hoje ? 'var(--g)' : 'color-mix(in srgb,var(--g) 38%,var(--seg))'}"></u></i><span>${mesCurto(x)}</span></div>`).join('')}</div>`; })()}</div>`;
  const ordenado = [...L].sort((a, b) => b.vit - a.vit || r2(b.med) - r2(a.med));
  const heat = `<h2 style="margin:24px 0 10px">Mapa de notas</h2><div class="card wrap"><table class="hm"><tr><th></th>${meses.map(m => `<th>${mesCurto(m)}</th>`).join('')}<th>Média</th></tr>${ordenado.map(t => `<tr><th class="nm0">${esc(t.p.nome.split(' ').slice(0, 2).join(' '))}</th>${meses.map(m => { const v = t.fin[m]; if (v == null) return '<td class="e">·</td>'; const win = avRank(m).ok.some(r => r.pos == 1 && r.p.id == t.p.id), pc = Math.round(Math.max(10, Math.min(90, (v - 2.5) / 3.5 * 100))); return `<td class="${win ? 'w' : ''}${pc > 55 ? ' hi' : ''}" style="background:color-mix(in srgb,var(--g) ${pc}%,var(--seg))">${f1(v)}</td>`; }).join('')}<td class="av2">${f2(t.med)}</td></tr>`).join('')}</table></div><small style="display:block;margin-top:6px">Contorno = destaque do mês. Quanto mais forte o azul, maior a nota.</small>`;
  const rk = `<h2 style="margin:24px 0 10px">Classificação do ano</h2><div class="card">${ordenado.map((t, i) => `<div class="row"><span class="pos p${Math.min(i + 1, 4)}">${i + 1}</span><div class="t"><b>${esc(t.p.nome)}</b><br><small>${t.vit} ${t.vit == 1 ? 'destaque' : 'destaques'} · ${t.n} ${t.n == 1 ? 'mês avaliado' : 'meses avaliados'} · melhor nota ${f2(t.best)}</small></div><b class="sc">${f2(t.med)}</b></div>`).join('')}</div>`;
  const rel = `<div class="tools" style="margin-top:20px"><button class="b s" onclick="avRelat('da')">Relatório do ano</button><button class="b s" onclick="avRelat('dh')">Histórico de destaques</button></div>`;
  return stats + evo + `<h2 style="margin:24px 0 10px">Destaque de cada mês</h2><div class="card">${linhas.join('')}</div>` + heat + rk + rel;
}
function avHist(pid) {
  const m = avS.m, ls = [];
  for (let k = 5; k >= 0; k--) { const x = addM(m, -k), r = avRank(x).ok.find(q => q.p.id == pid); if (r) ls.push(`<div class="gl"><span>${mesNome(x)}</span><b>${f2(r.c.fin)} · ${r.pos}º lugar</b></div>`); }
  return ls.length ? `<h2 style="margin:18px 0 4px;font-size:16px">Últimos meses</h2>${ls.join('')}` : '';
}

/* ---- avaliar um colaborador ---- */
function avEdit(pid) {
  const p = db.p.find(x => x.id == pid), m = avS.m; if (!p) return;
  const e = avMes(m)[pid] || {}, cs = crit(), n = e.n || [];
  const lin = cs.map((c, i) => { const v = typeof n[i] == 'number' ? n[i] : ''; return `<div class="avc"><div class="avh"><b>${esc(c)}</b><small>${esc(CR_DESC[i] || '')}</small></div><div class="avi"><input type="range" class="rg" min="0" max="5" step="0.1" value="${v === '' ? 0 : v}" data-i="${i}" aria-label="${esc(c)}"><input type="number" class="nm" min="0" max="5" step="0.1" inputmode="decimal" placeholder="—" value="${v}" data-i="${i}"></div></div>`; }).join('');
  const o = modal(`<h2>${esc(p.nome)}</h2><p class="sub" style="margin:0 0 6px">${esc(mesNome(m))} · notas de 0,0 a 5,0</p><div>${lin}</div><div class="avc"><div class="avh"><b>Nota especial</b><small>Somada à média (de 0,0 a ${f1(AV_MAX)}). Use para reconhecer algo fora dos critérios.</small></div><div class="avi"><input type="range" id="av_br" min="0" max="${AV_MAX}" step="0.1" value="${+e.b || 0}" aria-label="Nota especial"><input type="number" id="av_b" min="0" max="${AV_MAX}" step="0.1" inputmode="decimal" placeholder="0,0" value="${e.b ? e.b : ''}"></div></div><label style="display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--mut);margin-top:12px">Observação (opcional)<textarea id="av_t" style="min-height:64px;width:100%">${esc(e.t || '')}</textarea></label>${avHist(pid)}<div class="avs"><div><small>Média</small><b id="av_m">—</b></div><div><small>Especial</small><b id="av_e">+0,00</b></div><div class="fin"><small>Nota final</small><b id="av_f">—</b></div></div><div class="tools" style="margin-top:16px"><button class="b" id="av_s">Salvar</button><button class="b s" id="av_n">Salvar e próximo</button>${avMes(m)[pid] ? '<button class="b d" id="av_d">Limpar</button>' : ''}<button class="b s" id="av_c">Cancelar</button></div>`);
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

/* ---- relatórios ---- */
const AV_RN = { dm: 'Destaque do mês: notas de todos', da: 'Destaque do ano', dh: 'Histórico de destaques' };
function avRel() {
  const hd = t => [['t', t], ['box', ['**Boa Vista Corporate** – emitido em ' + new Date().toLocaleString('pt-BR')]]];
  const cs = crit(), nm = p => p.nome;
  return {
    dm() {
      const m = avS.m, R = avRank(m), w = R.ok.filter(r => r.pos == 1), mEq = mediaEq(R);
      const topo = hd('DESTAQUE DO MÊS · ' + mesNome(m).toUpperCase());
      topo[1][1].push('**Avaliações completas:** ' + R.ok.length + ' de ' + R.total, ...(mEq != null ? ['**Média da equipe:** ' + f2(mEq)] : []));
      if (!R.ok.length) return [...topo, ['p', 'Nenhuma avaliação completa lançada neste mês.']];
      topo[1][1].unshift('**Destaque do mês:** ' + w.map(r => nm(r.p)).join(' e ') + ' (nota final ' + f2(w[0].c.fin) + ')' + (w.length > 1 ? ' – empate' : ''));
      const obs = R.ok.filter(r => r.e && r.e.t);
      return [...topo, ['h2', 'Notas de todos (ordem de classificação)'],
        ['tbl', ['Pos.', 'Colaborador', ...cs, 'Média', 'Especial', 'Final'], R.ok.map(r => [r.pos + 'º', nm(r.p), ...r.c.n.map(f1), f2(r.c.med), r.c.b ? '+' + f2(r.c.b) : '—', '**' + f2(r.c.fin) + '**']), [480, 1900, 790, 790, 790, 790, 790, 760, 760, 790], { sz: 15 }],
        ...(R.falta.length ? [['h2', 'Sem avaliação completa'], ['p', R.falta.map(r => nm(r.p) + (r.c && r.c.f ? ' (' + r.c.f + ' de 5)' : '')).join('; ') + '.']] : []),
        ...(obs.length ? [['h2', 'Observações'], ['ul', obs.map(r => '**' + nm(r.p) + ':** ' + r.e.t)]] : [])];
    },
    da() {
      const y = avS.y, hoje = mesAtual(), meses = [], tot = {}, topo = hd('DESTAQUE DO ANO · ' + y);
      const linhas = [];
      for (let k = 1; k <= 12; k++) {
        const m = y + '-' + String(k).padStart(2, '0'); if (m > hoje) break;
        const R = avRank(m), w = R.ok.filter(r => r.pos == 1); meses.push(m);
        R.ok.forEach(r => { const t = tot[r.p.id] = tot[r.p.id] || { p: r.p, fin: [], vit: 0 }; t.fin.push(r.c.fin); if (r.pos == 1) t.vit++; });
        linhas.push([mesNome(m).split(' ')[0], w.length ? w.map(r => nm(r.p)).join(' e ') : '—', w.length ? f2(w[0].c.fin) : '—', mediaEq(R) != null ? f2(mediaEq(R)) : '—', String(R.ok.length)]);
      }
      const L = Object.values(tot).map(t => ({ ...t, med: t.fin.reduce((a, b) => a + b, 0) / t.fin.length, best: Math.max(...t.fin) })).sort((a, b) => b.vit - a.vit || r2(b.med) - r2(a.med));
      if (!L.length) return [...topo, ['p', 'Nenhuma avaliação completa lançada em ' + y + '.']];
      topo[1][1].push('**Mais vezes destaque:** ' + L[0].p.nome + ' (' + L[0].vit + ')', '**Maior média no ano:** ' + [...L].sort((a, b) => r2(b.med) - r2(a.med))[0].p.nome + ' (' + f2([...L].sort((a, b) => r2(b.med) - r2(a.med))[0].med) + ')');
      return [...topo, ['h2', 'Destaque de cada mês'], ['tbl', ['Mês', 'Destaque', 'Nota final', 'Média da equipe', 'Avaliados'], linhas, [1300, 3700, 1200, 1900, 1540], { sz: 17 }],
        ['h2', 'Classificação do ano'], ['tbl', ['Pos.', 'Colaborador', 'Destaques', 'Meses avaliados', 'Média anual', 'Melhor nota'], L.map((t, i) => [(i + 1) + 'º', nm(t.p), String(t.vit), String(t.fin.length), '**' + f2(t.med) + '**', f2(t.best)]), [600, 3300, 1100, 1700, 1500, 1440], { sz: 17 }]];
    },
    dh() {
      const hoje = mesAtual(), topo = hd('HISTÓRICO DE DESTAQUES DO MÊS'), linhas = [];
      const ms = Object.keys(db.av || {}).filter(m => m <= hoje && avRank(m).ok.length).sort().reverse();
      ms.forEach(m => { const R = avRank(m), w = R.ok.filter(r => r.pos == 1), seg = R.ok.filter(r => r.pos > 1).slice(0, 2); linhas.push([mesNome(m), w.map(r => nm(r.p)).join(' e ') + (w.length > 1 ? ' (empate)' : ''), f2(w[0].c.fin), seg.map(r => nm(r.p) + ' (' + f2(r.c.fin) + ')').join('\n') || '—']); });
      if (!linhas.length) return [...topo, ['p', 'Nenhuma avaliação completa lançada até agora.']];
      const cont = {}; ms.forEach(m => avRank(m).ok.filter(r => r.pos == 1).forEach(r => cont[r.p.nome] = (cont[r.p.nome] || 0) + 1));
      topo[1][1].push('**Meses com destaque:** ' + ms.length);
      return [...topo, ['tbl', ['Mês', 'Destaque', 'Nota final', '2º e 3º colocados'], linhas, [1900, 3100, 1000, 3640], { sz: 17 }],
        ['h2', 'Quantas vezes cada pessoa foi destaque'], ['tbl', ['Colaborador', 'Vezes destaque'], Object.entries(cont).sort((a, b) => b[1] - a[1]).map(([n, v]) => [n, String(v)]), [6400, 3240], { sz: 17 }]];
    }
  };
}
function avParam() {
  if (S.rep == 'dm') return `<input type="month" max="${mesAtual()}" value="${avS.m}" onchange="if(this.value){avS.m=this.value;avS.y=+this.value.slice(0,4);render(1)}" aria-label="Mês do relatório">`;
  if (S.rep == 'da') { const ys = new Set([new Date().getFullYear(), avS.y]); Object.keys(db.av || {}).forEach(m => ys.add(+m.slice(0, 4))); return `<select onchange="avS.y=+this.value;render(1)" aria-label="Ano do relatório">${[...ys].sort((a, b) => b - a).map(y => `<option ${y == avS.y ? 'selected' : ''}>${y}</option>`).join('')}</select>`; }
  return '';
}
