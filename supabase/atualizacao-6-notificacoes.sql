-- Boa Vista Corporate · Atualização 6 · Notificações no celular (com o app fechado)
-- Cole este arquivo inteiro em "SQL Editor" no Supabase e clique em Run. Pode executar mais de uma vez sem problema.
--
-- Como funciona: cada aparelho que ativa as notificações fica guardado em dm_push.
-- Quando uma demanda é criada ou concluída, ou chega/é respondido um feedback, o banco chama a função "notificar"
-- (Edge Function do Supabase), que envia a notificação para os aparelhos certos.
-- O endereço da função e a senha de chamada ficam em dm_config (fechada: ninguém lê pelo app).
-- Esses valores são gravados à parte (push_url, push_segredo e push_chave = chave anon do config.js).

create extension if not exists pg_net;

-- Aparelhos inscritos
create table if not exists public.dm_push (
  id         uuid primary key default gen_random_uuid(),
  usuario    uuid not null references public.dm_perfis(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  aparelho   text,
  criado_em  timestamptz not null default now()
);
alter table public.dm_push enable row level security;
drop policy if exists dm_push_ver on public.dm_push;
create policy dm_push_ver on public.dm_push for select to authenticated using (usuario = auth.uid());
drop policy if exists dm_push_apagar on public.dm_push;
create policy dm_push_apagar on public.dm_push for delete to authenticated using (usuario = auth.uid());

-- Configuração privada (sem regras de acesso = ninguém lê pelo app; só as funções do banco)
create table if not exists public.dm_config (
  chave text primary key,
  valor text not null
);
alter table public.dm_config enable row level security;
revoke all on public.dm_config from anon, authenticated;

-- Registrar / remover o aparelho (um aparelho pertence a quem ativou por último)
create or replace function public.dm_push_registrar(p_endpoint text, p_p256dh text, p_auth text, p_aparelho text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.dm_eh_membro() then raise exception 'Sem acesso.'; end if;
  if coalesce(p_endpoint, '') !~ '^https://' or coalesce(p_p256dh, '') = '' or coalesce(p_auth, '') = '' then
    raise exception 'Inscrição inválida.';
  end if;
  insert into public.dm_push (usuario, endpoint, p256dh, auth, aparelho)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, left(p_aparelho, 120))
  on conflict (endpoint) do update set usuario = auth.uid(), p256dh = excluded.p256dh, auth = excluded.auth,
    aparelho = excluded.aparelho, criado_em = now();
end $$;
create or replace function public.dm_push_remover(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from public.dm_push where endpoint = p_endpoint and usuario = auth.uid();
$$;
revoke all on function public.dm_push_registrar(text, text, text, text) from public, anon;
revoke all on function public.dm_push_remover(text) from public, anon;
grant execute on function public.dm_push_registrar(text, text, text, text) to authenticated;
grant execute on function public.dm_push_remover(text) to authenticated;

-- Avisa a função "notificar". Nunca atrapalha a gravação: se algo falhar, a conclusão/feedback é salva do mesmo jeito.
create or replace function public.dm_notificar() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_url text; v_seg text; v_chave text; v_new jsonb; v_old jsonb;
begin
  begin
    select valor into v_url from public.dm_config where chave = 'push_url';
    select valor into v_seg from public.dm_config where chave = 'push_segredo';
    select valor into v_chave from public.dm_config where chave = 'push_chave';   -- chave pública (anon) do app: passa pela verificação de JWT do Supabase
    if v_url is null or v_seg is null then return new; end if;
    v_new := to_jsonb(new);
    v_old := case when tg_op = 'UPDATE' then to_jsonb(old) end;
    if tg_table_name in ('dm_execucoes', 'dm_demandas') and tg_op <> 'INSERT' then return new; end if;
    if tg_table_name = 'dm_feedbacks' and tg_op = 'UPDATE'
       and (v_new->>'resposta' is null or v_new->>'resposta' is not distinct from v_old->>'resposta') then return new; end if;
    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-dm-segredo', v_seg)
                 || case when v_chave is not null then jsonb_build_object('Authorization', 'Bearer ' || v_chave, 'apikey', v_chave) else '{}'::jsonb end,
      body := jsonb_build_object('tabela', tg_table_name, 'tipo', tg_op, 'registro', v_new),
      timeout_milliseconds := 8000
    );
  exception when others then
    raise warning 'dm_notificar: %', sqlerrm;
  end;
  return new;
end $$;
revoke all on function public.dm_notificar() from public, anon, authenticated;

drop trigger if exists dm_notificar_execucao on public.dm_execucoes;
create trigger dm_notificar_execucao after insert on public.dm_execucoes
  for each row execute function public.dm_notificar();
drop trigger if exists dm_notificar_demanda on public.dm_demandas;
create trigger dm_notificar_demanda after insert on public.dm_demandas
  for each row execute function public.dm_notificar();
drop trigger if exists dm_notificar_feedback on public.dm_feedbacks;
create trigger dm_notificar_feedback after insert or update of resposta on public.dm_feedbacks
  for each row execute function public.dm_notificar();

-- Conferência: deve dizer "Tudo certo".
select case
  when to_regclass('public.dm_push') is not null
   and to_regclass('public.dm_config') is not null
   and exists (select 1 from pg_extension where extname = 'pg_net')
   and exists (select 1 from pg_trigger where tgname = 'dm_notificar_execucao')
   and exists (select 1 from pg_trigger where tgname = 'dm_notificar_feedback')
   and exists (select 1 from pg_trigger where tgname = 'dm_notificar_demanda')
  then 'Tudo certo: notificações preparadas no banco.' ||
       case when exists (select 1 from public.dm_config where chave = 'push_segredo')
            then '' else ' Falta gravar o endereço e a senha da função (passo seguinte).' end
  else 'Algo faltou: copie e rode o arquivo inteiro de novo.'
end as resultado;
