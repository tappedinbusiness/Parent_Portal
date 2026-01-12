import { createClient } from "@supabase/supabase-js";

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

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const type = (req.query?.type ?? "ai") as string;
    const limit = clampInt(req.query?.limit, 1, 200, 50);

    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    // You can expand this later (filters, search, paging).
    // For now: get latest AI questions that were answered.
    const { data, error } = await supabase
      .from("questions")
      .select(
        "id, clerk_user_id, type, question_text, ai_answer, status, student_year, created_at"
      )
      .eq("type", type)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      res.status(500).json({ error: "DB query failed", details: error.message });
      return;
    }

    const questions = (data ?? []).map((row: any) => ({
      // Your UI expects a string id. Use the DB uuid.
      id: String(row.id),

      // Your UI currently uses userId. Keep it, but store something simple.
      // If you later want usernames, we will add a users table join or separate lookup.
      userId: row.clerk_user_id ? String(row.clerk_user_id) : "anonymous",

      type: row.type ?? "ai",
      questionText: String(row.question_text ?? ""),
      aiAnswer: row.ai_answer ?? undefined,
      status: row.status ?? undefined,

      // Your UI expects Date object for timestamp.
      timestamp: row.created_at ? new Date(row.created_at) : new Date(),

      // You can wire these later.
      upvotes: 0,
      comments: [],

      // Keep this only when present
      ...(row.student_year ? { studentYear: String(row.student_year) } : {}),
    }));

    res.status(200).json({ questions });
  } catch (err: any) {
    res.status(500).json({
      error: "Server error",
      details: err?.message ?? String(err),
    });
  }
}
