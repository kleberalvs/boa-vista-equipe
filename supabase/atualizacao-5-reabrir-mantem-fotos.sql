-- Boa Vista Corporate · Atualização 5 · Reabrir demanda mantém as fotos
-- Cole este arquivo inteiro em "SQL Editor" no Supabase e clique em Run. Pode executar mais de uma vez sem problema.
-- Ao reabrir, a conclusão não é mais apagada: fica marcada como "reaberta" (fotos guardadas, observação apagada)
-- e a demanda volta a ficar pendente, podendo ser concluída de novo.

alter table public.dm_execucoes add column if not exists reaberta_em  timestamptz;
alter table public.dm_execucoes add column if not exists reaberta_por uuid references public.dm_perfis(id) on delete set null;

-- Só uma conclusão ATIVA por demanda e dia (as reabertas ficam guardadas ao lado).
alter table public.dm_execucoes drop constraint if exists dm_execucoes_demanda_id_ref_key;
create unique index if not exists dm_execucoes_ativa on public.dm_execucoes (demanda_id, ref) where reaberta_em is null;

create or replace function public.dm_execucoes_trava() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    new.demanda_id := old.demanda_id;
    new.ref := old.ref;
    new.concluida_por := old.concluida_por;
    new.concluida_em := old.concluida_em;
    if old.reaberta_em is not null then          -- reaberta continua reaberta
      new.reaberta_em := old.reaberta_em; new.reaberta_por := old.reaberta_por;
    elsif new.reaberta_em is not null then       -- quem reabriu e quando: sempre os reais
      new.reaberta_em := now(); new.reaberta_por := auth.uid();
    end if;
  else
    new.reaberta_em := null; new.reaberta_por := null;
    -- conclusões feitas sem internet chegam depois: vale a hora real, dentro das últimas 72 h
    new.concluida_em := least(greatest(coalesce(new.concluida_em, now()), now() - interval '72 hours'), now());
  end if;
  return new;
end $$;
drop trigger if exists dm_execucoes_trava on public.dm_execucoes;
create trigger dm_execucoes_trava before insert or update on public.dm_execucoes for each row execute function public.dm_execucoes_trava();

-- Conferência: deve dizer "Tudo certo".
select case
  when exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'dm_execucoes' and column_name = 'reaberta_em')
   and exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'dm_execucoes_ativa')
   and not exists (select 1 from pg_constraint where conname = 'dm_execucoes_demanda_id_ref_key')
  then 'Tudo certo: reabrir agora mantém as fotos.'
  else 'Algo faltou: copie e rode o arquivo inteiro de novo.'
end as resultado;
