// POST /api/leads - Créer un lead depuis un email (avec anti-doublon)

export interface Env {
  DB: D1Database;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const payload: any = await ctx.request.json();

    // Données attendues depuis l'UI
    const source = "email";
    const sourceRef = String(payload.sourceRef || payload.messageId || "").trim();
    
    if (!sourceRef) {
      return json({ error: "sourceRef missing" }, 400);
    }

    const fromName = (payload.fromName ?? "").toString();
    const fromEmail = (payload.fromEmail ?? "").toString();
    const subject = (payload.subject ?? "").toString();
    const snippet = (payload.snippet ?? "").toString();
    const body = (payload.body ?? "").toString();

    // Anti-doublon : si le lead existe déjà (source_ref UNIQUE), on le renvoie
    const existing = await ctx.env.DB
      .prepare("SELECT * FROM leads WHERE source_ref = ? LIMIT 1")
      .bind(sourceRef)
      .first();

    if (existing) {
      return json({ ok: true, lead: existing, created: false });
    }

    // Création du lead
    const res = await ctx.env.DB.prepare(`
      INSERT INTO leads (source, source_ref, from_name, from_email, subject, snippet, body, stage)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'new')
    `).bind(source, sourceRef, fromName, fromEmail, subject, snippet, body).run();

    const lead = await ctx.env.DB
      .prepare("SELECT * FROM leads WHERE id = ? LIMIT 1")
      .bind(res.meta.last_row_id)
      .first();

    return json({ ok: true, lead, created: true });
  } catch (e: any) {
    console.error("Create lead error:", e);
    return json({ error: "server_error", details: String(e?.message || e) }, 500);
  }
};
