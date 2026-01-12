import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "@clerk/backend";

/**
 * Vercel Serverless Function (Node runtime)
 * Path: /api/ask
 *
 * Behavior:
 * - Accepts POST { question: string, studentYear?: string }
 * - If signed in, caller can include Clerk session token in Authorization: Bearer <token>
 * - Checks Supabase for duplicates (semantic) among recent AI questions
 *   - If duplicate: returns the existing stored answer (no OpenAI call, no new row)
 *   - If new: calls OpenAI, stores row, returns answer
 *
 * Anonymous users are allowed to submit questions.
 */

const OPENAI_MODEL = "gpt-4.1-mini";

// Keep this small at first for speed and token cost.
// You can raise it later if duplicates are being missed.
const DUPLICATE_CANDIDATES_LIMIT = 40;

// If you want to avoid duplicate checks for a tiny dataset,
// set this to 0 and only do exact duplicates later.
// For now, keep it on because your app already has this feature.
const ENABLE_SEMANTIC_DUPLICATE_CHECK = true;

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function normalizeQuestion(q: string): string {
  return q
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'");
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

  // If CLERK_SECRET_KEY is not set, we can’t verify, so ignore auth.
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

    // Clerk uses "sub" as the user id in the JWT
    const sub = (verified as any)?.sub;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}

function buildAnswerSystemMessage(studentYear: string | undefined) {
  const year = studentYear && studentYear !== "All" ? studentYear : "All";

  const contextPreamble =
    year === "All"
      ? "A parent has a general question."
      : `A parent of a '${year}' student has a question.`;

  const contextInstruction =
    year === "All"
      ? ""
      : `When formulating the answer, keep the student's year ('${year}') in mind for context.`;

  return `
You are a straightforward, kind, and professional virtual assistant for The University of Alabama students and parents.
Your role is to provide accurate, verified, and helpful information related only to The University of Alabama and the Tuscaloosa community.

${contextPreamble}

TONE AND STYLE:
- Maintain an encouraging, calm, and professional tone.
- Be direct and concise while remaining complete.
- Address the user's main question immediately.
- Avoid unnecessary commentary or speculation.

SCOPE (IN SCOPE):
- University of Alabama student life, academics, administration, policies, deadlines, tuition, calendars, housing, dining, campus services, safety, and campus events.
- Official University of Alabama offices, departments, and programs.
- Parent-related questions about supporting a UA student.
- Tuscaloosa community topics that directly affect UA students or families (gameday logistics, transportation, nearby services).

OUT OF SCOPE:
- Topics unrelated to The University of Alabama, college life, or Tuscaloosa.
- General knowledge questions not tied to UA.
- Medical, legal, or financial advice not specific to UA policies or services.
- Speculation, opinions, or content sourced from unverified platforms.

KNOWLEDGE AND VERIFICATION RULES:
- Strictly limit facts and guidance to information available on verified and official University of Alabama websites or authoritative UA sources.
- Do NOT use unverified sources or general web knowledge.
- Every factual claim must be supported by a functional hyperlink to a specific UA webpage (preferably a ua.edu domain).
- Use the full, official name of any UA department or office the first time it is mentioned.

TIME-SENSITIVE INFORMATION:
- For information subject to change, include a brief disclaimer advising users to confirm details on the linked official UA webpage.

HANDLING UNANSWERABLE QUESTIONS:
- If a question cannot be answered using verified UA sources, clearly state that you cannot provide a confirmed answer.
- Suggest where the user can find the information.

HUMAN HAND-OFF REQUIREMENT:
- For questions that are sensitive, complex, or require human intervention, end the response with a clear direction to the best human point of contact.

YOUR TASK:
1) Determine whether the user's question is IN SCOPE or OUT OF SCOPE.
2) If IN SCOPE:
  - Provide a clear, helpful answer in Markdown.
  - Include at least one functional hyperlink to a verified University of Alabama source that directly supports the answer.
  ${contextInstruction}
3) If OUT OF SCOPE:
  - Do NOT answer the question.
  - Provide a brief explanation that you can only respond to questions related to The University of Alabama or the Tuscaloosa community.

OUTPUT FORMAT:
Return ONLY a single valid JSON object with no extra text:

{
  "status": "answered" | "rejected",
  "answer": "Markdown answer here (required if status is 'answered')",
  "reason": "Short explanation (required if status is 'rejected')"
}
`.trim();
}

async function pickDuplicateCandidate(
  openai: OpenAI,
  newQuestion: string,
  candidates: Array<{ id: string; question_text: string }>
): Promise<{ isDuplicate: boolean; matchedId?: string }> {
  // If tiny dataset, skip semantic check
  if (!ENABLE_SEMANTIC_DUPLICATE_CHECK) return { isDuplicate: false };
  if (candidates.length === 0) return { isDuplicate: false };

  const systemMessage = `
You are an expert at identifying duplicate questions.

You will receive:
- "new_question": a single question
- "existing_questions": an array of objects, each with an "id" and "question"

Task:
- Decide whether the new question is semantically identical or very similar to any existing question.
- If duplicate, return the matching "id".

Rules:
- If it is semantically identical or very similar, set "isDuplicate" to true and include "matchedId".
- Otherwise, set "isDuplicate" to false.

Output:
Return ONLY valid JSON:
{ "isDuplicate": true, "matchedId": "..." }
or
{ "isDuplicate": false }
`.trim();

  const payload = {
    new_question: newQuestion,
    existing_questions: candidates.map((c) => ({ id: c.id, question: c.question_text })),
  };

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: "json_object" },
    temperature: 0,
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: JSON.stringify(payload) },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content;
  if (!raw) return { isDuplicate: false };

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.isDuplicate === true && typeof parsed?.matchedId === "string") {
      return { isDuplicate: true, matchedId: parsed.matchedId };
    }
    return { isDuplicate: false };
  } catch {
    return { isDuplicate: false };
  }
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { question, studentYear } = req.body ?? {};
    if (!question || typeof question !== "string" || question.trim().length < 3) {
      res.status(400).json({ error: "Invalid question" });
      return;
    }

    const cleanedQuestion = question.trim();
    const normalized = normalizeQuestion(cleanedQuestion);

    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: { persistSession: false },
      }
    );

    // Anonymous is allowed, signed-in is optional
    const clerkUserId = await getOptionalClerkUserId(req);

    // 1) Fast exact-duplicate shortcut (normalized match)
    // If you add a normalized column later, you can query it directly.
    // For now we do a basic exact match on question_text normalized in JS.
    const { data: recentExactCandidates, error: recentExactErr } = await supabase
      .from("questions")
      .select("id, question_text, ai_answer, status, type, created_at")
      .eq("type", "ai")
      .order("created_at", { ascending: false })
      .limit(DUPLICATE_CANDIDATES_LIMIT);

    if (recentExactErr) {
      res.status(500).json({ error: "DB error fetching candidates", details: recentExactErr.message });
      return;
    }

    const exactHit = (recentExactCandidates ?? []).find((q: any) => {
      if (!q?.question_text) return false;
      return normalizeQuestion(String(q.question_text)) === normalized;
    });

    if (exactHit && exactHit.status === "answered" && exactHit.ai_answer) {
      res.status(200).json({
        status: "answered",
        answer: exactHit.ai_answer,
        questionId: exactHit.id,
        duplicate: true,
        duplicateType: "exact",
      });
      return;
    }

    // 2) Semantic duplicate check (your old behavior, but now via DB)
    const semanticCandidates = (recentExactCandidates ?? [])
      .filter((q: any) => q?.status === "answered" && q?.ai_answer)
      .map((q: any) => ({ id: String(q.id), question_text: String(q.question_text) }));

    const openai = new OpenAI({ apiKey: getEnv("OPENAI_API_KEY") });

    const dup = await pickDuplicateCandidate(openai, cleanedQuestion, semanticCandidates);

    if (dup.isDuplicate && dup.matchedId) {
      const matched = (recentExactCandidates ?? []).find((q: any) => String(q.id) === dup.matchedId);
      if (matched?.status === "answered" && matched?.ai_answer) {
        res.status(200).json({
          status: "answered",
          answer: matched.ai_answer,
          questionId: matched.id,
          duplicate: true,
          duplicateType: "semantic",
        });
        return;
      }
    }

    // 3) Not a duplicate, generate a fresh answer
    const systemMessage = buildAnswerSystemMessage(studentYear);
    const userMessage = `
        Parent question: "${cleanedQuestion}"
        Student year: "${studentYear ?? "All"}"
        `.trim();

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.4,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) {
      res.status(500).json({ error: "Empty response from OpenAI" });
      return;
    }

    let parsed: { status: "answered" | "rejected"; answer?: string; reason?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      res.status(500).json({ error: "Invalid JSON from OpenAI" });
      return;
    }

    if (parsed.status !== "answered" && parsed.status !== "rejected") {
      res.status(500).json({ error: "Invalid status from OpenAI" });
      return;
    }

    //Don't save to DB if question is rejected
    if(parsed.status === "rejected"){ 
        res.status(200).json({
            ...parsed,
          });
        return;
    }

    // 4) Save to DB only if new
    const insertPayload: any = {
      type: "ai",
      clerk_user_id: clerkUserId,
      student_year: studentYear ?? "All",
      question_text: cleanedQuestion,
      status: parsed.status,
      ai_answer: parsed.status === "answered" ? parsed.answer ?? null : null,
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("questions")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertErr) {
      res.status(500).json({ error: "DB insert failed", details: insertErr.message });
      return;
    }

    res.status(200).json({
      ...parsed,
      questionId: inserted?.id ?? null,
      duplicate: false,
    });
  } catch (err: any) {
    res.status(500).json({
      error: "Server error",
      details: err?.message ?? String(err),
    });
  }
}
