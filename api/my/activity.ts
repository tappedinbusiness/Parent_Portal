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
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const clerkUserId = await requireClerkUserId(req);
    const limit = clampInt(req.query?.limit, 1, 200, 50);

    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    const selectCols =
      "id, clerk_user_id, type, question_text, ai_answer, status, student_year, upvotes, created_at";

    const { data: aiData, error: aiErr } = await supabase
      .from("questions")
      .select(selectCols)
      .eq("clerk_user_id", clerkUserId)
      .eq("type", "ai")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (aiErr) {
      res.status(500).json({ error: "DB query failed", details: aiErr.message });
      return;
    }

    const { data: discData, error: discErr } = await supabase
      .from("questions")
      .select(selectCols)
      .eq("clerk_user_id", clerkUserId)
      .eq("type", "discussion")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (discErr) {
      res.status(500).json({ error: "DB query failed", details: discErr.message });
      return;
    }

    const mapQuestion = (row: any) => ({
      id: String(row.id),
      userId: row.clerk_user_id ? String(row.clerk_user_id) : "anonymous",
      type: row.type ?? "ai",
      questionText: String(row.question_text ?? ""),
      aiAnswer: row.ai_answer ?? undefined,
      status: row.status ?? undefined,
      studentYear: row.student_year ?? undefined,
      timestamp: row.created_at ? new Date(row.created_at) : new Date(),
      upvotes: row.upvotes ?? 0,
      comments: [],
    });

    res.status(200).json({
      aiQuestions: (aiData ?? []).map(mapQuestion),
      discussionPosts: (discData ?? []).map(mapQuestion),
    });
  } catch (err: any) {
    res.status(401).json({ error: "Unauthorized", details: err?.message ?? String(err) });
  }
}