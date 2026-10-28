# Colaboradores · Boa Vista Corporate (aplicativo)

Aplicativo de colaboradores, escalas, ambientes, férias, documentos em Word, relatórios, anotações e histórico.
Funciona no computador, no celular e no tablet, instala como aplicativo, abre mesmo sem internet e mantém os aparelhos sincronizados.

**Como funciona**
- **GitHub Pages** hospeda o aplicativo (gratuito).
- **Supabase** guarda os dados com login e sincroniza os aparelhos (plano gratuito).
- Os dados dos colaboradores **nunca** ficam no GitHub, só no Supabase, atrás de login.

Tempo total: cerca de 30 minutos. Não precisa programar.

---

## Parte 1 · Banco de dados e login (Supabase)

1. Entre em **supabase.com** e crie uma conta (pode ser com o Google ou o GitHub).
2. Clique em **New project**. Nome: `boa-vista`. Crie uma senha do banco e **guarde**. Região: **South America (São Paulo)**. Plano: **Free**.
3. Quando o projeto terminar de carregar, abra **SQL Editor** → **New query**. Abra o arquivo `supabase/schema.sql` desta pasta, copie **todo** o conteúdo, cole e clique em **Run**. Deve aparecer "Success".
4. **Passo de segurança (importante):** vá em **Authentication** → **Sign In / Providers** (ou *Providers* → *Email*) e **desligue** a opção **Allow new users to sign up** (permitir novos cadastros). Salve.
   Sem isso, qualquer pessoa que descobrisse o endereço poderia criar uma conta.
5. Ainda em **Authentication**, abra **Users** → **Add user** → **Create new user**. Informe e-mail e senha e marque **Auto Confirm User**. Crie um usuário para cada pessoa que for usar o painel.
6. Abra **Project Settings** → **API** (ou *API Keys*). Copie dois valores:
   - **Project URL** (algo como `https://abcdefgh.supabase.co`);
   - a chave pública, chamada **anon public** (começa com `eyJ…`) ou **Publishable key** (começa com `sb_publishable_…`).
   - **Nunca** use a chave `service_role` ou *secret*.

## Parte 2 · Publicar no GitHub

1. Em **github.com**, clique em **New repository**. Nome: `boa-vista-equipe`. Marque **Public**. Clique em **Create repository**.
   O repositório precisa ser público para o GitHub Pages gratuito. Isso é seguro porque aqui só há o código do aplicativo, e os dados ficam no Supabase com login.
2. Abra o arquivo `config.js` desta pasta em um editor de texto (Bloco de Notas serve), cole o **Project URL** e a **chave** entre as aspas e salve:
   ```js
   window.BVC_CFG = {
     url: 'https://abcdefgh.supabase.co',
     key: 'eyJ...'
   };
   ```
3. No repositório, clique em **uploading an existing file**. Arraste **todo o conteúdo** desta pasta (os arquivos e as pastas `css`, `js`, `vendor`, `assets`, `supabase`). Clique em **Commit changes**.
4. Vá em **Settings** → **Pages**. Em **Build and deployment**, escolha **Source: Deploy from a branch**, **Branch: main**, pasta **/(root)** e clique em **Save**.
5. Espere 1 a 2 minutos. O endereço do aplicativo aparece nessa mesma página, no formato
   `https://SEU-USUARIO.github.io/boa-vista-equipe/`

## Parte 3 · Primeiro acesso e dados

1. Abra o endereço, entre com o e-mail e a senha criados no passo 5 da Parte 1. O topo deve mostrar **Sincronizado**.
2. Toque em **Opções** → **Importar backup** e escolha o arquivo `dados-iniciais.json` (enviado à parte). Ele traz a equipe e as escalas.
   **Não suba esse arquivo para o GitHub:** ele tem nomes de funcionários.
3. Nos outros aparelhos, basta entrar com o login. Os dados aparecem sozinhos.

## Parte 4 · Instalar como aplicativo

- **iPhone / iPad (Safari):** abra o endereço → **Compartilhar** → **Adicionar à Tela de Início**.
- **Android (Chrome):** menu ⋮ → **Instalar aplicativo**.
- **Windows / Mac (Chrome ou Edge):** ícone de instalar na barra de endereço, ou **Opções** → **Instalar aplicativo**.

## Recursos extras (versão 2026.10.27-2)

**Ative o compartilhamento (uma vez):** no Supabase, abra **SQL Editor** → **New query**, cole o conteúdo de `supabase/atualizacao-2-compartilhamento.sql` e clique em **Run**. Sem isso, o botão Compartilhar avisa que falta essa etapa.

- **Tema claro/escuro:** botão de lua/sol no topo, ou Opções → Aparência (Claro, Escuro, Automático). Vale por aparelho.
- **Imagem da empresa e capa:** no Painel, toque na câmera da imagem ou em "Adicionar capa". As imagens são reduzidas automaticamente e aparecem em todos os aparelhos.
- **Link público:** abra a página (Painel, Equipe, Escalas, Ambientes, Férias ou Relatórios) → **Compartilhar** → escolha a validade → **Criar link**. Quem receber só enxerga, sem login. O link é uma foto do momento: use **Atualizar** para renová-la e **Revogar** para desativar.

## Esqueci minha senha (configurar uma vez no Supabase)

Na tela de login, o botão **Esqueci minha senha** envia um link de redefinição para o e-mail digitado (só funciona para e-mails já cadastrados). Para o link voltar ao app certo:

1. Supabase → **Authentication → URL Configuration**.
2. Em **Site URL**, coloque `https://kleberalvs.github.io/boa-vista-equipe/`.
3. Em **Redirect URLs**, adicione o mesmo endereço e salve.

O Supabase gratuito limita o envio de e-mails (poucos por hora). Se o e-mail não chegar, confira o spam e aguarde.

## Como atualizar o aplicativo depois

1. Quando houver uma versão nova, no repositório clique em **Add file** → **Upload files** e arraste os arquivos novos (eles substituem os antigos). Clique em **Commit changes**.
2. Em 1 a 2 minutos o GitHub publica. Os aparelhos pegam a novidade na próxima abertura (ou aparece o aviso **Nova versão disponível**).
3. Os dados **não se perdem** em atualizações, porque ficam no Supabase.

## Dia a dia

- O indicador no topo mostra o estado: **Sincronizado**, **Enviando…**, **Offline** (salvo no aparelho; envia quando a internet voltar) ou **Modo local** (config.js ainda vazio).
- Duas pessoas editando o mesmo colaborador ao mesmo tempo: vale a última gravação. A aba **Histórico** mostra quem mudou o quê e permite restaurar o que foi apagado.
- Faça um **Baixar backup** de vez em quando (Opções) e guarde o arquivo em local seguro.
- No plano gratuito, o Supabase pode **pausar** projetos sem nenhum uso por cerca de uma semana. Com uso diário isso não acontece; se pausar, é só reativar no painel do Supabase.

## Segurança e LGPD

- Use senhas fortes e ative a verificação em duas etapas na conta do Supabase e na do GitHub.
- Crie usuários só para quem precisa. Para tirar o acesso de alguém, apague o usuário em **Authentication → Users**.
- Os dados são pessoais (nomes, admissão, escalas). Mantenha o acesso restrito e evite compartilhar o arquivo de backup.

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| Aparece **Modo local** | O `config.js` está vazio ou com erro. Confira a URL e a chave. |
| "E-mail ou senha incorretos" | Confira o usuário em Authentication → Users. |
| **Falha ao sincronizar** | Confira se o SQL (Parte 1, passo 3) foi executado e se a chave é a *anon/publishable*. |
| Endereço dá erro 404 | Aguarde 2 minutos após ativar o Pages e confira Settings → Pages. |
