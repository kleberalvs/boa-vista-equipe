-- Boa Vista Corporate · Atualização 3 · App de Demandas
-- Cole este arquivo inteiro em "SQL Editor" no Supabase e clique em Run. Pode executar mais de uma vez sem problema.
--
-- O que ele cria:
--   • perfis dos colaboradores (login próprio, papel gestor/colaborador, departamentos)
--   • departamentos, demandas (diárias ou específicas), conclusões com fotos, conversas e feedbacks
--   • pasta de fotos protegida (Storage)
--   • funções para o gestor criar usuários, trocar senhas e desativar acessos direto pelo app
-- E protege o painel de Colaboradores: logins criados pelo app de demandas (e qualquer colaborador)
-- não enxergam nada do painel (equipe, escalas, documentos, links).

create extension if not exists pgcrypto with schema extensions;

-- ============ Tabelas ============

create table if not exists public.dm_departamentos (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null unique check (length(trim(nome)) between 1 and 60),
  cor        text not null default '#007aff',
  ordem      int  not null default 0,
  criado_em  timestamptz not null default now()
);

create table if not exists public.dm_perfis (
  id             uuid primary key references auth.users(id) on delete cascade,
  nome           text not null check (length(trim(nome)) between 1 and 80),
  login          text not null unique,
  papel          text not null default 'colaborador' check (papel in ('gestor','colaborador')),
  departamentos  uuid[] not null default '{}',
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now()
);

create table if not exists public.dm_demandas (
  id              uuid primary key default gen_random_uuid(),
  titulo          text not null check (length(trim(titulo)) between 1 and 160),
  descricao       text,
  departamento_id uuid not null references public.dm_departamentos(id) on delete restrict,
  tipo            text not null check (tipo in ('diaria','especifica')),
  dias_semana     int[] not null default '{1,2,3,4,5}',   -- 0 = domingo … 6 = sábado (só nas diárias)
  prazo           date,                                    -- só nas específicas (opcional)
  horario         text,
  local           text,
  prioridade      text not null default 'normal' check (prioridade in ('normal','alta','urgente')),
  responsavel     uuid references public.dm_perfis(id) on delete set null,   -- vazio = qualquer pessoa do departamento
  exige_foto      boolean not null default false,
  ativa           boolean not null default true,
  criado_por      uuid default auth.uid(),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);
-- Departamentos da demanda (pode ser mais de um); o departamento_id é o principal.
alter table public.dm_demandas add column if not exists departamentos uuid[] not null default '{}';
update public.dm_demandas set departamentos = array[departamento_id] where cardinality(departamentos) = 0;

create table if not exists public.dm_execucoes (
  id              uuid primary key default gen_random_uuid(),
  demanda_id      uuid not null references public.dm_demandas(id) on delete cascade,
  ref             text not null,          -- 'AAAA-MM-DD' nas diárias · 'unica' nas específicas
  titulo          text,                   -- cópia do título no momento da conclusão (para o histórico)
  departamento_id uuid,
  concluida_por   uuid default auth.uid() references public.dm_perfis(id) on delete set null,
  concluida_em    timestamptz not null default now(),
  observacao      text,
  fotos           text[] not null default '{}',
  unique (demanda_id, ref)
);
create index if not exists dm_execucoes_quando on public.dm_execucoes (concluida_em desc);

create table if not exists public.dm_comentarios (
  id          uuid primary key default gen_random_uuid(),
  demanda_id  uuid not null references public.dm_demandas(id) on delete cascade,
  autor       uuid default auth.uid() references public.dm_perfis(id) on delete set null,
  texto       text not null check (length(trim(texto)) between 1 and 2000),
  criado_em   timestamptz not null default now()
);
create index if not exists dm_comentarios_demanda on public.dm_comentarios (demanda_id, criado_em);

create table if not exists public.dm_feedbacks (
  id              uuid primary key default gen_random_uuid(),
  autor           uuid default auth.uid() references public.dm_perfis(id) on delete set null,
  tipo            text not null default 'sugestao' check (tipo in ('sugestao','problema','material','elogio','outro')),
  departamento_id uuid references public.dm_departamentos(id) on delete set null,
  texto           text not null check (length(trim(texto)) between 1 and 4000),
  foto            text,
  status          text not null default 'novo' check (status in ('novo','lido','resolvido')),
  resposta        text,
  respondido_por  uuid references public.dm_perfis(id) on delete set null,
  respondido_em   timestamptz,
  criado_em       timestamptz not null default now()
);

-- Proteção ligada já aqui: mesmo que o restante não rode, as tabelas ficam fechadas.
alter table public.dm_departamentos enable row level security;
alter table public.dm_perfis        enable row level security;
alter table public.dm_demandas      enable row level security;
alter table public.dm_execucoes     enable row level security;
alter table public.dm_comentarios   enable row level security;
alter table public.dm_feedbacks     enable row level security;

-- ============ Quem é quem (usadas nas regras de acesso) ============

create or replace function public.dm_eh_gestor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.dm_perfis where id = auth.uid() and papel = 'gestor' and ativo)
$$;

create or replace function public.dm_eh_membro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.dm_perfis where id = auth.uid() and ativo)
$$;

-- Contas criadas pelo app de demandas (login sem e-mail) e colaboradores não acessam o painel de Colaboradores.
create or replace function public.dm_sem_painel() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.dm_perfis where id = auth.uid() and (papel = 'colaborador' or position('@' in login) = 0))
$$;

create or replace function public.dm_meus_departamentos() returns uuid[]
language sql stable security definer set search_path = public as $$
  select coalesce((select departamentos from public.dm_perfis where id = auth.uid() and ativo), '{}'::uuid[])
$$;

create or replace function public.dm_pode_ver_demanda(p_demanda uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.dm_eh_gestor() or exists (
    select 1 from public.dm_demandas d
    where d.id = p_demanda and d.ativa and public.dm_eh_membro()
      and (d.responsavel = auth.uid()
           or (d.responsavel is null and d.departamentos && public.dm_meus_departamentos()))
  )
$$;

-- ============ Regras de acesso (RLS) ============

alter table public.dm_departamentos enable row level security;
alter table public.dm_perfis        enable row level security;
alter table public.dm_demandas      enable row level security;
alter table public.dm_execucoes     enable row level security;
alter table public.dm_comentarios   enable row level security;
alter table public.dm_feedbacks     enable row level security;

-- Departamentos: todos da equipe veem; só o gestor altera.
drop policy if exists dm_dep_ver on public.dm_departamentos;
create policy dm_dep_ver on public.dm_departamentos for select to authenticated using (public.dm_eh_membro());
drop policy if exists dm_dep_gestor on public.dm_departamentos;
create policy dm_dep_gestor on public.dm_departamentos for all to authenticated
  using (public.dm_eh_gestor()) with check (public.dm_eh_gestor());

-- Perfis: todos da equipe veem os nomes; só o gestor altera (criação pelas funções abaixo).
drop policy if exists dm_perfis_ver on public.dm_perfis;
create policy dm_perfis_ver on public.dm_perfis for select to authenticated using (public.dm_eh_membro() or id = auth.uid());
drop policy if exists dm_perfis_gestor on public.dm_perfis;
create policy dm_perfis_gestor on public.dm_perfis for update to authenticated
  using (public.dm_eh_gestor()) with check (public.dm_eh_gestor());

-- Demandas: o gestor vê tudo; o colaborador vê as ativas do(s) seu(s) departamento(s)
-- (quando a demanda tem responsável, só essa pessoa vê, mesmo sendo de outro departamento).
drop policy if exists dm_dem_ver on public.dm_demandas;
create policy dm_dem_ver on public.dm_demandas for select to authenticated using (
  public.dm_eh_gestor() or (
    ativa and public.dm_eh_membro()
    and (responsavel = auth.uid() or (responsavel is null and departamentos && public.dm_meus_departamentos()))
  )
);
drop policy if exists dm_dem_gestor_ins on public.dm_demandas;
create policy dm_dem_gestor_ins on public.dm_demandas for insert to authenticated with check (public.dm_eh_gestor());
drop policy if exists dm_dem_gestor_upd on public.dm_demandas;
create policy dm_dem_gestor_upd on public.dm_demandas for update to authenticated using (public.dm_eh_gestor()) with check (public.dm_eh_gestor());
drop policy if exists dm_dem_gestor_del on public.dm_demandas;
create policy dm_dem_gestor_del on public.dm_demandas for delete to authenticated using (public.dm_eh_gestor());

-- Conclusões: cada um conclui em seu nome; pode desfazer em até 12 h; o gestor pode reabrir qualquer uma.
drop policy if exists dm_exe_ver on public.dm_execucoes;
create policy dm_exe_ver on public.dm_execucoes for select to authenticated using (
  public.dm_eh_gestor() or concluida_por = auth.uid() or public.dm_pode_ver_demanda(demanda_id)
);
drop policy if exists dm_exe_ins on public.dm_execucoes;
create policy dm_exe_ins on public.dm_execucoes for insert to authenticated with check (
  public.dm_eh_membro() and concluida_por = auth.uid() and public.dm_pode_ver_demanda(demanda_id)
);
drop policy if exists dm_exe_upd on public.dm_execucoes;
create policy dm_exe_upd on public.dm_execucoes for update to authenticated
  using (public.dm_eh_gestor() or (concluida_por = auth.uid() and concluida_em > now() - interval '12 hours'))
  with check (public.dm_eh_gestor() or concluida_por = auth.uid());
drop policy if exists dm_exe_del on public.dm_execucoes;
create policy dm_exe_del on public.dm_execucoes for delete to authenticated
  using (public.dm_eh_gestor() or (concluida_por = auth.uid() and concluida_em > now() - interval '12 hours'));

-- Conversas dentro de cada demanda.
drop policy if exists dm_com_ver on public.dm_comentarios;
create policy dm_com_ver on public.dm_comentarios for select to authenticated using (public.dm_pode_ver_demanda(demanda_id));
drop policy if exists dm_com_ins on public.dm_comentarios;
create policy dm_com_ins on public.dm_comentarios for insert to authenticated with check (
  public.dm_eh_membro() and autor = auth.uid() and public.dm_pode_ver_demanda(demanda_id)
);
drop policy if exists dm_com_del on public.dm_comentarios;
create policy dm_com_del on public.dm_comentarios for delete to authenticated using (autor = auth.uid() or public.dm_eh_gestor());

-- Feedbacks: o colaborador vê os seus; o gestor vê, responde e resolve todos.
drop policy if exists dm_fb_ver on public.dm_feedbacks;
create policy dm_fb_ver on public.dm_feedbacks for select to authenticated using (public.dm_eh_gestor() or autor = auth.uid());
drop policy if exists dm_fb_ins on public.dm_feedbacks;
create policy dm_fb_ins on public.dm_feedbacks for insert to authenticated with check (
  public.dm_eh_membro() and autor = auth.uid() and status = 'novo' and resposta is null
);
drop policy if exists dm_fb_upd on public.dm_feedbacks;
create policy dm_fb_upd on public.dm_feedbacks for update to authenticated using (public.dm_eh_gestor()) with check (public.dm_eh_gestor());
drop policy if exists dm_fb_del on public.dm_feedbacks;
create policy dm_fb_del on public.dm_feedbacks for delete to authenticated
  using (public.dm_eh_gestor() or (autor = auth.uid() and status = 'novo'));

-- ============ Travas de segurança ============

-- Perfis: o login não muda e sempre fica pelo menos um gestor ativo.
create or replace function public.dm_perfis_trava() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.id := old.id;
  new.login := old.login;
  new.criado_em := old.criado_em;
  if old.papel = 'gestor' and old.ativo and (new.papel <> 'gestor' or not new.ativo) then
    if not exists (select 1 from public.dm_perfis where papel = 'gestor' and ativo and id <> old.id) then
      raise exception 'É preciso manter pelo menos um gestor ativo.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists dm_perfis_trava on public.dm_perfis;
create trigger dm_perfis_trava before update on public.dm_perfis for each row execute function public.dm_perfis_trava();

-- Conclusões: quem concluiu, a demanda e o dia não podem ser trocados depois.
create or replace function public.dm_execucoes_trava() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    new.demanda_id := old.demanda_id;
    new.ref := old.ref;
    new.concluida_por := old.concluida_por;
    new.concluida_em := old.concluida_em;
  else
    -- conclusões feitas sem internet chegam depois: vale a hora real, dentro das últimas 72 h
    new.concluida_em := least(greatest(coalesce(new.concluida_em, now()), now() - interval '72 hours'), now());
  end if;
  return new;
end $$;
drop trigger if exists dm_execucoes_trava on public.dm_execucoes;
create trigger dm_execucoes_trava before insert or update on public.dm_execucoes for each row execute function public.dm_execucoes_trava();

create or replace function public.dm_demandas_toque() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.atualizado_em := now();
  if tg_op = 'UPDATE' then new.criado_em := old.criado_em; new.criado_por := old.criado_por; end if;
  new.departamentos := coalesce(array_remove(new.departamentos, null), '{}');
  if cardinality(new.departamentos) = 0 then
    new.departamentos := array[new.departamento_id];
  elsif not (new.departamento_id = any(new.departamentos)) then
    new.departamento_id := new.departamentos[1];
  end if;
  if exists (select 1 from unnest(new.departamentos) x where not exists (select 1 from public.dm_departamentos d where d.id = x)) then
    raise exception 'Departamento inválido.';
  end if;
  return new;
end $$;
drop trigger if exists dm_demandas_toque on public.dm_demandas;
create trigger dm_demandas_toque before insert or update on public.dm_demandas for each row execute function public.dm_demandas_toque();

-- Ao excluir um departamento, ele sai da lista das demandas em que não é o principal.
create or replace function public.dm_dep_remover() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.dm_demandas set departamentos = array_remove(departamentos, old.id)
  where old.id = any(departamentos) and departamento_id <> old.id;
  return old;
end $$;
drop trigger if exists dm_dep_remover on public.dm_departamentos;
create trigger dm_dep_remover before delete on public.dm_departamentos for each row execute function public.dm_dep_remover();

-- ============ Primeiro acesso e gestão de usuários ============

-- No primeiro acesso, a primeira conta do painel que abrir o app vira gestora.
create or replace function public.dm_bootstrap() returns text
language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  if auth.uid() is null then raise exception 'Faça login.'; end if;
  perform pg_advisory_xact_lock(7316001);
  if exists (select 1 from public.dm_perfis where id = auth.uid()) then return 'ok'; end if;
  if exists (select 1 from public.dm_perfis where papel = 'gestor') then return 'sem_acesso'; end if;
  select email into v_email from auth.users where id = auth.uid();
  insert into public.dm_perfis (id, nome, login, papel)
  values (auth.uid(), coalesce(nullif(initcap(split_part(coalesce(v_email,''), '@', 1)), ''), 'Gestor'), lower(coalesce(v_email, auth.uid()::text)), 'gestor');
  return 'gestor';
end $$;

-- O gestor cria o acesso do colaborador: usuário (sem e-mail) + senha.
create or replace function public.dm_criar_usuario(
  p_nome text, p_login text, p_senha text,
  p_papel text default 'colaborador', p_departamentos uuid[] default '{}'
) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id    uuid := gen_random_uuid();
  v_login text := lower(trim(coalesce(p_login, '')));
  v_email text;
begin
  if not public.dm_eh_gestor() then raise exception 'Somente o gestor pode criar usuários.'; end if;
  if length(trim(coalesce(p_nome, ''))) = 0 then raise exception 'Informe o nome.'; end if;
  if v_login !~ '^[a-z0-9][a-z0-9._-]{2,30}$' then
    raise exception 'Usuário inválido: use de 3 a 31 letras minúsculas, números, ponto ou hífen, sem espaços nem acentos.';
  end if;
  if length(coalesce(p_senha, '')) < 6 then raise exception 'A senha precisa ter pelo menos 6 caracteres.'; end if;
  if p_papel not in ('gestor', 'colaborador') then raise exception 'Papel inválido.'; end if;
  v_email := v_login || '@demandas.bvc.app';
  if exists (select 1 from auth.users where lower(email) = v_email) or exists (select 1 from public.dm_perfis where login = v_login) then
    raise exception 'Já existe um usuário "%". Escolha outro.', v_login;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_senha, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nome', trim(p_nome), 'app', 'demandas'),
    now(), now(), '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
          'email', now(), now(), now());

  insert into public.dm_perfis (id, nome, login, papel, departamentos)
  values (v_id, trim(p_nome), v_login, p_papel, coalesce(p_departamentos, '{}'));

  return v_id;
end $$;

create or replace function public.dm_redefinir_senha(p_id uuid, p_senha text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.dm_eh_gestor() then raise exception 'Somente o gestor pode trocar senhas.'; end if;
  if length(coalesce(p_senha, '')) < 6 then raise exception 'A senha precisa ter pelo menos 6 caracteres.'; end if;
  if not exists (select 1 from public.dm_perfis where id = p_id) then raise exception 'Usuário não encontrado.'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_senha, extensions.gen_salt('bf')), updated_at = now() where id = p_id;
end $$;

create or replace function public.dm_definir_ativo(p_id uuid, p_ativo boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.dm_eh_gestor() then raise exception 'Somente o gestor pode alterar acessos.'; end if;
  if p_id = auth.uid() and not p_ativo then raise exception 'Você não pode desativar o seu próprio acesso.'; end if;
  update public.dm_perfis set ativo = p_ativo where id = p_id;
  if not found then raise exception 'Usuário não encontrado.'; end if;
  -- Bloqueia o login de verdade (e libera ao reativar) das contas criadas pelo app. Contas do painel não são bloqueadas no login.
  update auth.users set banned_until = case when p_ativo then null else 'infinity'::timestamptz end
  where id = p_id and exists (select 1 from public.dm_perfis where id = p_id and position('@' in login) = 0);
end $$;

revoke all on function public.dm_eh_gestor() from public, anon;
revoke all on function public.dm_eh_membro() from public, anon;
revoke all on function public.dm_sem_painel() from public, anon;
revoke all on function public.dm_meus_departamentos() from public, anon;
revoke all on function public.dm_pode_ver_demanda(uuid) from public, anon;
grant execute on function public.dm_eh_gestor(), public.dm_eh_membro(), public.dm_sem_painel(), public.dm_meus_departamentos(), public.dm_pode_ver_demanda(uuid) to authenticated;
revoke all on function public.dm_bootstrap() from public, anon;
revoke all on function public.dm_criar_usuario(text, text, text, text, uuid[]) from public, anon;
revoke all on function public.dm_redefinir_senha(uuid, text) from public, anon;
revoke all on function public.dm_definir_ativo(uuid, boolean) from public, anon;
grant execute on function public.dm_bootstrap() to authenticated;
grant execute on function public.dm_criar_usuario(text, text, text, text, uuid[]) to authenticated;
grant execute on function public.dm_redefinir_senha(uuid, text) to authenticated;
grant execute on function public.dm_definir_ativo(uuid, boolean) to authenticated;

-- ============ Fotos (Storage) ============

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('demandas-fotos', 'demandas-fotos', false, 6291456, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "dm fotos ver" on storage.objects;
create policy "dm fotos ver" on storage.objects for select to authenticated
  using (bucket_id = 'demandas-fotos' and public.dm_eh_membro());
drop policy if exists "dm fotos enviar" on storage.objects;
create policy "dm fotos enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'demandas-fotos' and public.dm_eh_membro() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "dm fotos apagar" on storage.objects;
create policy "dm fotos apagar" on storage.objects for delete to authenticated
  using (bucket_id = 'demandas-fotos' and ((storage.foldername(name))[1] = auth.uid()::text or public.dm_eh_gestor()));

-- ============ Proteção do painel de Colaboradores ============
-- Antes: qualquer login via o painel. Agora: qualquer login MENOS os criados pelo app de demandas.

drop policy if exists "equipe autenticada" on public.records;
create policy "equipe autenticada" on public.records
  for all to authenticated
  using (not public.dm_sem_painel()) with check (not public.dm_sem_painel());

do $$
begin
  if to_regclass('public.shares') is not null then
    execute 'drop policy if exists shares_auth on public.shares';
    execute 'create policy shares_auth on public.shares for all to authenticated using (not public.dm_sem_painel()) with check (not public.dm_sem_painel())';
  end if;
end $$;

-- ============ Tempo real ============

do $$
declare t text;
begin
  foreach t in array array['dm_departamentos','dm_perfis','dm_demandas','dm_execucoes','dm_comentarios','dm_feedbacks'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ============ Departamentos iniciais ============

insert into public.dm_departamentos (nome, cor, ordem) values
  ('Limpeza',    '#30b0c7', 1),
  ('Manutenção', '#ff9500', 2),
  ('Recepção',   '#af52de', 3),
  ('TI',         '#007aff', 4)
on conflict (nome) do nothing;

-- ============ Ajuste de segurança do painel (aviso "Function Search Path Mutable") ============
do $$
begin
  if to_regprocedure('public.touch_record()') is not null then
    execute 'alter function public.touch_record() set search_path = public';
  end if;
end $$;

-- ============ Conferência ============
-- O resultado aparece embaixo: deve dizer "Tudo certo".
select case
  when (select count(*) from pg_tables where schemaname = 'public' and tablename like 'dm\_%' and rowsecurity) = 6
   and (select count(*) from pg_policies where schemaname = 'public' and tablename like 'dm\_%') >= 18
   and exists (select 1 from storage.buckets where id = 'demandas-fotos')
   and exists (select 1 from pg_proc where proname = 'dm_criar_usuario')
   and exists (select 1 from pg_policies where tablename = 'records' and qual like '%dm_sem_painel%')
  then 'Tudo certo: Demandas instaladas e painel protegido.'
  else 'Algo faltou: copie e rode o arquivo inteiro de novo.'
end as resultado;
