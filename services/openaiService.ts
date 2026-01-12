// services/openaiService.ts
// Client-side service that calls your Vercel serverless API routes.
// OpenAI keys are no longer used in the browser.

export type AskResponse =
  | {
      status: "answered";
      answer: string;
      questionId: string | null;
      duplicate: boolean;
      duplicateType?: "exact" | "semantic";
    }
  | {
      status: "rejected";
      reason: string;
      questionId: string | null;
      duplicate: false;
    }
  | {
      error: string;
      details?: string;
    };

type GetAIAnswerArgs = {
  question: string;
  studentYear?: string;
  token?: string | null; // Clerk session token (optional)
};

export async function getAIAnswer({
  question,
  studentYear = "All",
  token = null,
}: GetAIAnswerArgs): Promise<AskResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // If user is signed in, include the token so /api/ask can attach clerk_user_id
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch("/api/ask", {
    method: "POST",
    headers,
    body: JSON.stringify({ question, studentYear }),
  });

  const data = (await res.json()) as AskResponse;

  // Normalize fetch errors into the same shape
  if (!res.ok) {
    const errMsg =
      (data as any)?.error ||
      `Request failed with status ${res.status} ${res.statusText}`;
    return {
      error: errMsg,
      details: (data as any)?.details,
    };
  }

  return data;
}

/**
 * IMPORTANT:
 * Your duplicate logic now lives in /api/ask.ts (DB lookup + semantic check).
 * So the client no longer needs to run duplicate checks locally.
 * These functions are kept as minimal no-ops to avoid breaking existing imports.
 * We'll remove or rewire them in the next step.
 */

export async function checkForDuplicate(): Promise<boolean> {
  // Duplicate detection now happens on the server in /api/ask.ts
  return false;
}

export async function correctSpelling(text: string): Promise<string> {
  // Quick MVP: do nothing. If you want this again later, we can add /api/spell.
  return text;
}

export async function moderateDiscussionTopic(): Promise<{
  isAppropriate: boolean;
  reason?: string;
}> {
  // Quick MVP: allow. Discussion moderation can be added server-side later.
  return { isAppropriate: true };
}
