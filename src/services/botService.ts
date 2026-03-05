import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getBotResponse = async (history: any[], systemInstruction: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: history,
      config: {
        systemInstruction,
        maxOutputTokens: 100,
        temperature: 0.9,
      }
    });
    return response.text || "مش عارف أقول إيه والله!";
  } catch (error) {
    console.error("Bot Response Error:", error);
    return "مش عارف أقول إيه والله!";
  }
};
