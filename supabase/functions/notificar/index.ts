// Boa Vista Corporate · Demandas · função "notificar" (Supabase Edge Function)
// Recebe do banco (gatilhos da atualização 6) cada conclusão e feedback e envia a notificação
// para os aparelhos inscritos. Segredos (Edge Functions → Secrets): VAPID_PUBLIC, VAPID_PRIVATE, DM_SEGREDO.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem automaticamente.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const APP = "https://kleberalvs.github.io/boavista/demandas/";
const TIPOS: Record<string, string> = { sugestao: "Sugestão", problema: "Problema", material: "Falta de material", elogio: "Elogio", outro: "Outro" };

webpush.setVapidDetails(APP, Deno.env.get("VAPID_PUBLIC") ?? "", Deno.env.get("VAPID_PRIVATE") ?? "");

const corta = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1) + "…" : t);
const primeiro = (n: string) => (n || "").trim().split(/\s+/)[0] || "Alguém";

Deno.serve(async (req) => {
  if (req.method !== "POST" || req.headers.get("x-dm-segredo") !== Deno.env.get("DM_SEGREDO")) {
    return new Response("negado", { status: 401 });
  }
  const { tabela, tipo, registro: r } = await req.json();
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const nome = async (id: string) => (await sb.from("dm_perfis").select("nome").eq("id", id).maybeSingle()).data?.nome ?? "Alguém";
  const gestores = async (exceto: string) =>
    ((await sb.from("dm_perfis").select("id").eq("papel", "gestor").eq("ativo", true)).data ?? [])
      .map((p: { id: string }) => p.id).filter((id: string) => id !== exceto);

  let alvos: string[] = [];
  let msg: { titulo: string; corpo: string; url: string; tag: string } | null = null;

  if (tabela === "dm_execucoes" && tipo === "INSERT" && !r.reaberta_em) {
    alvos = await gestores(r.concluida_por);
    const n = (r.fotos ?? []).length;
    msg = {
      titulo: "Demanda concluída",
      corpo: `${primeiro(await nome(r.concluida_por))} concluiu “${corta(r.titulo ?? "uma demanda", 80)}”${n ? ` · ${n} foto${n > 1 ? "s" : ""}` : ""}${r.observacao ? ` · “${corta(r.observacao, 60)}”` : ""}`,
      url: `${APP}#d=${r.demanda_id}~${r.ref}`,
      tag: `exec-${r.id}`,
    };
  } else if (tabela === "dm_feedbacks" && tipo === "INSERT") {
    alvos = await gestores(r.autor);
    msg = {
      titulo: `Novo feedback · ${TIPOS[r.tipo] ?? "Outro"}`,
      corpo: `${primeiro(await nome(r.autor))}: ${corta(r.texto ?? "", 140)}`,
      url: `${APP}#fb=${r.id}`,
      tag: `fb-${r.id}`,
    };
  } else if (tabela === "dm_feedbacks" && tipo === "UPDATE" && r.resposta) {
    alvos = [r.autor];
    msg = { titulo: "O gestor respondeu seu feedback", corpo: corta(r.resposta, 160), url: `${APP}#fb=${r.id}`, tag: `fbr-${r.id}` };
  }
  if (!msg || !alvos.length) return Response.json({ enviadas: 0 });

  const { data: subs } = await sb.from("dm_push").select("id,endpoint,p256dh,auth").in("usuario", alvos);
  let enviadas = 0;
  await Promise.all((subs ?? []).map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(msg), { TTL: 86400, urgency: "high" });
      enviadas++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await sb.from("dm_push").delete().eq("id", s.id); // aparelho desinstalou ou desativou
      else console.error("push", code, (e as Error).message);
    }
  }));
  return Response.json({ enviadas });
});
