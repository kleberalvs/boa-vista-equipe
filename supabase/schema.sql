-- Boa Vista Corporate · banco de dados na nuvem (Supabase)
-- Cole este arquivo inteiro em "SQL Editor" no Supabase e clique em Run. Pode executar uma vez só.

create table if not exists public.records (
  kind        text        not null,           -- p = colaborador, f = pasta, i = anotação, l = histórico, c = configurações
  id          text        not null,
  data        jsonb       not null,
  updated_at  timestamptz not null default now(),
  updated_by  text,
  primary key (kind, id)
);

-- Só quem fez login enxerga e altera os dados. Sem login, nada é entregue.
alter table public.records enable row level security;

drop policy if exists "equipe autenticada" on public.records;
create policy "equipe autenticada" on public.records
  for all to authenticated
  using (true) with check (true);

-- Preenche automaticamente data e autor da última alteração.
create or replace function public.touch_record() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.jwt() ->> 'email', '');
  return new;
end $$;

drop trigger if exists records_touch on public.records;
create trigger records_touch before insert or update on public.records
  for each row execute function public.touch_record();

-- Liga a atualização em tempo real entre os aparelhos.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'records') then
    alter publication supabase_realtime add table public.records;
  end if;
end $$;


-- ===== Atualização 2 (links públicos) =====

create table if not exists public.shares (
  token      text primary key check (length(token) between 20 and 64),
  page       text not null,
  title      text,
  payload    jsonb not null,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.shares enable row level security;

-- Só quem está logado cria, lista, atualiza e revoga links.
drop policy if exists shares_auth on public.shares;
create policy shares_auth on public.shares for all to authenticated using (true) with check (true);

-- Quem não tem conta só consegue abrir UM link, e somente se souber o código inteiro.
-- A tabela em si continua fechada para visitantes (eles não conseguem listar nada).
create or replace function public.get_share(p_token text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object('payload', payload, 'title', title, 'page', page, 'updated_at', updated_at)
  from public.shares
  where token = p_token and (expires_at is null or expires_at > now())
$$;

revoke all on function public.get_share(text) from public;
grant execute on function public.get_share(text) to anon, authenticated;
