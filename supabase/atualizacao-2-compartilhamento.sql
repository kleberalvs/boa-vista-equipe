-- Boa Vista Corporate · Equipe
-- ATENÇÃO: se você já rodou a atualizacao-3-demandas.sql e rodar este arquivo de novo, rode a atualizacao-3-demandas.sql em seguida (ela reaplica a proteção do painel).
-- Atualização 2: links públicos de visualização (somente leitura, sem login).
-- Execute UMA vez: Supabase > SQL Editor > New query > cole tudo > Run. Pode rodar de novo sem problema.

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
