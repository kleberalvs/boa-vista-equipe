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
