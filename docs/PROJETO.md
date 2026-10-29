# Colaboradores · Boa Vista Corporate — registro do projeto

Documento de memória do projeto: como o ambiente foi criado e como ele funciona. Criado a partir da conversa de construção no Claude (a conversa continua no histórico do Claude do Kleber).

## O que é
Aplicativo (PWA) de gestão da equipe do coworking Boa Vista Corporate, Recife/PE. Estilo Apple, funciona no computador, celular e tablet, instala como aplicativo, abre offline e sincroniza os aparelhos.

- Site: https://kleberalvs.github.io/boavista/
- Código: https://github.com/kleberalvs/boavista (público, sem dados pessoais)
- Dados e login: Supabase (projeto `yirauybpwrkhhubkvril`), tabelas `records` e `shares`

## Recursos
Painel com gráficos alternáveis · Equipe (cargo, ambientes múltiplos, admissão, férias, escalas) · Escalas · Ambientes · Férias · Documentos em Word com timbrado (recibo, ofício, comunicado, ordem de serviço/compra, descrição de cargo, crachá, fardamento e outros) · Relatórios com timbrado (impressão/PDF) · Anotações em pastas e subpastas · Histórico com restauração · Exportar/Importar backup.

Novidades de 27/10/2026 (versão 2026.10.27-2):
- Tema claro/escuro/automático (por aparelho), logo branca no escuro.
- Imagem da empresa e capa estilo Facebook no Painel (sincronizadas entre aparelhos).
- Link público de visualização (somente leitura, sem login).
- Cargo do Kleber: Gestor Administrativo Financeiro.

Celular (28/10/2026): barra de navegação fixa embaixo (Painel, Equipe, Escalas, Ambientes, Mais), cabeçalho compacto com ícones, Escalas e Férias em cartões, folhas inferiores para janelas, barra de status offline, travas contra zoom e transições suaves entre páginas.

## Arquitetura
- Scripts clássicos em ordem: `timbrado.js` → `docx.js` → `extras.js` → `app.js` → `sync.js`.
- `db` = {p, amb, cg, n:{f,i}, log, brand, v, m3, m4}; salvo em `localStorage` (`bvc_db`) e sincronizado.
- Cada item é um registro: `p` colaborador, `f` pasta, `i` anotação, `l` histórico, `c` configurações, `b` marca (imagem e capa). Envia só o que mudou; recebe em tempo real (Realtime). Conflito: vale a última gravação.
- Service worker `sw.js` (rede primeiro, cache offline). Cada versão nova muda `VERSAO` em `sw.js` e `APPV` em `js/sync.js`.
- Gerador de Word próprio (`docx.js`) sobre as partes do timbrado do Kleber.

## Link público
- Cria uma cópia (instantâneo) do que está na tela, sem botões, e grava em `shares` com um código de 32 caracteres.
- Quem não tem conta abre `…/#v=CODIGO`; o app chama a função `get_share`, que só devolve um link se o código inteiro estiver certo e não tiver expirado. A tabela fica fechada para visitantes.
- No app: **Compartilhar** → escolhe validade → Criar link. Dá para **Copiar**, **Enviar**, **Atualizar** (reinstala o instantâneo atual) e **Revogar**.
- O HTML do link é sanitizado ao criar e ao abrir.
- Atenção: o link mostra dados de colaboradores a quem o tiver.

## Como atualizar
1. Pedir a mudança no Claude, que edita o código e envia ao GitHub.
2. O GitHub Pages republica em 1–2 minutos.
3. Os aparelhos mostram "Nova versão disponível" → Atualizar.
Mudanças no banco exigem rodar um arquivo SQL em `supabase/` (SQL Editor do Supabase), uma vez.

## Segurança
- Cadastros desligados no Supabase; usuários criados manualmente (Auto Confirm).
- A chave `anon` é pública por desenho; o acesso é protegido por RLS (só logados).
- Nunca subir `dados-iniciais.json` ao GitHub.

## Testes feitos
Servidor Supabase simulado + Chromium (Playwright) com dois aparelhos: login, sincronização em tempo real, exclusão/restauração, offline, tema, imagem/capa, criação/revogação de links, token inválido e neutralização de HTML malicioso. Não testado em iPhone/Safari reais.

## Demandas (29/10/2026, versão 2026.10.29-1)
Seção de demandas operacionais da equipe (limpeza, manutenção, recepção, TI…), dentro do mesmo site e do mesmo banco.

- Endereço: https://kleberalvs.github.io/boavista/demandas/ (instala como app próprio no celular dos colaboradores)
- No painel: menu **Demandas ↗** (computador) ou **Mais → Demandas da equipe** (celular). Mesma sessão: o proprietário entra uma vez só.
- Nas Demandas, o proprietário volta pelo item **Painel da equipe ↗**.

Quem vê o quê:
- **Proprietário** (conta do painel, login por e-mail): tudo — painel inteiro + Demandas como gestor. A primeira conta do painel que abrir as Demandas vira gestora.
- **Colaboradores** (criados dentro das Demandas, login só com usuário e senha, sem e-mail): apenas as demandas do(s) seu(s) departamento(s), conclusão com fotos, observações, conversa na demanda e feedbacks. Se abrirem o endereço do painel, são levados às Demandas. O banco bloqueia para eles as tabelas `records` e `shares` (regra no Supabase, não só na tela).
- Gestores criados dentro das Demandas também não acessam o painel.

Recursos: demandas diárias (dias da semana) e específicas (prazo), prioridade, local, horário, responsável opcional, foto obrigatória opcional; tela Hoje com progresso por departamento; histórico com fotos e exportação CSV; equipe e departamentos; feedbacks com resposta do gestor; funciona sem internet (envia as conclusões quando voltar).
Ao criar um acesso, o gestor pode escolher a pessoa da lista **Equipe** do painel: preenche o nome e sugere o departamento pelo cargo.

Banco: `supabase/atualizacao-3-demandas.sql` (rodar uma vez no SQL Editor; pode repetir). Tabelas `dm_*`, pasta de fotos `demandas-fotos` (privada), funções `dm_criar_usuario`, `dm_redefinir_senha`, `dm_definir_ativo`, `dm_bootstrap`, `dm_sem_painel`.
Atenção: se rodar de novo `schema.sql` ou `atualizacao-2-compartilhamento.sql`, rode a `atualizacao-3-demandas.sql` em seguida (ela reaplica a proteção do painel).

Fotos: comprimidas no aparelho antes do envio; ficam no Storage do Supabase (1 GB no plano gratuito).
Arquivos: `demandas/index.html`, `demandas/app.js`, `demandas/app.css`, `demandas/sw.js` (cache próprio `bvc-demandas-*`), `demandas/manifest.webmanifest`, `demandas/icons/`.
Testes: SQL e regras de acesso num Postgres local; navegador (Playwright) com painel + Demandas: login único do proprietário, criação de acesso a partir da equipe do painel, colaboradora no celular vê só as demandas e é redirecionada ao tentar abrir o painel, todas as abas do painel sem erros.

## Endereço novo (29/10/2026)
Repositório renomeado de `boa-vista-equipe` para `boavista`.
- Painel: https://kleberalvs.github.io/boavista/
- Demandas: https://kleberalvs.github.io/boavista/demandas/
O endereço antigo deixa de funcionar; quem instalou o app precisa instalar de novo pelo endereço novo. Links públicos de visualização criados antes precisam ser recriados (Compartilhar → Criar link).
No Supabase (Authentication → URL Configuration), o Site URL e as Redirect URLs passam a ser o endereço novo.
