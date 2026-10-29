-- Boa Vista Corporate · Atualização 4 · Uma demanda para vários departamentos
-- Cole este arquivo inteiro em "SQL Editor" no Supabase e clique em Run. Pode executar mais de uma vez sem problema.

alter table public.dm_demandas add column if not exists departamentos uuid[] not null default '{}';
update public.dm_demandas set departamentos = array[departamento_id] where cardinality(departamentos) = 0;

-- Mantém a lista coerente: o departamento principal sempre faz parte dela e só valem departamentos existentes.
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

-- Quem vê: pessoas de QUALQUER um dos departamentos marcados (ou o responsável, quando houver).
create or replace function public.dm_pode_ver_demanda(p_demanda uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.dm_eh_gestor() or exists (
    select 1 from public.dm_demandas d
    where d.id = p_demanda and d.ativa and public.dm_eh_membro()
      and (d.responsavel = auth.uid()
           or (d.responsavel is null and d.departamentos && public.dm_meus_departamentos()))
  )
$$;
revoke all on function public.dm_pode_ver_demanda(uuid) from public, anon;
grant execute on function public.dm_pode_ver_demanda(uuid) to authenticated;

drop policy if exists dm_dem_ver on public.dm_demandas;
create policy dm_dem_ver on public.dm_demandas for select to authenticated using (
  public.dm_eh_gestor() or (
    ativa and public.dm_eh_membro()
    and (responsavel = auth.uid() or (responsavel is null and departamentos && public.dm_meus_departamentos()))
  )
);

-- Conferência: deve dizer "Tudo certo".
select case
  when exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'dm_demandas' and column_name = 'departamentos')
   and not exists (select 1 from public.dm_demandas where cardinality(departamentos) = 0)
   and exists (select 1 from pg_policies where tablename = 'dm_demandas' and policyname = 'dm_dem_ver' and qual like '%departamentos &&%')
  then 'Tudo certo: demandas com vários departamentos ativadas.'
  else 'Algo faltou: copie e rode o arquivo inteiro de novo.'
end as resultado;
