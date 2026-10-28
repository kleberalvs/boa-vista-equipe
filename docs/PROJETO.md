# Colaboradores · Boa Vista Corporate — registro do projeto

Documento de memória do projeto: como o ambiente foi criado e como ele funciona. Criado a partir da conversa de construção no Claude (a conversa continua no histórico do Claude do Kleber).

## O que é
Aplicativo (PWA) de gestão da equipe do coworking Boa Vista Corporate, Recife/PE. Estilo Apple, funciona no computador, celular e tablet, instala como aplicativo, abre offline e sincroniza os aparelhos.

- Site: https://kleberalvs.github.io/boa-vista-equipe/
- Código: https://github.com/kleberalvs/boa-vista-equipe (público, sem dados pessoais)
- Dados e login: Supabase (projeto `yirauybpwrkhhubkvril`), tabelas `records` e `shares`

## Recursos
Painel com gráficos alternáveis · Equipe (cargo, ambientes múltiplos, admissão, férias, escalas) · Escalas · Ambientes · Férias · Documentos em Word com timbrado (recibo, ofício, comunicado, ordem de serviço/compra, descrição de cargo, crachá, fardamento e outros) · Relatórios com timbrado (impressão/PDF) · Anotações em pastas e subpastas · Histórico com restauração · Exportar/Importar backup.

Novidades de 27/10/2026 (versão 2026.10.27-2):
- Tema claro/escuro/automático (por aparelho), logo branca no escuro.
- Imagem da empresa e capa estilo Facebook no Painel (sincronizadas entre aparelhos).
- Link público de visualização (somente leitura, sem login).
- Cargo do Kleber: Gestor Administrativo Financeiro.

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
