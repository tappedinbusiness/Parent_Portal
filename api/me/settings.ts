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

    const clerkUserId = await requireClerkUserId(req);
    const { postAnonymously } = req.body ?? {};
    if (typeof postAnonymously !== "boolean") {
      res.status(400).json({ error: "Missing postAnonymously boolean" });
      return;
    }

    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase
      .from("users")
      .update({ post_anonymously: postAnonymously })
      .eq("clerk_user_id", clerkUserId)
      .select("post_anonymously")
      .single();

    if (error) {
      res.status(500).json({ error: "DB update failed", details: error.message });
      return;
    }

    res.status(200).json({ postAnonymously: data.post_anonymously });
  } catch (err: any) {
    res.status(401).json({ error: "Unauthorized", details: err?.message ?? String(err) });
  }
}