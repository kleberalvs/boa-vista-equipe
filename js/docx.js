const X=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const FT='ARAUJO & MACIEL SERVIÇOS ADMINISTRATIVOS LTDA, CNPJ nº 31.484.618/0001-06, Av. Conde da Boa Vista, nº 720, Bairro da Soledade, município de Recife/PE, CEP: 50.060-001 Contato: (81) 2011-6362';
const FN='<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>',BAR='<w:pBdr><w:left w:val="single" w:sz="36" w:space="6" w:color="000000"/></w:pBdr>';
function runs(t,o){return String(t).split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(s=>{const b=/^\*\*.*\*\*$/.test(s);return`<w:r><w:rPr>${FN}${o.b||b?'<w:b/>':''}${o.i?'<w:i/>':''}<w:sz w:val="${o.sz||22}"/><w:szCs w:val="${o.sz||22}"/></w:rPr><w:t xml:space="preserve">${X(b?s.slice(2,-2):s)}</w:t></w:r>`}).join('')}
const P=(t,o={})=>`<w:p><w:pPr>${o.kn?'<w:keepNext/>':''}${o.num?'<w:numPr><w:ilvl w:val="0"/><w:numId w:val="990"/></w:numPr>':''}${o.bd||''}${o.sh?`<w:shd w:val="clear" w:color="auto" w:fill="${o.sh}"/>`:''}<w:spacing w:before="${o.bf||0}" w:after="${o.af??100}" w:line="${o.ln||276}" w:lineRule="auto"/><w:ind w:left="${o.l||0}" w:right="${o.r||0}"${o.h?` w:hanging="${o.h}"`:''}/><w:jc w:val="${o.al||'both'}"/></w:pPr>${runs(t,o)}</w:p>`;
function TB(head,rows,w,o={},nb){const cell=(t,wd,hd)=>`<w:tc><w:tcPr><w:tcW w:w="${wd}" w:type="dxa"/>${hd?'<w:shd w:val="clear" w:color="auto" w:fill="E7E7E7"/>':''}<w:tcMar><w:top w:w="60" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/></w:tcMar></w:tcPr>${String(t??'').split('\n').map(l=>P(l,{sz:o.sz||18,b:hd,al:o.al||'left',af:20,ln:240})).join('')}</w:tc>`;
const bd=['top','left','bottom','right','insideH','insideV'].map(s=>`<w:${s} w:val="${nb?'nil':'single'}" w:sz="4" w:space="0" w:color="BFBFBF"/>`).join('');
return`<w:tbl><w:tblPr><w:tblW w:w="${w.reduce((a,b)=>a+b)}" w:type="dxa"/><w:tblBorders>${bd}</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${w.map(x=>`<w:gridCol w:w="${x}"/>`).join('')}</w:tblGrid>${head?`<w:tr><w:trPr><w:cantSplit/><w:tblHeader/></w:trPr>${head.map((h,i)=>cell(h,w[i],1)).join('')}</w:tr>`:''}${rows.map(r=>`<w:tr><w:trPr><w:cantSplit/></w:trPr>${r.map((c,i)=>cell(c,w[i])).join('')}</w:tr>`).join('')}</w:tbl>`+P('',{af:80})}
function SG(l){const w=Math.floor(8640/l.length),c=s=>`<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/></w:tcPr>${P('',{bf:560,af:0,al:'center',kn:1})}${P('______________________________',{al:'center',af:0,kn:1})}${P('**'+s[0]+'**',{al:'center',af:0,sz:20,kn:1})}${P(s[1]||'',{al:'center',af:100,sz:18})}</w:tc>`;
const bd=['top','left','bottom','right','insideH','insideV'].map(s=>`<w:${s} w:val="nil"/>`).join('');return`<w:tbl><w:tblPr><w:tblW w:w="${w*l.length}" w:type="dxa"/><w:tblBorders>${bd}</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${l.map(()=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid><w:tr><w:trPr><w:cantSplit/></w:trPr>${l.map(c).join('')}</w:tr></w:tbl>`+P('',{af:0})}
function bx([k,a,c,d,e]){switch(k){
case't':return P(a,{b:1,sz:26,al:'center',af:200,bf:100});
case'box':return a.map(l=>P(l,{sh:'F2F2F2',al:'left',af:0,l:200,r:200})).join('')+P('',{af:60});
case'h':return P(a,{b:1,sz:24,sh:'D9D9D9',bd:BAR,l:200,bf:200,af:120,al:'left',kn:1});
case'h2':return P(a,{b:1,sz:22,bf:120,af:80,al:'left',kn:1});
case'p':return P(a,c||{});case'r':return P(a,{al:'right'});
case'ul':return a.map(t=>P(t,{num:1,l:567,h:283,af:50})).join('');
case'tbl':return TB(a,c,d,e);case'kv':return TB(null,a,[2400,6240],{sz:20});
case'sig':return SG(a);case'sp':return P('',{af:200});
case'br':return'<w:p><w:r><w:br w:type="page"/></w:r></w:p>';}return''}
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
function crc32(u){let t=crc32.t;if(!t){t=crc32.t=[];for(let n=0,c;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}}let r=-1;for(let i=0;i<u.length;i++)r=t[(r^u[i])&255]^(r>>>8);return(r^-1)>>>0}
const cat=a=>{const o=new Uint8Array(a.reduce((s,x)=>s+x.length,0));let i=0;a.forEach(x=>{o.set(x,i);i+=x.length});return o};
function zipB(files){const enc=new TextEncoder(),parts=[],cd=[];let off=0;
for(const f of files){const nm=enc.encode(f.n),h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,f.m,true);h.setUint16(12,0x21,true);h.setUint32(14,f.crc,true);h.setUint32(18,f.d.length,true);h.setUint32(22,f.us,true);h.setUint16(26,nm.length,true);parts.push(new Uint8Array(h.buffer),nm,f.d);
const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,f.m,true);c.setUint16(14,0x21,true);c.setUint32(16,f.crc,true);c.setUint32(20,f.d.length,true);c.setUint32(24,f.us,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);cd.push(new Uint8Array(c.buffer),nm);off+=30+nm.length+f.d.length}
const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cd.reduce((s,x)=>s+x.length,0),true);e.setUint32(16,off,true);return cat([...parts,...cd,new Uint8Array(e.buffer)])}
function docx(bl){const xml=BASE.root+'<w:body>'+bl.map(bx).join('')+BASE.sect+'</w:body></w:document>',d=new TextEncoder().encode(xml),F=[];
const ks=Object.keys(BASE.f).sort((a,b)=>(a[0]=='['?0:1)-(b[0]=='['?0:1));ks.forEach(n=>{const[s,c,u]=BASE.f[n];F.push({n,d:b64(s),m:8,crc:c,us:u})});F.push({n:'word/document.xml',d,m:0,crc:crc32(d),us:d.length});return zipB(F)}
const ih=t=>X(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
function hx(bl){return bl.map(([k,a,c,d])=>{switch(k){
case't':return`<h3 class="dt">${ih(a)}</h3>`;case'box':return`<div class="dbox">${a.map(l=>`<div>${ih(l)}</div>`).join('')}</div>`;
case'h':return`<h4 class="dh">${ih(a)}</h4>`;case'h2':return`<h5>${ih(a)}</h5>`;case'p':return`<p>${ih(a)}</p>`;case'r':return`<p style="text-align:right">${ih(a)}</p>`;
case'ul':return`<ul>${a.map(t=>`<li>${ih(t)}</li>`).join('')}</ul>`;
case'tbl':return`<div class="wrap"><table class="dtb">${a?`<tr>${a.map(h=>`<th>${ih(h)}</th>`).join('')}</tr>`:''}${c.map(r=>`<tr>${r.map(x=>`<td>${ih(x)}</td>`).join('')}</tr>`).join('')}</table></div>`;
case'kv':return`<table class="dtb">${a.map(r=>`<tr><th>${ih(r[0])}</th><td>${ih(r[1])}</td></tr>`).join('')}</table>`;
case'sig':return`<div class="dsig">${a.map(s=>`<div><i></i><b>${X(s[0])}</b><small>${X(s[1]||'')}</small></div>`).join('')}</div>`;
case'sp':return'<p>&nbsp;</p>';}return''}).join('')}
function txt(bl){const u=s=>String(s).replace(/\*\*/g,'');return bl.map(([k,a,c,d])=>k=='t'?'\n'+u(a).toUpperCase()+'\n'+'='.repeat(50):k=='box'?a.map(u).join('\n'):k=='h'?'\n'+u(a):k=='h2'?'\n'+u(a):k=='p'||k=='r'?u(a):k=='ul'?a.map(x=>'  - '+u(x)).join('\n'):k=='tbl'?c.map(r=>r.map(x=>u(x).replace(/\n/g,' / ')).join(' | ')).join('\n'):k=='kv'?a.map(r=>u(r[0])+': '+u(r[1])).join('\n'):k=='sig'?a.map(s=>'\n______________________\n'+s[0]+' ('+(s[1]||'')+')').join('\n'):'').filter(x=>x!=='').join('\n')}
const mesAno=()=>{const s=new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return s[0].toUpperCase()+s.slice(1)};
function cgBlocks(p,t){const M={dep:'',rep:'Supervisão > Gestão > Direção'},out=[];let n=0,s=0,sec='',mat=[];const fl=()=>{if(mat.length){out.push(['tbl',['PERIODICIDADE','ATIVIDADES RELACIONADAS'],mat,[1900,6740]]);mat=[]}};
for(let l of t.split('\n')){l=l.trim();if(!l)continue;
if(/^(dep|rep):/.test(l)){M[l.slice(0,3)]=l.slice(4).trim();continue}
if(l.startsWith('##')){s++;out.push(['h2',n+'.'+s+' '+l.slice(2).trim()]);continue}
if(l[0]=='#'){fl();n++;s=0;sec=l.slice(1).trim();out.push(['h',n+'. '+sec]);continue}
if(l[0]=='-'){const it=l.slice(1).trim(),z=out[out.length-1];z&&z[0]=='ul'?z[1].push(it):out.push(['ul',[it]]);continue}
if(/^MATRIZ/i.test(sec)&&l.includes(':')){const i=l.indexOf(':');mat.push(['**'+l.slice(0,i)+'**',l.slice(i+1).trim()]);continue}
out.push(['p',l])}fl();
return[['t','DESCRIÇÃO DE CARGOS E RESPONSABILIDADES'],['box',['**Colaborador:** '+p.nome,'**Cargo:** '+(p.cargo||'—'),'**Departamento:** '+(M.dep||p.depto||'—'),'**Reporte Hierárquico:** '+M.rep,'**Data de Emissão:** '+mesAno()]],...out,['sp'],['p','Declaro que recebi esta descrição de cargo, li e compreendi as atribuições, responsabilidades e normas aqui descritas, comprometendo-me a cumpri-las.'],['r','Recife/PE, ____/____/________'],['sig',[[p.nome,'Colaborador'],['Administração – Boa Vista Corporate','Gestor responsável']]]]}
const CG={
ti:{n:'Analista de TI Júnior',t:`dep: TI
rep: Supervisão > Gestão > Direção
#OBJETIVO DO CARGO
Garantir o pleno funcionamento da infraestrutura tecnológica do Boa Vista Corporate, prestando suporte de excelência aos colaboradores e clientes do coworking. Atuar ativamente na manutenção da disponibilidade dos recursos de tecnologia, na organização rigorosa dos ativos de TI e colaborar de forma contínua para a otimização e automação dos processos operacionais da organização.
#PRINCIPAIS RESPONSABILIDADES E ATRIBUIÇÕES
##Suporte Técnico
- Prestar atendimento técnico resolutivo e ágil aos colaboradores da empresa;
- Auxiliar clientes e usuários do coworking em demandas relacionadas à conectividade, redes de internet e demais recursos tecnológicos disponibilizados no espaço;
- Realizar a instalação, configuração e manutenção de caráter preventivo e corretivo em computadores, notebooks e periféricos dos setores da empresa;
- Configurar e testar impressoras, scanners e demais equipamentos de suporte operacional;
- Administrar, configurar e fornecer suporte a contas de e-mail corporativo dos colaboradores;
- Registrar, acompanhar, documentar e solucionar chamados técnicos por meio dos canais oficiais;
- Identificar com precisão e corrigir falhas de hardware, sistemas operacionais e softwares homologados;
##Infraestrutura e Rede
- Monitorar continuamente a estabilidade e a performance da rede de internet do empreendimento;
- Auxiliar na administração, mapeamento e suporte básico de equipamentos de rede, incluindo roteadores, switches e access points;
- Realizar testes e rotinas preventivas visando mitigar riscos de oscilação ou quedas de conexão;
- Identificar de forma proativa e reportar falhas de conectividade ou anomalias na rede interna;
- Acionar fornecedores, operadoras de telecomunicações e acompanhar os atendimentos técnicos terceirizados até a efetiva resolução do problema;
- Apoiar a execução de projetos de melhoria na infraestrutura tecnológica geral do complexo.
##Controle de Ativos e Configurações
- Manter rigorosamente atualizado o inventário físico e lógico de equipamentos de TI;
- Zelar pelo controle de ciclo de vida de computadores, notebooks, monitores, impressoras e periféricos;
- Controlar a atribuição e o vencimento de licenças de softwares utilizadas pelas áreas de negócio;
- Acompanhar prazos de garantia, cronogramas de manutenção preventiva e sugerir substituições programadas de equipamentos depreciados;
- Organizar, estruturar e manter atualizada a documentação técnica dos ativos e os manuais de procedimentos.
##Segurança da Informação
- Executar rotinas de backup e validação de dados em estrita conformidade com os procedimentos e políticas internas.
- Monitorar a conformidade, atualizações de assinaturas de antivírus e o status dos sistemas de proteção e firewalls.
- Auxiliar no controle de acessos, criação de usuários, concessão e revogação de permissões em sistemas institucionais.
- Contribuir ativamente para a disseminação de boas práticas e preservação da segurança das informações corporativas.
##Automação e Melhoria de Processos
- Desenvolver e otimizar planilhas, dashboards e ferramentas de controle operacional para apoio às demandas administrativas;
- Auxiliar na automação de rotinas e fluxos internos de trabalho utilizando as ferramentas tecnológicas disponíveis na empresa;
- Elaborar relatórios gerenciais e consolidar indicadores operacionais sempre que solicitado pela liderança;
- Propor soluções e inovações tecnológicas que visem o ganho de eficiência, produtividade e redução de custos operacionais.
#MATRIZ DE RESPONSABILIDADES PERIÓDICAS
Diariamente: Atendimento, triagem e resolução de chamados técnicos voltados a Rede; suporte direto a usuários e clientes; monitoramento ativo de redes e links de internet; verificação de integridade e funcionamento dos equipamentos e servidores críticos.
Semanalmente: Atualização do inventário de hardware e movimentação de insumos; auditoria e verificação de rotinas de backups semanais; revisão geral da infraestrutura física do coworking; organização da documentação técnica e base de conhecimento.
Mensalmente: Consolidação e emissão do relatório de atividades executadas; levantamento e apresentação de melhorias e automações implementadas; auditoria de conformidade de licenças de software; avaliação técnica de necessidades para manutenção ou substituição programada de equipamentos.
#PERFIL COMPORTAMENTAL ESPERADO
- **Organização e Proatividade:** Capacidade de autogestão de demandas e antecipação a falhas potenciais.
- **Resolução de Problemas:** Raciocínio lógico aguçado para diagnósticos rápidos e assertivos.
- **Comunicação e Atendimento:** Cordialidade, clareza e empatia no trato com o público do coworking e colaboradores.
- **Comprometimento:** Respeito estrito a prazos, normas de segurança e processos homologados.
- **Mindset de Aprendizado:** Interesse genuíno em desenvolvimento profissional e novas tecnologias.`},
fin:{n:'Gestor Administrativo Financeiro',t:`dep: Administração
rep: Gestão > Direção
#OBJETIVO DO CARGO
Assegurar a gestão administrativa, financeira e de pessoal do Boa Vista Corporate, garantindo a regularidade dos pagamentos, recebimentos, contratos e obrigações legais, o bom relacionamento com fornecedores e clientes e a organização das rotinas que sustentam a operação do coworking.
#PRINCIPAIS RESPONSABILIDADES E ATRIBUIÇÕES
##Financeiro e Contábil
- Controlar contas a pagar e a receber, emissão e acompanhamento de cobranças e faturas;
- Realizar a conciliação entre os controles internos, extratos bancários e lançamentos contábeis;
- Acompanhar o fluxo de caixa, prestação de contas e elaborar relatórios financeiros para a direção;
- Enviar à contabilidade externa os documentos e informações necessários nos prazos estabelecidos.
##Contratos e Compliance
- Elaborar, revisar e controlar contratos de locação, coworking, energia e prestação de serviços, incluindo vigências e reajustes anuais;
- Acompanhar o cumprimento das obrigações legais, trabalhistas, fiscais e normativas aplicáveis ao empreendimento;
- Manter organizada e atualizada a documentação institucional da empresa.
##Pessoas e Rotinas Administrativas
- Conduzir as rotinas de departamento pessoal: admissões, controle de jornada e escalas, férias, benefícios e documentação dos colaboradores;
- Apoiar a gestão das equipes de recepção, TI, manutenção e serviços gerais;
- Emitir comunicados, ofícios, termos e demais documentos administrativos.
##Fornecedores e Operação
- Realizar cotações, emitir ordens de compra e acompanhar entregas e serviços contratados;
- Manter relacionamento com concessionárias, prestadores e demais fornecedores, resolvendo pendências e divergências de cobrança.
#MATRIZ DE RESPONSABILIDADES PERIÓDICAS
Diariamente: Conferência de pagamentos e recebimentos; atendimento a demandas de clientes, equipe e fornecedores; acompanhamento de pendências administrativas e de ocorrências da operação.
Semanalmente: Conciliação bancária; programação de pagamentos; revisão de escalas, faltas e atestados; acompanhamento de ordens de compra e serviços em andamento.
Mensalmente: Fechamento financeiro e envio de documentos à contabilidade; fechamento do controle de ponto; emissão de relatórios gerenciais; revisão de contratos e reajustes a vencer.
#PERFIL COMPORTAMENTAL ESPERADO
- **Organização e Precisão:** Atenção a números, prazos e documentos.
- **Responsabilidade e Sigilo:** Tratamento ético de informações financeiras e de pessoal.
- **Visão Analítica:** Capacidade de identificar divergências e propor melhorias.
- **Comunicação:** Clareza e cordialidade com equipe, clientes e fornecedores.`},
sg:{n:'Serviços Gerais',t:`dep: Serviços Gerais
rep: Encarregado > Gestão > Direção
#OBJETIVO DO CARGO
Manter limpos, organizados e em condições de uso os ambientes do Boa Vista Corporate, contribuindo para a boa experiência dos clientes e colaboradores e para a conservação do patrimônio.
#PRINCIPAIS RESPONSABILIDADES E ATRIBUIÇÕES
##Limpeza e Conservação
- Realizar a limpeza e a higienização de salas, áreas comuns, corredores, banheiros, copas e demais ambientes designados;
- Varrer, passar pano, aspirar, limpar vidros, superfícies e mobiliário conforme a rotina estabelecida;
- Repor itens de higiene e insumos (papel, sabonete, copos, entre outros) e comunicar a necessidade de compra;
- Recolher e destinar corretamente o lixo e os resíduos, observando a coleta seletiva.
##Organização e Apoio
- Preparar e organizar salas de reunião e espaços para eventos, quando solicitado;
- Auxiliar na movimentação de mobiliário e materiais de pequeno porte;
- Informar à supervisão qualquer dano, vazamento, lâmpada queimada ou item que necessite de manutenção.
##Segurança e Uso de Materiais
- Utilizar corretamente os equipamentos de proteção individual (EPIs) e os produtos de limpeza, seguindo as orientações de segurança;
- Sinalizar pisos molhados e áreas em limpeza;
- Guardar e manter organizados os materiais e equipamentos de trabalho.
#MATRIZ DE RESPONSABILIDADES PERIÓDICAS
Diariamente: Limpeza de salas, banheiros, copas e áreas comuns; reposição de insumos; coleta de lixo; organização dos ambientes.
Semanalmente: Limpeza mais completa de vidros, rodapés e mobiliário; conferência do estoque de materiais; apoio à organização de salas e espaços.
Mensalmente: Limpeza técnica de áreas de difícil acesso; inventário dos materiais e equipamentos de limpeza; comunicação de necessidades de reposição.
#PERFIL COMPORTAMENTAL ESPERADO
- **Zelo e Organização:** Cuidado com os ambientes, materiais e equipamentos.
- **Pontualidade e Assiduidade:** Cumprimento da escala e dos horários.
- **Discrição e Respeito:** Postura cordial com clientes, visitantes e colegas.
- **Disposição para Equipe:** Colaboração e atenção às orientações recebidas.`},
rec:{n:'Recepcionista',t:`dep: Recepção
rep: Supervisão > Gestão > Direção
#OBJETIVO DO CARGO
Receber, orientar e atender clientes, visitantes e prestadores com cordialidade e eficiência, sendo o primeiro contato do Boa Vista Corporate e apoiando as rotinas administrativas e operacionais do coworking.
#PRINCIPAIS RESPONSABILIDADES E ATRIBUIÇÕES
##Atendimento
- Receber e encaminhar clientes, visitantes e prestadores, identificando e registrando os acessos conforme as normas do empreendimento;
- Atender chamadas telefônicas, mensagens e solicitações, prestando informações claras e corretas;
- Orientar clientes sobre o uso dos espaços, serviços e regras de convivência.
##Rotinas da Recepção
- Controlar o recebimento e a entrega de correspondências e encomendas;
- Realizar o agendamento e o acompanhamento do uso das salas de reunião;
- Manter a recepção organizada e apresentável durante todo o expediente;
- Registrar ocorrências, solicitações e reclamações, encaminhando-as ao setor responsável.
##Apoio Administrativo
- Dar suporte à administração em tarefas de digitação, organização de documentos, arquivo e envio de comunicados;
- Apoiar a operação em dias de eventos, treinamentos e visitas;
- Cumprir e fazer cumprir as normas de acesso e segurança do empreendimento.
#MATRIZ DE RESPONSABILIDADES PERIÓDICAS
Diariamente: Recepção e cadastro de visitantes; atendimento telefônico; controle de correspondências e encomendas; agenda das salas; registro de ocorrências.
Semanalmente: Organização de documentos e arquivo; conferência da agenda de salas e de eventos; atualização de cadastros de clientes e contatos.
Mensalmente: Apoio na emissão de relatórios de atendimento e uso de salas; conferência de materiais de escritório e solicitação de reposição.
#PERFIL COMPORTAMENTAL ESPERADO
- **Cordialidade e Empatia:** Atendimento atencioso e educado a todos os públicos.
- **Comunicação Clara:** Boa expressão verbal e escrita.
- **Organização e Agilidade:** Capacidade de lidar com várias demandas ao mesmo tempo.
- **Discrição:** Cuidado com informações de clientes e do empreendimento.`},
vig:{n:'Vigia / Vigilante',t:`dep: Segurança Patrimonial
rep: Supervisão > Gestão > Direção
#OBJETIVO DO CARGO
Zelar pela segurança do patrimônio e das pessoas no Boa Vista Corporate, controlando o acesso ao empreendimento, realizando rondas e registrando ocorrências, de forma a prevenir riscos e acionar rapidamente os responsáveis em situações de emergência.
#PRINCIPAIS RESPONSABILIDADES E ATRIBUIÇÕES
##Controle de Acesso
- Controlar a entrada e a saída de pessoas, veículos e materiais, conforme as normas do empreendimento;
- Não permitir o acesso de pessoas não autorizadas e comunicar à administração situações suspeitas;
- Registrar, quando aplicável, visitantes, prestadores e movimentação de chaves e equipamentos.
##Rondas e Monitoramento
- Realizar rondas periódicas nas áreas internas e externas, conferindo portas, janelas, luzes, equipamentos e áreas de risco;
- Acompanhar o monitoramento por câmeras e demais recursos de segurança disponíveis;
- Verificar o fechamento e a abertura do empreendimento, conforme a escala.
##Ocorrências e Emergências
- Registrar em livro ou sistema próprio todas as ocorrências e passagens de turno;
- Acionar imediatamente a administração e, quando necessário, os serviços de emergência (Bombeiros, SAMU, Polícia);
- Conhecer e seguir os procedimentos de evacuação e combate a princípio de incêndio do empreendimento.
#MATRIZ DE RESPONSABILIDADES PERIÓDICAS
Diariamente: Controle de acessos; rondas conforme o plano; registro de ocorrências; passagem de turno; conferência de portas, luzes e alarmes.
Semanalmente: Verificação de equipamentos de segurança e iluminação; conferência do controle de chaves; comunicação de pontos de atenção à administração.
Mensalmente: Participação em treinamentos e simulados; apoio na revisão dos procedimentos de segurança.
#PERFIL COMPORTAMENTAL ESPERADO
- **Atenção e Vigilância:** Observação constante do ambiente e das pessoas.
- **Responsabilidade e Ética:** Honestidade e sigilo sobre informações do empreendimento.
- **Equilíbrio Emocional:** Calma e firmeza em situações de risco.
- **Pontualidade e Assiduidade:** Presença e pontualidade, especialmente nos turnos noturnos.`},
man:{n:'Auxiliar de Manutenção',t:`dep: Serviços Gerais
rep: Encarregado > Gestão > Direção
#OBJETIVO DO CARGO
Executar serviços de manutenção preventiva e corretiva nas instalações do Boa Vista Corporate, mantendo as estruturas, os equipamentos e os ambientes em perfeito estado de uso e segurança.
#PRINCIPAIS RESPONSABILIDADES E ATRIBUIÇÕES
##Manutenção Predial
- Executar pequenos reparos elétricos, hidráulicos, de alvenaria, pintura, forro, portas, fechaduras e mobiliário;
- Substituir lâmpadas, torneiras, sifões, tomadas e componentes de desgaste;
- Acompanhar o funcionamento de equipamentos como bebedouros, ar-condicionado e iluminação, acionando o responsável ou fornecedor quando necessário.
##Ordens de Serviço
- Atender as ordens de serviço e solicitações recebidas, respeitando a prioridade e o prazo estabelecidos;
- Registrar o serviço realizado, os materiais utilizados e as pendências.
##Segurança e Organização
- Utilizar os EPIs e seguir as normas de segurança no trabalho, especialmente em serviços elétricos e em altura;
- Manter ferramentas, materiais e a oficina organizados e conservados;
- Comunicar à chefia riscos, defeitos e necessidade de compra de materiais.
#MATRIZ DE RESPONSABILIDADES PERIÓDICAS
Diariamente: Atendimento às ordens de serviço; verificação de lâmpadas, torneiras, portas e equipamentos; ronda de conferência das instalações.
Semanalmente: Manutenção preventiva programada; conferência das ferramentas e do estoque de materiais; organização da oficina.
Mensalmente: Relatório de serviços executados; levantamento de necessidades de reparo e compra de materiais.
#PERFIL COMPORTAMENTAL ESPERADO
- **Proatividade:** Antecipar falhas e resolver problemas com autonomia.
- **Cuidado com a Segurança:** Uso correto de EPIs e atenção a riscos.
- **Organização:** Zelo por ferramentas, materiais e registros.
- **Trabalho em Equipe:** Colaboração com os demais setores.`},
enc:{n:'Encarregado de Obras',t:`dep: Serviços Gerais
rep: Gestão > Direção
#OBJETIVO DO CARGO
Coordenar a equipe de manutenção e as obras e reformas do Boa Vista Corporate, garantindo a execução dos serviços com qualidade, segurança, dentro dos prazos e custos previstos.
#PRINCIPAIS RESPONSABILIDADES E ATRIBUIÇÕES
##Coordenação de Equipes e Serviços
- Planejar, distribuir e acompanhar as tarefas da equipe de manutenção e dos prestadores de serviço;
- Acompanhar a execução de obras e reformas, verificando o cumprimento de projetos, cronogramas e padrões de qualidade;
- Orientar e treinar a equipe quanto aos procedimentos e normas de segurança.
##Materiais e Fornecedores
- Levantar necessidades de materiais, conferir entregas e controlar o estoque e o uso de insumos;
- Apoiar cotações e acompanhar prestadores e empreiteiras contratadas;
- Conferir medições e serviços executados antes do pagamento.
##Segurança e Relatórios
- Garantir o uso de EPIs e o cumprimento das normas de segurança do trabalho nas obras e serviços;
- Controlar a presença e o cumprimento das escalas da equipe, comunicando ocorrências à administração;
- Elaborar relatórios de andamento das obras e dos serviços executados.
#MATRIZ DE RESPONSABILIDADES PERIÓDICAS
Diariamente: Distribuição de tarefas; acompanhamento das obras e dos serviços; conferência de segurança e de materiais; registro de ocorrências.
Semanalmente: Reunião de alinhamento com a equipe; conferência de cronogramas e entregas; levantamento de materiais necessários.
Mensalmente: Relatório de andamento e de custos; conferência de medições; avaliação das necessidades de manutenção preventiva.
#PERFIL COMPORTAMENTAL ESPERADO
- **Liderança:** Capacidade de orientar e motivar a equipe.
- **Planejamento e Organização:** Gestão de prazos, materiais e prioridades.
- **Responsabilidade com Segurança:** Compromisso com a prevenção de acidentes.
- **Comunicação:** Clareza no contato com equipe, fornecedores e administração.`},
gen:{n:'Cargo (modelo geral)',t:`dep:
rep: Supervisão > Gestão > Direção
#OBJETIVO DO CARGO
Descreva aqui o objetivo do cargo.
#PRINCIPAIS RESPONSABILIDADES E ATRIBUIÇÕES
##Atividades principais
- Descreva a primeira atribuição;
- Descreva a segunda atribuição.
#MATRIZ DE RESPONSABILIDADES PERIÓDICAS
Diariamente: Atividades diárias.
Semanalmente: Atividades semanais.
Mensalmente: Atividades mensais.
#PERFIL COMPORTAMENTAL ESPERADO
- **Comprometimento:** Cumprimento de prazos, normas e processos.`}};
function cgId(c){c=(c||'').toLowerCase();return/analista de ti/.test(c)?'ti':/financ/.test(c)?'fin':/recep/.test(c)?'rec':/vigi/.test(c)?'vig':/manuten/.test(c)?'man':/encarregado/.test(c)?'enc':/servi[cç]os gerais/.test(c)?'sg':'gen'}
