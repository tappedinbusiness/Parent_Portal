import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "@clerk/backend";
import { createClerkClient } from "@clerk/backend";

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
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const clerkUserId = await requireClerkUserId(req);

    const { studentYear } = req.body ?? {};
    const safeStudentYear =
      typeof studentYear === "string" && studentYear.trim().length > 0
        ? studentYear.trim()
        : "All";

    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

    const user = await clerkClient.users.getUser(clerkUserId);

    const firstName = user.firstName ?? null;
    const lastName = user.lastName ?? null;
    const avatarUrl = user.imageUrl ?? null;
    const email = user.emailAddresses?.[0]?.emailAddress ?? null;

    const payload: any = {
      clerk_user_id: clerkUserId,
      first_name: firstName,
      last_name: lastName,
      avatar_url: avatarUrl,
      email,
      student_year: safeStudentYear,
    };

    const { data, error } = await supabase
      .from("users")
      .upsert(payload, { onConflict: "clerk_user_id" })
      .select("id, clerk_user_id, first_name, last_name, avatar_url, student_year")
      .single();

    if (error) {
      res.status(500).json({ error: "DB upsert failed", details: error.message });
      return;
    }

    res.status(200).json({ user: data });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", details: err?.message ?? String(err) });
  }
}