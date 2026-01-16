import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "@clerk/backend";

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function getBearerToken(req: any): string | null {
  const auth = req.headers?.authorization || req.headers?.Authorization;
  if (!auth || typeof auth !== "string") return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

async function requireClerkUserId(req: any): Promise<string> {
  const token = getBearerToken(req);
  if (!token) throw new Error("Missing auth token");

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) throw new Error("Missing CLERK_SECRET_KEY");

  const authorizedPartiesRaw = process.env.CLERK_AUTHORIZED_PARTIES;
  const authorizedParties = authorizedPartiesRaw
    ? authorizedPartiesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  const verified = await verifyToken(token, {
    secretKey: clerkSecret,
    authorizedParties,
  });

  const sub = (verified as any)?.sub;
  if (!sub || typeof sub !== "string") throw new Error("Invalid token");
  return sub;
}

export default async function handler(req: any, res: any) {
  try {
    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    // GET /api/comments?questionId=...
    if (req.method === "GET") {
      const questionId = req.query?.questionId;
      if (!questionId || typeof questionId !== "string") {
        res.status(400).json({ error: "Missing questionId" });
        return;
      }

      const { data, error } = await supabase
        .from("comments")
        .select("id, question_id, clerk_user_id, text, created_at")
        .eq("question_id", questionId)
        .order("created_at", { ascending: true });

      if (error) {
        res.status(500).json({ error: "DB query failed", details: error.message });
        return;
      }

      const comments = (data ?? []).map((row: any) => ({
        id: String(row.id),
        text: String(row.text ?? ""),
        timestamp: row.created_at ? new Date(row.created_at) : new Date(),
        upvotes: 0,
        userId: row.clerk_user_id ? String(row.clerk_user_id) : "anonymous",
      }));

      res.status(200).json({ comments });
      return;
    }

    // POST /api/comments  body: { questionId, text }
    if (req.method === "POST") {
      const { questionId, text } = req.body ?? {};
      if (!questionId || typeof questionId !== "string") {
        res.status(400).json({ error: "Missing questionId" });
        return;
      }
      if (!text || typeof text !== "string" || text.trim().length < 1) {
        res.status(400).json({ error: "Missing comment text" });
        return;
      }

      // Signed-in only
      let clerkUserId: string;
      try {
        clerkUserId = await requireClerkUserId(req);
      } catch (e: any) {
        res.status(401).json({ error: "Unauthorized", details: e?.message ?? "Auth failed" });
        return;
      }

      const { data: inserted, error: insertErr } = await supabase
        .from("comments")
        .insert({
          question_id: questionId,
          clerk_user_id: clerkUserId,
          text: text.trim(),
        })
        .select("id, question_id, clerk_user_id, text, created_at")
        .single();

      if (insertErr) {
        res.status(500).json({ error: "DB insert failed", details: insertErr.message });
        return;
      }

      res.status(200).json({
        comment: {
          id: String(inserted.id),
          text: String(inserted.text ?? ""),
          timestamp: inserted.created_at ? new Date(inserted.created_at) : new Date(),
          upvotes: 0,
          userId: inserted.clerk_user_id ? String(inserted.clerk_user_id) : "anonymous",
        },
      });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", details: err?.message ?? String(err) });
  }
}