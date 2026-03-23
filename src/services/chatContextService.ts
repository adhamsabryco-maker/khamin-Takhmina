import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function checkChatMessageContext(message: string, targetWord: string): Promise<boolean> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze the following chat message in a game where one player is trying to guess the word "${targetWord}" and the other is answering.
        The message should be related to the game (asking questions about the object, its properties, colors, shapes, answering questions, or guessing the word).
        
        Message: "${message}"
        
        Is this message related to the game context? 
        Answer only with "YES" if it is related, or "NO" if it is completely out of context (e.g. social chatting, personal questions, unrelated topics).
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
