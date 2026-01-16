import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "@clerk/backend";

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function clampInt(value: any, min: number, max: number, fallback: number) {
  const n = Number.parseInt(String(value), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function getBearerToken(req: any): string | null {
  const auth = req.headers?.authorization || req.headers?.Authorization;
  if (!auth || typeof auth !== "string") return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

async function getOptionalClerkUserId(req: any): Promise<string | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) return null;

  const authorizedPartiesRaw = process.env.CLERK_AUTHORIZED_PARTIES;
  const authorizedParties = authorizedPartiesRaw
    ? authorizedPartiesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  try {
    const verified = await verifyToken(token, {
      secretKey: clerkSecret,
      authorizedParties,
    });
    const sub = (verified as any)?.sub;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  try {
    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    // GET /api/questions?type=ai|discussion&limit=...
    if (req.method === "GET") {
      const type = (req.query?.type ?? "ai") as string;
      const limit = clampInt(req.query?.limit, 1, 200, 50);

      const { data, error } = await supabase
        .from("questions")
        .select("id, clerk_user_id, type, question_text, ai_answer, status, student_year, created_at, upvotes")
        .eq("type", type)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        res.status(500).json({ error: "DB query failed", details: error.message });
        return;
      }

      const questions = (data ?? []).map((row: any) => ({
        id: String(row.id),
        userId: row.clerk_user_id ? String(row.clerk_user_id) : "anonymous",
        type: row.type ?? "ai",
        questionText: String(row.question_text ?? ""),
        aiAnswer: row.ai_answer ?? undefined,
        status: row.status ?? undefined,
        timestamp: row.created_at ? new Date(row.created_at) : new Date(),
        upvotes: row.upvotes ?? 0,
        comments: [],
        ...(row.student_year ? { studentYear: String(row.student_year) } : {}),
      }));

      res.status(200).json({ questions });
      return;
    }

    // POST /api/questions  body: { type: 'discussion', topic: string, studentYear?: string }
    if (req.method === "POST") {
      const { type, topic, studentYear } = req.body ?? {};

      if (type !== "discussion") {
        res.status(400).json({ error: "Invalid type (only 'discussion' allowed here)" });
        return;
      }

      if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
        res.status(400).json({ error: "Invalid topic" });
        return;
      }

      // Optional: attach clerk user id if signed in, otherwise anonymous
      const clerkUserId = await getOptionalClerkUserId(req);

      const insertPayload: any = {
        type: "discussion",
        clerk_user_id: clerkUserId,
        student_year: studentYear ?? "All",
        question_text: topic.trim(),
        status: null,
        ai_answer: null,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("questions")
        .insert(insertPayload)
        .select("id, clerk_user_id, type, question_text, student_year, created_at")
        .single();

      if (insertErr) {
        res.status(500).json({ error: "DB insert failed", details: insertErr.message });
        return;
      }

      // Return in the same shape your UI expects
      res.status(200).json({
        question: {
          id: String(inserted.id),
          userId: inserted.clerk_user_id ? String(inserted.clerk_user_id) : "anonymous",
          type: "discussion",
          questionText: String(inserted.question_text ?? ""),
          timestamp: inserted.created_at ? new Date(inserted.created_at) : new Date(),
          upvotes: 0,
          comments: [],
          ...(inserted.student_year ? { studentYear: String(inserted.student_year) } : {}),
        },
      });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", details: err?.message ?? String(err) });
  }
}