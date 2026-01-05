import OpenAI from "openai";
import type { StudentYear } from "@/types";

const key = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

let client: any;
if (!key) {
  console.warn(
    'VITE_OPENAI_API_KEY is not set. OpenAI calls will fail in the browser. For production, move calls to a secure server (e.g., AWS Lambda) and store the key there.'
  );
  client = {
    chat: {
      completions: {
        create: async () => {
          throw new Error('VITE_OPENAI_API_KEY not set in import.meta.env');
        }
      }
    }
  };
} else {
  client = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
  //Note, this is only for local demo purposes. Once we ship to AWS Lambda, we'll remove the key from the browser.
}

//FUNCTION TO CORRECT SPELLING MISTAKES FROM USER INPUT
export const correctSpelling = async (text: string) => {
  try{
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that corrects spelling mistakes in a user's text.
- Only correct clear spelling errors.
- Do not change the user's grammar.
- Do not change the user's punctuation.
- Do not alter the sentence structure.
- Return only the corrected text.`,
        },
        {
          role: "user",
          content: text,
        }
      ]
    });

    return response.choices[0].message?.content;

  } catch (error) {
      console.error("Status:", error.status);
      console.error("Message:", error.message);
      console.error("Data:", error.response?.data);
  }
}

//FUNCTION TO GET AI ANSWER FOR PARENT QUESTIONS
export const getAIAnswer = async (
  question: string,
  studentYear: StudentYear | "All"
): Promise<{ status: "answered" | "rejected"; answer?: string; reason?: string }> => {
  try {
    const contextPreamble =
      studentYear === "All"
        ? "A parent has a general question."
        : `A parent of a '${studentYear}' student has a question.`;

    const contextInstruction =
      studentYear === "All"
        ? ""
        : `When formulating the answer, keep the student's year ('${studentYear}') in mind for context.`;

        //SYSTEM MESSAGE TEMPLATE
        //Objective: Provide accurate, relevant, and verified answers relating to The University of Alabama

          const systemMessage = `
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
      - General knowledge questions not tied to UA (e.g., “What is photosynthesis?”).
      - Medical, legal, or financial advice not specific to UA policies or services.
      - Speculation, opinions, or content sourced from unverified platforms (social media, forums, blogs).

      KNOWLEDGE AND VERIFICATION RULES:
      - Strictly limit facts and guidance to information available on verified and official University of Alabama websites or authoritative UA sources.
      - Do NOT use unverified sources or general web knowledge.
      - Every factual claim must be supported by a functional hyperlink to a specific UA webpage (preferably a ua.edu domain).
      - Use the full, official name of any UA department or office the first time it is mentioned.

      TIME-SENSITIVE INFORMATION:
      - For information subject to change (tuition, deadlines, dates, costs, event times), include a brief disclaimer advising users to confirm details on the linked official UA webpage.

      PRIVACY, SAFETY, AND CONFIDENTIALITY:
      - Never ask for, collect, store, or reference personally identifiable information (PII), including names, student IDs, addresses, or financial data.
      - If a user asks about sensitive personal matters (mental health, safety concerns, crises, or individual student situations), do NOT attempt to resolve the issue.
      - Instead, provide the appropriate official UA resource and encourage direct contact (for example, the University of Alabama Counseling Center or Dean of Students Office).

      ADMISSIONS, FINANCIAL AID, AND PRIVATE RECORDS:
      - You cannot access or comment on individual admissions status, financial aid disbursements, or account balances.
      - For these cases, clearly state this limitation and direct the user to the official contact method for the relevant office (Admissions, Student Financial Aid, etc.).

      HANDLING UNANSWERABLE QUESTIONS:
      - If a question cannot be answered using verified UA sources, clearly state that you cannot provide a confirmed answer.
      - When appropriate, suggest where the user can find the information, such as the main UA website or a specific office.

      HUMAN HAND-OFF REQUIREMENT:
      - For questions that are sensitive, complex, or require human intervention, end the response with a clear direction to the best human point of contact, including an official phone number or email when available.

      YOUR TASK:
      1. Determine whether the user's question is IN SCOPE or OUT OF SCOPE.
      2. If IN SCOPE:
        - Provide a clear, helpful answer in **Markdown**.
        - Include at least one functional hyperlink to a verified University of Alabama source that directly supports the answer.
        - If exact details are uncertain, say so and point to the authoritative UA page.
        ${contextInstruction}
      3. If OUT OF SCOPE:
        - Do NOT answer the question.
        - Provide a brief explanation that you can only respond to questions related to The University of Alabama or the Tuscaloosa community.

      OUTPUT FORMAT:
      You MUST return ONLY a single valid JSON object with no extra text:

      {
        "status": "answered" | "rejected",
        "answer": "Markdown answer here (required if status is 'answered')",
        "reason": "Short explanation (required if status is 'rejected')"
      }

      Ensure the JSON is valid and can be parsed directly. The word "json" is included so JSON mode may be used.
      `.trim();


    const userMessage = `
        Parent question: "${question}"
        Student year: "${studentYear}"
    `.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature: 0.4
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Empty response from OpenAI");
    }

    const parsed = JSON.parse(raw) as {
      status: "answered" | "rejected";
      answer?: string;
      reason?: string;
    };

    if (parsed.status !== "answered" && parsed.status !== "rejected") {
      throw new Error("Invalid status field in OpenAI response");
    }

    return parsed;
  } catch (error) {
      console.error("Status:", error.status);
      console.error("Message:", error.message);
      console.error("Data:", error.response?.data);
    return {
      status: "rejected",
      reason: "An error occurred while processing your question. Please try again."
    };
  }
};

//FUNCION TO CHECK FOR DUPLICATE QUESTIONS
export const checkForDuplicate = async (
  newQuestion: string,
  existingQuestions: string[]
): Promise<{ isDuplicate: boolean }> => {
  if (existingQuestions.length === 0) {
    return { isDuplicate: false };
  }

  try {
    const systemMessage = `
You are an expert at identifying duplicate questions.

You will receive:
- "new_question": a single question
- "existing_questions": an array of questions

You must decide whether the new question is semantically identical or very similar to any of the existing questions.

Rules:
- If the new question is semantically identical or very similar to any question in the list, set "isDuplicate" to true.
- Otherwise, set "isDuplicate" to false.

Output:
Return ONLY a single JSON object. It must be valid JSON of the form:
{ "isDuplicate": true } OR { "isDuplicate": false }

The word "json" is included so you can safely use JSON mode.
    `.trim();

    const payload = {
      new_question: newQuestion,
      existing_questions: existingQuestions
    };

    const userMessage = `
Here is the JSON payload:

${JSON.stringify(payload, null, 2)}
    `.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature: 0
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Empty response from OpenAI");
    }

    const parsed = JSON.parse(raw) as { isDuplicate: boolean };

    if (typeof parsed.isDuplicate !== "boolean") {
      throw new Error("Invalid isDuplicate field in OpenAI response");
    }

    return parsed;
  } catch (error) {
      console.error("Status:", error.status);
      console.error("Message:", error.message);
      console.error("Data:", error.response?.data);
    // Fail open, same as before
    return { isDuplicate: false };
  }
};

//FUNCTION TO MODERATE DISCUSSION TOPICS
export const moderateDiscussionTopic = async (
  topic: string
): Promise<{ isApproved: boolean; reason?: string }> => {
  try {
    const systemMessage = `
You are a moderator for a University of Alabama parent forum. Your task is to determine if a discussion topic is appropriate for the forum.

Scope (IN SCOPE):
- University of Alabama specific topics (academics, housing, student life, sports, events, etc).
- College life in general (advice for students, parent experiences, etc).
- Topics related to Tuscaloosa, AL or the state of Alabama.
- General parenting discussion appropriate for a college parent audience.

Rejection criteria (OUT OF SCOPE):
- Hate speech, harassment, or threats.
- Spam, advertisements, or promotions.
- Topics completely unrelated to college, parenting, or Alabama
  (for example international politics, celebrity gossip, niche hobbies with no UA link).

Your task:
- If the topic is IN SCOPE, set "isApproved" to true.
- If the topic is OUT OF SCOPE, set "isApproved" to false and provide a brief, polite "reason" for the user.

Output:
Return ONLY a single JSON object, valid JSON, of the form:
{
  "isApproved": true
}
or
{
  "isApproved": false,
  "reason": "Short, polite explanation here."
}

Make sure the word "json" in this message reminds you to output valid JSON.
    `.trim();

    const userMessage = `Discussion Topic: "${topic}"`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature: 0
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Empty response from OpenAI");
    }

    const parsed = JSON.parse(raw) as {
      isApproved: boolean;
      reason?: string;
    };

    if (typeof parsed.isApproved !== "boolean") {
      throw new Error("Invalid isApproved field in OpenAI response");
    }

    return parsed;
  } catch (error) {
      console.error("Status:", error.status);
      console.error("Message:", error.message);
      console.error("Data:", error.response?.data);
    // Fail open, same as before
    return { isApproved: true };
  }
};
