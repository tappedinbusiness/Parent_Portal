import { GoogleGenAI, Type } from "@google/genai";
import type { StudentYear } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const correctSpelling = async (text: string): Promise<string> => {
    try {
        const systemInstruction = `You are a helpful assistant that corrects spelling mistakes in a user's text.
- Only correct clear spelling errors.
- Do not change the user's grammar.
- Do not change the user's punctuation.
- Do not alter the sentence structure.
- Return only the corrected text.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: text,
            config: {
                systemInstruction,
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error correcting spelling:", error);
        // If spelling correction fails, return the original text
        return text;
    }
};

export const getAIAnswer = async (question: string, studentYear: StudentYear | 'All'): Promise<{ status: 'answered' | 'rejected'; answer?: string; reason?: string }> => {
    try {
        const contextPreamble = studentYear === 'All'
            ? "A parent has a general question."
            : `A parent of a '${studentYear}' student has a question.`;

        const contextInstruction = studentYear === 'All'
            ? ""
            : `When formulating the answer, keep the student's year ('${studentYear}') in mind for context.`;
        
        // Step 1: Get the informational answer from the model using Google Search.
        // The prompt is now much more forceful about including hyperlinks and uses student year for context.
        const informationalPrompt = `You are an AI assistant for the University of Alabama Parent Forum. ${contextPreamble} Your primary goal is to provide helpful, factual answers grounded in official sources. For the following question, you MUST:
1. Use Google Search to find relevant information on the official University of Alabama website or other authoritative sources.
2. Formulate a comprehensive answer in Markdown format. ${contextInstruction}
3. **Crucially, you MUST include at least one Markdown hyperlink (e.g., [UA Academic Calendar](https://www.ua.edu/calendar)) to the primary source(s) you used.** Your answer is incomplete without a source link.

Question: "${question}"`;
        
        const informationalResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: informationalPrompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        
        let generatedText = informationalResponse.text;

        // Extract grounding chunks to ensure sources are always included.
        const groundingChunks = informationalResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        if (groundingChunks.length > 0) {
            const uniqueSources = new Map<string, string>();
            groundingChunks.forEach(chunk => {
                if (chunk.web && chunk.web.uri) {
                    uniqueSources.set(chunk.web.uri, chunk.web.title || chunk.web.uri);
                }
            });

            if (uniqueSources.size > 0) {
                let sourcesText = "\n\n**Sources:**\n";
                uniqueSources.forEach((title, uri) => {
                    sourcesText += `- [${title}](${uri})\n`;
                });
                // Append sources if they aren't already in the text to avoid duplication
                if (!generatedText.includes('**Sources:**')) {
                    generatedText += sourcesText;
                }
            }
        }

        // Step 2: Take the generated text and the original question, and get a structured JSON response.
        // This call is much simpler and more reliable because it doesn't use tools.
        const systemInstruction = `You are a JSON formatting and classification engine. You will receive an original question and a pre-generated answer. Your task is to determine if the question is in scope and create a JSON object.

**Scope:** Questions about University of Alabama (UA) student life, academics, or administration (including tuition, deadlines, calendars, housing, etc.), and questions about the local Tuscaloosa community (restaurants, gameday, etc.).

**Rules:**
1.  If the original question is **IN SCOPE**: create a JSON object \`{ "status": "answered", "answer": "..." }\`, where the answer is the pre-generated text you received. You must preserve all markdown formatting, including hyperlinks.
2.  If the original question is **OUT OF SCOPE**: create a JSON object \`{ "status": "rejected", "reason": "I can only answer questions related to the University of Alabama and the local Tuscaloosa community." }\`.
3.  You MUST ONLY output the raw JSON object and nothing else.`;

        const formattingPrompt = `Original Question: "${question}"\n\nPre-generated Answer: "${generatedText}"`;
        
        const formattingResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: formattingPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
            },
        });
        
        try {
            // Clean the response text to remove potential markdown code fences
            const cleanedText = formattingResponse.text
                .replace(/^```json\s*/, '')
                .replace(/```$/, '')
                .trim();
            return JSON.parse(cleanedText);
        } catch(parseError) {
            console.error("Failed to parse Gemini JSON response:", parseError);
            console.error("Raw Gemini response text:", formattingResponse.text);
            return {
                status: 'rejected',
                reason: 'The AI returned a response in an unexpected format.'
            };
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return {
            status: 'rejected',
            reason: 'An error occurred while processing your question. Please try again.'
        };
    }
};

export const checkForDuplicate = async (newQuestion: string, existingQuestions: string[]): Promise<{ isDuplicate: boolean }> => {
    if (existingQuestions.length === 0) {
        return { isDuplicate: false };
    }

    try {
        const systemInstruction = `You are an expert at identifying duplicate questions. You will receive a "new_question" and a list of "existing_questions".
Your task is to respond with a single JSON object.
- If the new question is semantically identical or very similar to any question in the list, set "isDuplicate" to true.
- Otherwise, set "isDuplicate" to false.`;

        const prompt = `
        {
          "new_question": "${newQuestion}",
          "existing_questions": ${JSON.stringify(existingQuestions)}
        }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    isDuplicate: {
                      type: Type.BOOLEAN,
                      description: "Whether the new question is a duplicate of an existing one."
                    }
                  },
                  required: ["isDuplicate"]
                }
            },
        });

        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error checking for duplicates:", error);
        // Fail open - assume it's not a duplicate if the check fails.
        return { isDuplicate: false };
    }
};


export const moderateDiscussionTopic = async (topic: string): Promise<{ isApproved: boolean; reason?: string }> => {
    try {
        const systemInstruction = `You are a moderator for a University of Alabama parent forum. Your task is to determine if a discussion topic is appropriate for the forum.

**Scope:**
- University of Alabama specific topics (academics, housing, student life, sports, events, etc.)
- College life in general (advice for students, parent experiences, etc.)
- Topics related to Tuscaloaloosa, AL or the state of Alabama.
- General parenting discussion appropriate for a college parent audience.

**Rejection Criteria (Out of Scope):**
- Hate speech, harassment, or threats.
- Spam, advertisements, or promotions.
- Topics completely unrelated to college, parenting, or Alabama (e.g., international politics, celebrity gossip, niche hobbies).

**Your Task:**
Respond with a single JSON object.
- If the topic is IN SCOPE, set "isApproved" to true.
- If the topic is OUT OF SCOPE, set "isApproved" to false and provide a brief, polite "reason" for the user.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Discussion Topic: "${topic}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isApproved: {
                            type: Type.BOOLEAN,
                            description: "Whether the topic is approved."
                        },
                        reason: {
                            type: Type.STRING,
                            description: "Reason for rejection, if applicable."
                        }
                    },
                    required: ["isApproved"]
                }
            },
        });

        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error moderating discussion topic:", error);
        // Fail open - approve the topic if the check fails to avoid blocking users.
        return { isApproved: true };
    }
};