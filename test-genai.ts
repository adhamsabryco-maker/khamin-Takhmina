import { GoogleGenAI } from "@google/genai";
try {
  const genAI = new GoogleGenAI({ apiKey: "" });
  console.log("GenAI initialized successfully");
} catch (e) {
  console.error("GenAI initialization failed:", e);
}
