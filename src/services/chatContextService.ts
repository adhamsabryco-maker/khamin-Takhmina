import { GoogleGenAI, Type } from "@google/genai";

// Use GEMINI_API_KEY as primary, fallback to GOOGLE_API_KEY if needed (for Railway)
const apiKey = process.env.GEMINI_API_KEY || (process as any).env?.GOOGLE_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey as string });

export async function checkChatMessageContext(message: string, targetWord: string): Promise<boolean> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze the following chat message in an Arabic guessing game where one player is trying to guess the word "${targetWord}" and the other is answering.
        
        STRICT RULES:
        1. The message MUST be directly related to guessing the word (asking about size, color, shape, type, location, usage, or giving hints).
        2. Any social chatting, getting to know each other, asking personal questions (e.g., "منين", "مرتبطة", "اسمك ايه", "عندك كام سنة"), flirting, or discussing unrelated topics is STRICTLY FORBIDDEN and out of context.
        3. Greetings like "سلام", "اهلا", "ازيك" are allowed ONLY at the very beginning but if mixed with personal questions, it's out of context.
        
        Message: "${message}"
        
        Is this message strictly related to the game context? 
        Answer ONLY with "YES" if it is related to the game, or "NO" if it contains ANY out-of-context social/personal chatter.
      `,
      config: {
        temperature: 0.1,
      }
    });

    const result = response.text?.trim().toUpperCase();
    return result === "YES";
  } catch (error) {
    console.error("Error checking chat context:", error);
    return true; // Default to true on error to avoid false positives
  }
}
