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

  const verified = await verifyToken(token, { secretKey: clerkSecret, authorizedParties });
  const sub = (verified as any)?.sub;
  if (!sub || typeof sub !== "string") throw new Error("Invalid token");
  return sub;
}

function clampInt(value: any, min: number, max: number, fallback: number) {
  const n = Number.parseInt(String(value), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export default async function handler(req: any, res: any) {
  try {
    const clerkUserId = await requireClerkUserId(req);

    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    // GET list
    if (req.method === "GET") {
      const limit = clampInt(req.query?.limit, 1, 200, 50);

      // Join bookmarks -> questions
      const { data, error } = await supabase
        .from("bookmarks")
        .select(
          "id, created_at, question_id, questions(id, clerk_user_id, type, question_text, ai_answer, status, student_year, upvotes, created_at)"
        )
        .eq("clerk_user_id", clerkUserId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        res.status(500).json({ error: "DB query failed", details: error.message });
        return;
      }

      const bookmarkedQuestions = (data ?? [])
        .map((row: any) => row.questions)
        .filter(Boolean)
        .map((q: any) => ({
          id: String(q.id),
          userId: q.clerk_user_id ? String(q.clerk_user_id) : "anonymous",
          type: q.type ?? "ai",
          questionText: String(q.question_text ?? ""),
          aiAnswer: q.ai_answer ?? undefined,
          status: q.status ?? undefined,
          studentYear: q.student_year ?? undefined,
          timestamp: q.created_at ? new Date(q.created_at) : new Date(),
          upvotes: q.upvotes ?? 0,
          comments: [],
        }));

      res.status(200).json({ bookmarks: bookmarkedQuestions });
      return;
    }

    // POST toggle
    if (req.method === "POST") {
      const { questionId } = req.body ?? {};
      if (!questionId || typeof questionId !== "string") {
        res.status(400).json({ error: "Missing questionId" });
        return;
      }

      const { data: existing, error: existErr } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("clerk_user_id", clerkUserId)
        .eq("question_id", questionId)
        .maybeSingle();

      if (existErr) {
        res.status(500).json({ error: "DB check failed", details: existErr.message });
        return;
      }

      if (existing?.id) {
        const { error: delErr } = await supabase.from("bookmarks").delete().eq("id", existing.id);
        if (delErr) {
          res.status(500).json({ error: "DB delete failed", details: delErr.message });
          return;
        }
        res.status(200).json({ bookmarked: false });
        return;
      }

      const { error: insErr } = await supabase
        .from("bookmarks")
        .insert({ clerk_user_id: clerkUserId, question_id: questionId });

      if (insErr) {
        res.status(500).json({ error: "DB insert failed", details: insErr.message });
        return;
      }

      res.status(200).json({ bookmarked: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    res.status(401).json({ error: "Unauthorized", details: err?.message ?? String(err) });
  }
}