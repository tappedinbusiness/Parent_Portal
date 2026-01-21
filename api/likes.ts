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

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { targetType, targetId } = req.body ?? {};
    if (targetType !== "question" && targetType !== "comment") {
      res.status(400).json({ error: "Invalid targetType" });
      return;
    }
    if (!targetId || typeof targetId !== "string") {
      res.status(400).json({ error: "Invalid targetId" });
      return;
    }

    const clerkUserId = await requireClerkUserId(req);

    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    // Choose tables/columns
    const likesTable = targetType === "question" ? "question_likes" : "comment_likes";
    const targetTable = targetType === "question" ? "questions" : "comments";
    const fkColumn = targetType === "question" ? "question_id" : "comment_id";

    // Check if already liked
    const { data: existing, error: existErr } = await supabase
      .from(likesTable)
      .select("id")
      .eq(fkColumn, targetId)
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (existErr) {
      res.status(500).json({ error: "DB check failed", details: existErr.message });
      return;
    }

    let liked: boolean;

    if (existing?.id) {
      // Unlike: delete like row + decrement counter (min 0)
      const { error: delErr } = await supabase
        .from(likesTable)
        .delete()
        .eq("id", existing.id);

      if (delErr) {
        res.status(500).json({ error: "DB delete failed", details: delErr.message });
        return;
      }

      // decrement
      const { data: updated, error: updErr } = await supabase
        .from(targetTable)
        .update({ upvotes: supabase.rpc ? undefined : undefined })
        .eq("id", targetId)
        .select("upvotes")
        .single();

      // Use RPC-less safe decrement via SQL would be ideal, but keep it simple:
      // We'll do a read-modify-write fallback
      if (updErr) {
        // Fallback: read current, then update
        const { data: row, error: readErr } = await supabase
          .from(targetTable)
          .select("upvotes")
          .eq("id", targetId)
          .single();

        if (readErr) {
          res.status(500).json({ error: "DB read failed", details: readErr.message });
          return;
        }

        const next = Math.max(0, (row.upvotes ?? 0) - 1);
        const { data: row2, error: writeErr } = await supabase
          .from(targetTable)
          .update({ upvotes: next })
          .eq("id", targetId)
          .select("upvotes")
          .single();

        if (writeErr) {
          res.status(500).json({ error: "DB update failed", details: writeErr.message });
          return;
        }

        res.status(200).json({ liked: false, upvotes: row2.upvotes ?? 0 });
        return;
      }

      liked = false;
      res.status(200).json({ liked, upvotes: updated?.upvotes ?? 0 });
      return;
    } else {
      // Like: insert like row + increment counter
      const { error: insErr } = await supabase
        .from(likesTable)
        .insert({ [fkColumn]: targetId, clerk_user_id: clerkUserId });

      if (insErr) {
        res.status(500).json({ error: "DB insert failed", details: insErr.message });
        return;
      }

      // increment (same approach: read-modify-write for simplicity)
      const { data: row, error: readErr } = await supabase
        .from(targetTable)
        .select("upvotes")
        .eq("id", targetId)
        .single();

      if (readErr) {
        res.status(500).json({ error: "DB read failed", details: readErr.message });
        return;
      }

      const next = (row.upvotes ?? 0) + 1;
      const { data: row2, error: writeErr } = await supabase
        .from(targetTable)
        .update({ upvotes: next })
        .eq("id", targetId)
        .select("upvotes")
        .single();

      if (writeErr) {
        res.status(500).json({ error: "DB update failed", details: writeErr.message });
        return;
      }

      liked = true;
      res.status(200).json({ liked, upvotes: row2.upvotes ?? 0 });
      return;
    }
  } catch (err: any) {
    res.status(500).json({ error: "Server error", details: err?.message ?? String(err) });
  }
}