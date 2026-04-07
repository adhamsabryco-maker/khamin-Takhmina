import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || (process as any).env?.GOOGLE_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const getBotResponse = async (history: any[], systemInstruction: string, temperature: number = 0.9) => {
  const fallbackResponses = ["آه", "لأ"];

  const maxRetries = 3;
  let retryCount = 0;

  let validHistory = [...history];
  if (validHistory.length === 0) {
    validHistory.push({ role: 'user', parts: [{ text: 'ابدأ اللعب واسأل سؤالك الأول.' }] });
  } else if (validHistory[0].role === 'model') {
    validHistory.unshift({ role: 'user', parts: [{ text: 'ابدأ اللعب.' }] });
  }

  while (retryCount <= maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: validHistory,
        config: {
          systemInstruction,
          maxOutputTokens: 100,
          temperature: temperature,
        }
      });
      return response.text || "آه"; 
    } catch (error: any) {
      if (error.message?.includes('429') && retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000;
        console.warn(`Gemini Rate Limit (429). Retrying in ${delay}ms... (Attempt ${retryCount})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      console.error("Bot Response Error:", error.message);
      return "آه";
    }
  }
  return "آه";
};
