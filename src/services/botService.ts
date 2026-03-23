import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || (process as any).env?.GOOGLE_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const getBotResponse = async (history: any[], systemInstruction: string) => {
  const fallbackResponses = [
    "مش عارف أقول إيه والله! 🤔",
    "سؤال صعب شوية.. خليني أفكر..",
    "يا ترى إيه الإجابة؟ 🧐",
    "لعبة ممتعة جداً! كمل..",
    "أنا معاك، مستني التخمين الجاي..",
    "يا واد يا لعيب! 😉",
    "ركز شوية، قربت توصل..",
    "مممم.. مش متأكد أوي..",
    "إيه الحلاوة دي! كمل..",
    "يا مسهل الحال.. يارب تطلع صح!"
  ];

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
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
      return response.text || fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    } catch (error: any) {
      if (error.message?.includes('429') && retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000;
        console.warn(`Gemini Rate Limit (429). Retrying in ${delay}ms... (Attempt ${retryCount})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      console.error("Bot Response Error:", error.message);
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  }
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
};
