import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";
import Database from 'better-sqlite3';
import multer from "multer";
import os from "os";
import admin from 'firebase-admin';
import archiver from 'archiver';
import webpush from 'web-push';

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("[Firebase Admin] Initialized successfully.");
  } catch (e) {
    console.error("[Firebase Admin] Failed to initialize:", e);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
  destination: path.join(__dirname, 'public/uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
const dbUpload = multer({ dest: os.tmpdir() });

import { filterProfanity, filterGameTerms } from "./src/profanityFilter";
import { GoogleGenAI } from "@google/genai";
import { COLLECTION_DATA } from "./collectionData";

const SPIN_REWARDS = [
  { id: 'time_freeze', type: 'helper', value: 'time_freeze', weight: 50, label: 'تجميد الوقت', icon: 'Snowflake' },
  { id: 'word_length', type: 'helper', value: 'word_length', weight: 40, label: 'كاشف الحروف', icon: 'Type' },
  { id: 'word_count', type: 'helper', value: 'word_count', weight: 30, label: 'عدد الكلمات', icon: 'Hash' },
  { id: 'hint', type: 'helper', value: 'hint', weight: 20, label: 'تلميح', icon: 'HelpCircle' },
  { id: 'spy_lens', type: 'helper', value: 'spy_lens', weight: 10, label: 'الجاسوس', icon: 'Eye' },
  { id: 'token_1', type: 'token', value: 1, weight: 8, label: 'Token 1', icon: 'Coins' },
  { id: 'token_2', type: 'token', value: 2, weight: 5, label: 'Token 2', icon: 'Coins' },
  { id: 'token_3', type: 'token', value: 3, weight: 1, label: 'Token 3', icon: 'Coins' },
  { id: 'token_4', type: 'token', value: 4, weight: 0.05, label: 'Token 4', icon: 'Coins' },
  { id: 'token_5', type: 'token', value: 5, weight: 0.0001, label: 'Token 5', icon: 'Coins' },
  { id: 'token_10', type: 'token', value: 10, weight: 0.000001, label: 'Token 10', icon: 'Coins' },
  { id: 'xp_10', type: 'xp', value: 10, weight: 90, label: '10 XP', icon: 'Star' },
  { id: 'xp_20', type: 'xp', value: 20, weight: 80, label: '20 XP', icon: 'Star' },
  { id: 'xp_30', type: 'xp', value: 30, weight: 70, label: '30 XP', icon: 'Star' },
  { id: 'xp_40', type: 'xp', value: 40, weight: 60, label: '40 XP', icon: 'Star' },
  { id: 'xp_50', type: 'xp', value: 50, weight: 2, label: '50 XP', icon: 'Star' },
  { id: 'xp_100', type: 'xp', value: 100, weight: 1, label: '100 XP', icon: 'Star' },
  { id: 'xp_5000', type: 'xp', value: 5000, weight: 0.0001, label: '5000 XP', icon: 'Star' },
  { id: 'xp_10000', type: 'xp', value: 10000, weight: 0.0000001, label: '10000 XP', icon: 'Star' },
  { id: 'pro_30', type: 'pro', value: 30, weight: 0, label: 'باقة المحترفين', icon: 'Crown' },
];

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "dummy_key_to_prevent_crash" });
if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  console.warn("WARNING: Neither GEMINI_API_KEY nor GOOGLE_API_KEY is set. AI features will not work.");
}

const BOT_PERSONAS = [
  // الشخصيات اللي كانت فوق الـ 20 وتم ضبطها
  { name: "زيزو", age: 22, level: 15, avatar: "avatar-lvl-boy-10.png", gender: "boy", personality: "هزار وفرفشة، بيحب يستخدم كلمات زي 'يا زميلي' و 'يا صاحبي' و 'أنجز يا وحش'" },
  { name: "منة", age: 20, level: 8, avatar: "avatar-free-girl-01.png", gender: "girl", personality: "هادية ومركزة، كلامها قليل ومحدد، بتستخدم 'أيوة' و 'لأ' و 'مش عارفة'" },
  { name: "أبو مكة", age: 35, level: 20, avatar: "avatar-lvl-boy-20.png", gender: "boy", personality: "حريف وقديم في اللعبة، كلامه فيه حكمة شوية وبيحب يشجع المنافس 'عاش يا بطل'" },
  { name: "حمو", age: 19, level: 5, avatar: "avatar-free-boy-04.png", gender: "boy", personality: "لسه جديد وبيتعلم، بيغلط كتير وبيهزر على نفسه 'أنا ضايع خالص يا جدعان'" },
  { name: "سارة", age: 24, level: 19, avatar: "avatar-lvl-girl-20.png", gender: "girl", personality: "ذكية وبتحب التحدي، بتسأل أسئلة صعبة وبتحاول توقع المنافس في الغلط" },
  { name: "ميدو", age: 21, level: 12, avatar: "avatar-lvl-boy-10.png", gender: "boy", personality: "بيحب الرغي والكلام الجانبي، ممكن يحكي موقف حصل معاه وهو بيلعب" },
  { name: "نور", age: 23, level: 18, avatar: "avatar-lvl-girl-10.png", gender: "girl", personality: "بتحب الضحك والهزار، بس ذكية جداً في اللعب" },
  { name: "ليلى", age: 26, level: 20, avatar: "avatar-lvl-girl-20.png", gender: "girl", personality: "جدية شوية، بس بتحب المنافسة الشريفة" },

  // المستويات المبتدئة (كما هي لأنها تحت الـ 20)
  { name: "بوجي", age: 18, level: 2, avatar: "avatar-free-boy-01.png", gender: "boy", personality: "مرتبك جداً وبيسأل كتير 'هو الدور على مين؟'" },
  { name: "توكا", age: 19, level: 4, avatar: "avatar-free-girl-02.png", gender: "girl", personality: "بتحب الإيموجيز جداً وكلامها كله دلع 'سوري مخدتش بالي'" },
  { name: "كيمو", age: 21, level: 6, avatar: "avatar-free-boy-02.png", gender: "boy", personality: "بيحب التحدي رغم إنه لسه بيبدأ 'هكسبك يعني هكسبك'" },
  { name: "مارينا", age: 22, level: 3, avatar: "avatar-free-girl-03.png", gender: "girl", personality: "مجاملة جداً 'لعبك حلو أوي ما شاء الله'" },
  { name: "سمسم", age: 17, level: 8, avatar: "avatar-free-boy-03.png", gender: "boy", personality: "لسه منزل اللعبة حالا 'يا جدعان حد يفهمني بنلعب إزاي'" },
  { name: "نودي", age: 20, level: 7, avatar: "avatar-free-girl-04.png", gender: "girl", personality: "متسرعة وبتحب تلعب بسرعة 'يلا بسرعة ورانا مشاوير'" },
  { name: "شيكا", age: 24, level: 9, avatar: "avatar-free-boy-04.png", gender: "boy", personality: "كلامه كورة 'أنا هعمل عليك ريمونتادا دلوقتي'" },
  { name: "لولو", age: 21, level: 5, avatar: "avatar-free-girl-01.png", gender: "girl", personality: "بتحب الكلام عن الحظ 'أوف الحظ النهاردة مش معايا خالص'" },

  // مستوى 10 لـ 19
  { name: "عبده", age: 27, level: 11, avatar: "avatar-lvl-boy-10.png", gender: "boy", personality: "بيحب يشتت المنافس 'بص العصفورة' ويهزر كتير" },
  { name: "روكا", age: 23, level: 14, avatar: "avatar-lvl-girl-10.png", gender: "girl", personality: "واثقة في نفسها وبتحب كلمة 'تم القصف'" },
  { name: "صاصا", age: 22, level: 16, avatar: "avatar-lvl-boy-10.png", gender: "boy", personality: "بتاع قفشات أفلام 'أنا بابا يلا'" },
  { name: "هنا", age: 19, level: 13, avatar: "avatar-lvl-girl-10.png", gender: "girl", personality: "هادية بس ذكية 'ركز في ورقتك يا بطل'" },
  { name: "بيبو", age: 25, level: 19, avatar: "avatar-lvl-boy-10.png", gender: "boy", personality: "حريف وبيلعب بدماغه 'اللعبة دي محتاجة نفس طويل'" },
  { name: "سلمى", age: 24, level: 17, avatar: "avatar-lvl-girl-10.png", gender: "girl", personality: "بتحب النظام 'لو سمحت العب بالترتيب'" },

  // الشخصيات اللي كانت +20 (تم تعديلها لسقف الـ 20)
  { name: "تيتو", age: 28, level: 20, avatar: "avatar-lvl-boy-20.png", gender: "boy", personality: "مش بيحب الخسارة أبداً 'لا دي أكيد صدفة، نلعب تاني'" },
  { name: "نادين", age: 26, level: 19, avatar: "avatar-lvl-girl-20.png", gender: "girl", personality: "بتحلل كل حركة 'همم.. الحركة دي وراها حاجة'" },
  { name: "فارس", age: 30, level: 20, avatar: "avatar-lvl-boy-20.png", gender: "boy", personality: "هادي جداً وبيلعب ببرود أعصاب يحرق الدم" },
  { name: "جنا", age: 22, level: 18, avatar: "avatar-lvl-girl-20.png", gender: "girl", personality: "بتحب تشجع نفسها 'عاش يا أنا، قربنا نخلص'" },
  { name: "مارك", age: 25, level: 19, avatar: "avatar-lvl-boy-20.png", gender: "boy", personality: "بيحب المنافسة 'وريني هتعمل إيه في دي'" },
  { name: "شهد", age: 23, level: 20, avatar: "avatar-lvl-girl-20.png", gender: "girl", personality: "طموحة وعايزة توصل لأعلى مستوى 'خلاص هانت كلها دورين وأقفل الليفل'" },

  // مستوى 10 لـ 20 (تم ضغطهم ليكونوا قمة الهرم في لعبتك)
  { name: "الجوكر", age: 32, level: 19, avatar: "avatar-lvl-boy-20.png", gender: "boy", personality: "غامض وكلامه قليل 'السكوت علامة الاحتراف'" },
  { name: "مايا", age: 27, level: 18, avatar: "avatar-lvl-girl-20.png", gender: "girl", personality: "خبرة وبتحب تدي نصايح 'لو لعبتها يمين كانت هتبقى أحلى'" },
  { name: "سلطان", age: 34, level: 17, avatar: "avatar-lvl-boy-20.png", gender: "boy", personality: "كبير القعدة 'نورتم التربيزة يا شباب'" },
  { name: "لارا", age: 25, level: 20, avatar: "avatar-lvl-girl-20.png", gender: "girl", personality: "سريعة جداً في الرد واللعب 'متحاولش تفكر كتير'" },
  { name: "دكتور اكس", age: 29, level: 19, avatar: "avatar-lvl-boy-20.png", gender: "boy", personality: "بيحسبها بالورقة والقلم 'الاحتمالات بتقول إني هكسب'" },
  { name: "بيري", age: 28, level: 16, avatar: "avatar-lvl-girl-10.png", gender: "girl", personality: "راقية في تعاملها 'لعب ممتع للجميع'" },

  // مستوى العمالقة (تم تعديلهم من +40 ليكونوا ضمن سقف الـ 20)
  { name: "العقرب", age: 40, level: 20, avatar: "avatar-lvl-boy-20.png", gender: "boy", personality: "ملك اللعبة 'محدش بياكلها معايا بالساهل'" },
  { name: "الملكة", age: 33, level: 19, avatar: "avatar-lvl-girl-20.png", gender: "girl", personality: "برنسيسة اللعبة 'لعبكم لسه محتاج شوية مجهود'" },
  { name: "الجنرال", age: 38, level: 20, avatar: "avatar-lvl-boy-20.png", gender: "boy", personality: "صارم جداً 'الخطأ هنا بموت، ركز'" },
  { name: "الهانم", age: 36, level: 18, avatar: "avatar-lvl-girl-20.png", gender: "girl", personality: "ذكاء حاد وهدوء قاتل 'اللعب فن مش عن عن'" },
  { name: "الأسطورة", age: 45, level: 20, avatar: "avatar-lvl-boy-20.png", gender: "boy", personality: "أعلى لفل في اللعبة 'اتعلموا من العبد لله'" },
  { name: "سندريلا", age: 29, level: 17, avatar: "avatar-lvl-girl-20.png", gender: "girl", personality: "هادية بس بتخلص الدور في ثانية" },

  // شخصيات بأسماء مركبة (تم ضبط المستويات والصور)
  { name: "علي القاضي", age: 31, level: 18, avatar: "avatar-lvl-boy-20.png", gender: "boy", personality: "حكيم وهادي، كلامه موزون وبيركز في كل حركة 'العدل أساس اللعبة'" },
  { name: "ملك التخمين", age: 24, level: 15, avatar: "avatar-lvl-boy-10.png", gender: "boy", personality: "بيعتمد على إحساسه جداً 'قلبي بيقولي إنك بتغش يا زميلي'" },
  { name: "سيف محمد", age: 20, level: 14, avatar: "avatar-lvl-boy-10.png", gender: "boy", personality: "شاب طموح وبيلعب بتكتيك 'واحدة واحدة وهجيبك'" },
  { name: "نور الهادي", age: 22, level: 9, avatar: "avatar-free-girl-02.png", gender: "girl", personality: "رقيقة في كلامها بس بتلعب بذكاء 'اللعب معاكوا ممتع جداً'" },
  { name: "عمر الكبنج", age: 29, level: 17, avatar: "avatar-lvl-boy-10.png", gender: "boy", personality: "برنس في نفسه وبيلعب بشياكة 'أهم حاجة الروح الرياضية'" },
  { name: "برنسيسة اللعبة", age: 26, level: 20, avatar: "avatar-lvl-girl-20.png", gender: "girl", personality: "واثقة جداً من فوزها 'محدش يقدر يغلب البرنسيسة'" },
  { name: "ياسين العملاق", age: 33, level: 19, avatar: "avatar-lvl-boy-20.png", gender: "boy", personality: "بيحب التحديات الصعبة 'وروني هتعملوا إيه مع العملاق'" },
  { name: "مريم الصادق", age: 21, level: 6, avatar: "avatar-free-girl-03.png", gender: "girl", personality: "بتحب الصراحة 'أنا حظي وحش النهاردة بس هحاول'" },
  { name: "كابتن ماجد", age: 25, level: 18, avatar: "avatar-lvl-boy-10.png", gender: "boy", personality: "بيحب الحماس وكلام الكورة 'الكورة في ملعبي دلوقتي'" },
  { name: "ليلى عبد الله", age: 28, level: 13, avatar: "avatar-lvl-girl-10.png", gender: "girl", personality: "كلامها فيه رزانة وهدوء 'كل دور وله لابد من فائز'" }
];

function getBranchForImage(imageName: string, category: string): string {
  const normCategory = normalizeEgyptian(category);
  const normImage = normalizeEgyptian(imageName);
  
  // Try to find branch from botAnswersCache first
  const catKey = Object.keys(botAnswersCache).find(k => normalizeEgyptian(k) === normCategory);
  if (catKey) {
    const categoryData = botAnswersCache[catKey];
    for (const key of Object.keys(categoryData)) {
      const value = categoryData[key];
      if (typeof value === 'object' && !Array.isArray(value)) {
        const imageKey = Object.keys(value).find(k => normalizeEgyptian(k) === normImage);
        if (imageKey) return key;
      }
    }
  }

  if (normCategory === normalizeEgyptian('حيوانات')) return 'بري';
  if (normCategory === normalizeEgyptian('أكلات')) return 'حادق';
  if (normCategory === normalizeEgyptian('اشخاص')) return 'رجل';
  return '';
}

let botAnswersCache: any = {};
let configCache: any = { avatars: {}, frames: {}, stars: {}, aiBotEnabled: false, quickChat: [], version: "1.0.0" };

// Global Error Handlers to prevent server crashes

function findQuestionId(text: string, quickChat: any[]): string | null {
  if (!quickChat) return null;
  const normalizedInput = normalizeEgyptian(text);
  for (const item of quickChat) {
    const normalizedItemText = normalizeEgyptian(item.text);
    if (normalizedItemText === normalizedInput) {
      console.log(`[findQuestionId] Match found: "${text}" -> "${item.id}"`);
      return item.id;
    }
    if (item.children && item.children.length > 0) {
      const foundId = findQuestionId(text, item.children);
      if (foundId) return foundId;
    }
  }
  return null;
}

function getBotAnswer(category: string, imageName: string | any, questionId: string, botAnswers: any): string | null {
  const actualImageName = (imageName && typeof imageName === 'object') ? imageName.name : imageName;
  const normImage = normalizeEgyptian(actualImageName);
  
  console.log(`[getBotAnswer] Search: Cat="${category}", Image="${actualImageName}", QID="${questionId}"`);
  
  // Find category data
  let categoryData = botAnswers[category];
  if (!categoryData) {
    const qcId = category.startsWith('qc_') ? category : `qc_${category}`;
    categoryData = botAnswers[qcId];
  }
  
  // Robust mapping for Arabic names
  if (!categoryData) {
    const mappings: Record<string, string> = {
      'حيوانات': 'qc_animals',
      'أكلات': 'qc_food',
      'اشخاص': 'qc_people',
      'جماد': 'qc_objects',
      'objects': 'qc_objects',
      'نبات': 'qc_plants',
      'plants': 'qc_plants',
      'طيور': 'qc_birds',
      'حشرات': 'qc_insects',
      'كرة القدم': 'qc_football'
    };
    const mappedId = mappings[category] || mappings[normalizeEgyptian(category)];
    if (mappedId) categoryData = botAnswers[mappedId];
  }

  if (!categoryData) {
    const catKey = Object.keys(botAnswers).find(k => normalizeEgyptian(k) === normalizeEgyptian(category));
    if (catKey) categoryData = botAnswers[catKey];
  }

  if (!categoryData) {
    console.log(`[BotAnswer] Category "${category}" not found in JSON.`);
    return null;
  }

  // 1. Check if question is a branch ID (e.g., "qc_animals_wild")
  if (categoryData[questionId] && typeof categoryData[questionId] === 'object' && !Array.isArray(categoryData[questionId])) {
    const branchData = categoryData[questionId];
    const imageInThisBranch = !!Object.keys(branchData).find(k => normalizeEgyptian(k) === normImage);
    console.log(`[BotAnswer] Branch ID match: ${questionId}. Image in branch: ${imageInThisBranch}`);
    return imageInThisBranch ? "آه" : "لأ";
  }
  
  // 2. Find the image and check its question IDs
  for (const key of Object.keys(categoryData)) {
    const value = categoryData[key];
    if (typeof value === 'object' && !Array.isArray(value)) {
      // Search inside branch
      const imageKey = Object.keys(value).find(k => normalizeEgyptian(k) === normImage);
      if (imageKey) {
        const ids = value[imageKey];
        const found = Array.isArray(ids) && ids.includes(questionId);
        console.log(`[BotAnswer] Image found in branch "${key}". Question ID "${questionId}" match: ${found}`);
        return found ? "آه" : "لأ";
      }
    } else if (Array.isArray(value)) {
      // Search in root
      if (normalizeEgyptian(key) === normImage) {
        const found = value.includes(questionId);
        console.log(`[BotAnswer] Image found in root. Question ID "${questionId}" match: ${found}`);
        return found ? "آه" : "لأ";
      }
    }
  }
  
  console.log(`[BotAnswer] Image "${actualImageName}" not found in JSON.`);
  return null;
}

// Global Error Handlers to prevent server crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

function normalizeEgyptian(text: string): string {
  if (!text) return "";
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/لآ/g, "لا")
    .replace(/[؟?]/g, "")
    .trim();
}

function isSameDay(d1: number, d2: number) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate();
}

import axios from "axios";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

async function startServer() {
  let adminTokens: any;
  try {
  const getLevel = (xp: number) => Math.floor(Math.sqrt(xp / 50)) + 1;
const getQuickGuessWaitTime = (level: number) => {
  // Level 1: 150s wait, Level 50: 3s wait (decreases 3s per level)
  return Math.max(3, 150 - (level - 1) * 3);
};

const getQuickGuessThreshold = (level: number) => {
  // The threshold is when the game timer (600s) reaches (600 - waitTime)
  // Level 1: 600 - 150 = 450s remaining
  // Level 10: 600 - 123 = 477s remaining
  return 600 - getQuickGuessWaitTime(level);
};

const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // DEBUG: Log all requests
  app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

  // Google OAuth Routes (Moved to top)
  const getRedirectUri = (req: express.Request) => {
    // 1. Priority: Explicit APP_URL from environment (Best for Railway/Production)
    if (process.env.APP_URL) {
      // Remove trailing slash if present
      const baseUrl = process.env.APP_URL.replace(/\/$/, '');
      return `${baseUrl}/api/auth/google/callback`;
    }

    // 2. Fallback: Dynamic detection from headers
    const protoHeader = req.headers['x-forwarded-proto'];
    const hostHeader = req.headers['x-forwarded-host'];
    
    const protocol = Array.isArray(protoHeader) ? protoHeader[0] : (protoHeader || req.protocol);
    const host = Array.isArray(hostHeader) ? hostHeader[0] : (hostHeader || req.get('host'));
    
    // Force https in production if not detected
    const finalProtocol = process.env.NODE_ENV === 'production' ? 'https' : protocol;
    
    return `${finalProtocol}://${host}/api/auth/google/callback`;
  };

  app.post("/api/paymob/pay-wallet", async (req, res) => {
    try {
      const { mobileNumber, paymentToken } = req.body;

      const response = await fetch('https://accept.paymob.com/api/acceptance/payments/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: {
            identifier: mobileNumber,
            subtype: "WALLET"
          },
          payment_token: paymentToken
        })
      });

      const data = await response.json();

      if (data.redirect_url) {
        return res.json({ url: data.redirect_url });
      } else {
        return res.status(400).json({ message: "فشل الحصول على رابط التحويل", details: data });
      }
    } catch (error) {
      console.error("Paymob wallet error:", error);
      res.status(500).json({ message: "خطأ في الاتصال بـ Paymob" });
    }
  });

  app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ filename: req.file.filename });
  });

  app.delete("/api/upload/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'public/uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  const APP_VERSION_FILE = path.join(__dirname, 'version.json');
  let currentVersion = '1.1.5';
  if (fs.existsSync(APP_VERSION_FILE)) {
    try {
      const vData = JSON.parse(fs.readFileSync(APP_VERSION_FILE, 'utf-8'));
      currentVersion = vData.version || '1.1.1';
    } catch (e) {
      console.error("Error reading version.json:", e);
    }
  }

  const USE_FIRESTORE_CONFIG = process.env.USE_FIRESTORE_CONFIG === 'true';
  const firestore = admin.apps.length > 0 ? admin.firestore() : null;

  configCache = { avatars: {}, frames: {}, stars: {}, aiBotEnabled: false, quickChat: [], version: currentVersion };
  let activeGlobalReward: any = null;
  let gamePolicies = {
    termsAr: "الشروط والأحكام الافتراضية للعبة خمن تخمينة.\n\n1. يجب احترام جميع اللاعبين.\n2. يمنع استخدام أي برامج مساعدة أو غش.\n3. الإدارة غير مسؤولة عن أي خسارة للبيانات.",
    termsEn: "Default Terms and Conditions for Guess Guess game.\n\n1. All players must be respected.\n2. Use of any helper programs or cheating is prohibited.\n3. The administration is not responsible for any data loss.",
    privacyAr: "سياسة الخصوصية للعبة خمن تخمينة.\n\n1. نحن نقوم بجمع بياناتك الأساسية مثل الاسم والصورة الرمزية.\n2. لا نقوم بمشاركة بياناتك مع أي طرف ثالث.\n3. يتم استخدام البيانات لتحسين تجربة اللعب فقط.",
    privacyEn: "Privacy Policy for Guess Guess game.\n\n1. We collect your basic data such as name and avatar.\n2. We do not share your data with any third party.\n3. Data is used only to improve the gaming experience.",
    isRainGiftEnabled: true
  };
  const configPath = path.join(__dirname, 'public/uploads/config.json');
  
  // Load initial config from file
  if (fs.existsSync(configPath)) {
    try {
      configCache = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (!configCache.version) configCache.version = currentVersion;
    } catch (e) {
      console.error("Error reading config:", e);
    }
  }

  const botAnswersPath = path.join(__dirname, 'public/uploads/bot_answers.json');
  if (fs.existsSync(botAnswersPath)) {
    try {
      botAnswersCache = JSON.parse(fs.readFileSync(botAnswersPath, 'utf-8'));
      console.log(`[BotAnswers] Loaded ${Object.keys(botAnswersCache).length} categories`);
      console.log("[BotAnswers] Loaded successfully.");
    } catch (e) {
      console.error("Error reading bot_answers:", e);
    }
  }

  // Override with Firestore if enabled
  if (USE_FIRESTORE_CONFIG && firestore) {
    try {
      const doc = await firestore.collection('settings').doc('gameConfig').get();
      if (doc.exists) {
        const remoteConfig = doc.data() as any;
        configCache = { ...configCache, ...remoteConfig };
        console.log("[Config] Loaded from Firestore successfully.");
      } else {
        await firestore.collection('settings').doc('gameConfig').set(configCache);
        console.log("[Config] Initialized Firestore with local config.");
      }
    } catch (e) {
      console.error("[Config] Failed to load from Firestore:", e);
    }
  }

  // Dynamic manifest.json to support versioning
  const manifestHandler = (req: express.Request, res: express.Response) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const version = configCache.version || '1.1.1';
    // Use a versioned path for the icon to force OS-level PWA icon updates
    const iconPath = `/icon-v2.svg`;
    
    res.json({
      "id": "/",
      "name": "خمن تخمينة",
      "short_name": "خمن تخمينة",
      "description": "لعبة تخمين كلمات وصور ممتعة",
      "start_url": "/",
      "display": "standalone",
      "background_color": "#ffffff",
      "theme_color": "#ffffff",
      "icons": [
        {
          "src": "/icon-v2.svg",
          "sizes": "any",
          "purpose": "any",
          "type": "image/svg+xml"
        },
        {
          "src": "/icon-192.png", 
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "any"
        },
        {
          "src": "/icon-512.png",
          "sizes": "512x512",
          "type": "image/png",
          "purpose": "any"
        }
      ],
      "screenshots": [
        {
          "src": "/screenshot-mobile.png",
          "sizes": "1080x1920",
          "type": "image/png",
          "form_factor": "narrow",
          "label": "Game Play on Mobile"
        },
        {
          "src": "/screenshot-desktop.png",
          "sizes": "1920x1080",
          "type": "image/png",
          "form_factor": "wide",
          "label": "Game Play on Desktop"
        }
      ]
    });
  };

  app.get("/manifest.json", manifestHandler);
  app.get("/manifest.webmanifest", manifestHandler);

  // Route to serve the icon with a versioned filename
  app.get("/icon-v2.svg", (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const iconFile = path.join(__dirname, "dist", "icon-v2.svg");
    const publicIconFile = path.join(__dirname, "public", "icon-v2.svg");
    const rootIconFile = path.join(__dirname, "icon-v2.svg");

    if (fs.existsSync(iconFile)) {
      res.sendFile(iconFile);
    } else if (fs.existsSync(publicIconFile)) {
      res.sendFile(publicIconFile);
    } else if (fs.existsSync(rootIconFile)) {
      res.sendFile(rootIconFile);
    } else {
      res.status(404).send("Icon not found");
    }
  });

  app.post("/api/config", async (req, res) => {
    console.log('[API] Received config update:', req.body);
    configCache = req.body;
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
    
    if (USE_FIRESTORE_CONFIG && firestore) {
      try {
        await firestore.collection('settings').doc('gameConfig').set(req.body);
        console.log("[Config] Saved to Firestore.");
      } catch (e) {
        console.error("[Config] Failed to save to Firestore:", e);
      }
    }

    // Also update version.json if version is provided
    if (req.body.version) {
      try {
        fs.writeFileSync(APP_VERSION_FILE, JSON.stringify({ version: req.body.version }, null, 2));
      } catch (e) {
        console.error("Error updating version.json:", e);
      }
    }
    
    io.emit('config_updated', req.body);
    res.json({ success: true });
  });

  app.get("/api/admin/download-config", (req, res) => {
    if (fs.existsSync(configPath)) {
      res.download(configPath, 'config.json');
    } else {
      res.status(404).json({ error: "Config file not found" });
    }
  });

  app.post("/api/admin/upload-config", upload.single("config"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    try {
      const newConfig = JSON.parse(fs.readFileSync(req.file.path, 'utf-8'));
      configCache = newConfig;
      fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
      
      if (USE_FIRESTORE_CONFIG && firestore) {
        try {
          await firestore.collection('settings').doc('gameConfig').set(newConfig);
          console.log("[Config] Uploaded config saved to Firestore.");
        } catch (e) {
          console.error("[Config] Failed to save uploaded config to Firestore:", e);
        }
      }

      fs.unlinkSync(req.file.path); // remove temp file
      io.emit('config_updated', newConfig);
      res.json({ success: true });
    } catch (e) {
      console.error("Error uploading config:", e);
      res.status(400).json({ error: "Invalid JSON format" });
    }
  });

  app.get("/api/config", (req, res) => {
    res.json(configCache);
  });

  app.get("/api/admin/bot-answers", (req, res) => {
    res.json(botAnswersCache);
  });

  app.post("/api/admin/bot-answers", async (req, res) => {
    try {
      const newAnswers = req.body;
      const botAnswersPath = path.join(__dirname, 'public/uploads/bot_answers.json');
      fs.writeFileSync(botAnswersPath, JSON.stringify(newAnswers, null, 2));
      botAnswersCache = newAnswers;
      console.log("[BotAnswers] Updated via API");
      res.json({ success: true });
    } catch (e: any) {
      console.error("Error saving bot answers:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/version", (req, res) => {
    res.json({ version: configCache.version || '1.1.1' });
  });

  app.get("/api/maintenance", (req, res) => {
    res.json({ maintenance: process.env.MAINTENANCE_MODE === 'true' });
  });

  // Push Notification Endpoints
  app.get("/api/push/public-key", (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  app.post("/api/push/subscribe", express.json(), (req, res) => {
    const { serial, subscription } = req.body;
    if (!subscription) return res.status(400).json({ error: "No subscription provided" });
    
    try {
      const subStr = JSON.stringify(subscription);
      // Check if subscription already exists
      const existing = db.prepare('SELECT id, serial FROM push_subscriptions WHERE subscription = ?').get(subStr) as any;
      if (!existing) {
        db.prepare('INSERT INTO push_subscriptions (serial, subscription, timestamp) VALUES (?, ?, ?)')
          .run(serial || null, subStr, Date.now());
      } else if (serial && existing.serial !== serial) {
        db.prepare('UPDATE push_subscriptions SET serial = ? WHERE id = ?').run(serial, existing.id);
      }
      
      // Also ensure notificationsEnabled is 1 for this player
      if (serial) {
        db.prepare('UPDATE players SET notificationsEnabled = 1 WHERE serial = ?').run(serial);
      }
      
      res.status(201).json({ success: true });
    } catch (err) {
      console.error("Failed to save push subscription:", err);
      res.status(500).json({ error: "Failed to save subscription" });
    }
  });

  app.post("/api/push/unsubscribe", express.json(), (req, res) => {
    const { serial, subscription } = req.body;
    if (!subscription) return res.status(400).json({ error: "No subscription provided" });
    
    try {
      const subStr = JSON.stringify(subscription);
      db.prepare('DELETE FROM push_subscriptions WHERE subscription = ?').run(subStr);
      
      // Also ensure notificationsEnabled is 0 for this player
      if (serial) {
        db.prepare('UPDATE players SET notificationsEnabled = 0 WHERE serial = ?').run(serial);
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to remove push subscription:", err);
      res.status(500).json({ error: "Failed to remove subscription" });
    }
  });

  app.get("/api/admin/push-stats", (req, res) => {
    const token = req.query.token as string;
    if (!adminTokens.has(token)) return res.status(403).json({ error: "Unauthorized" });
    
    // Count unique players who have a subscription AND have enabled notifications
    const stats = db.prepare(`
      SELECT COUNT(DISTINCT ps.serial) as count 
      FROM push_subscriptions ps
      INNER JOIN players p ON ps.serial = p.serial
      WHERE p.notificationsEnabled = 1
    `).get() as any;

    // Also get total players count
    const totalPlayers = db.prepare('SELECT COUNT(*) as count FROM players').get() as any;
    
    res.json({ 
      count: stats.count || 0,
      totalPlayers: totalPlayers.count || 0
    });
  });

  app.post("/api/push/send", express.json(), async (req, res) => {
    const { title, body, url, adminToken } = req.body;
    if (!adminTokens.has(adminToken)) return res.status(403).json({ error: "Unauthorized" });
    
    // Only send to subscriptions where the player has notificationsEnabled = 1
    // We join with players table to check the status
    const subscriptions = db.prepare(`
      SELECT ps.subscription, ps.serial 
      FROM push_subscriptions ps
      LEFT JOIN players p ON ps.serial = p.serial
      WHERE p.notificationsEnabled = 1 OR ps.serial IS NULL
    `).all() as any[];
    
    const payload = JSON.stringify({ title, body, url: url || '/' });
    
    console.log(`[Push] Sending notification to ${subscriptions.length} devices...`);
    
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const subscription = JSON.parse(sub.subscription);
        await webpush.sendNotification(subscription, payload);
        return true; // Success
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired or no longer valid, remove it
          db.prepare('DELETE FROM push_subscriptions WHERE subscription = ?').run(sub.subscription);
        } else {
          console.error("Error sending push notification:", err);
        }
        return false; // Failure
      }
    });

    const results = await Promise.all(sendPromises);
    const successfulCount = results.filter(r => r === true).length;

    res.json({ 
      success: true, 
      sentCount: successfulCount,
      totalAttempted: subscriptions.length 
    });
  });

  app.post("/api/claim-level-50-reward", (req, res) => {
    const { serial } = req.body;
    const player = allPlayers.get(serial);
    if (!player) return res.status(404).json({ message: "Player not found" });
    if (player.isAdmin) return res.status(403).json({ message: "Admins cannot claim this reward" });
    if ((player.level || 0) < 50) return res.status(403).json({ message: "You must reach level 50" });
    
    const claimed = db.prepare('SELECT value FROM settings WHERE key = ?').get('level_50_reward_claimed');
    if (claimed) return res.status(403).json({ message: "Reward already claimed" });
    
    // Award 10 tokens
    player.tokens = (player.tokens || 0) + 10;
    // Award 7-day Pro Package
    player.proPackageExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    
    savePlayerData(serial);
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('level_50_reward_claimed', 'true');
    io.emit('reward_claimed', true);
    
    res.json({ success: true, tokens: player.tokens, proPackageExpiry: player.proPackageExpiry });
  });

  app.get("/api/check-level-50-reward", (req, res) => {
    const claimed = db.prepare('SELECT value FROM settings WHERE key = ?').get('level_50_reward_claimed');
    res.json({ claimed: !!claimed });
  });

  app.get("/api/auth/google/url", (req, res) => {
    const redirectUri = getRedirectUri(req);
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile`;
    res.json({ url });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    console.log('Received callback request:', req.url);
    const { code } = req.query;
    const redirectUri = getRedirectUri(req);
    console.log('Constructed Redirect URI:', redirectUri);

    try {
      const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });

      const { access_token } = tokenResponse.data;
      const userResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const { email, name, picture } = userResponse.data;

      // Check if this email is the admin email
      const isAdmin = email === "adhamsabry.co@gmail.com";

      let adminToken = null;
      if (isAdmin) {
        adminToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        adminTokens.add(adminToken);
      }

      // Redirect directly back to the app with the auth parameters
      const params = new URLSearchParams({
        admin_auth: 'success',
        adminToken: adminToken || '',
        email: email || '',
        isAdmin: isAdmin ? 'true' : 'false'
      });
      
      const redirectPath = isAdmin ? '/admin' : '/';
      res.redirect(redirectPath + '?' + params.toString());
    } catch (error: any) {
      console.error("Google Auth Error:", error.response?.data || error.message);
      
      const errorDetails = error.response?.data || error.message;
      let arabicReason = "حدث خطأ غير معروف.";
      
      if (errorDetails?.error === 'redirect_uri_mismatch') {
        arabicReason = "رابط التحويل (Redirect URI) غير متطابق مع المسجل في Google Cloud.";
      } else if (errorDetails?.error === 'invalid_client') {
        arabicReason = "بيانات GOOGLE_CLIENT_ID أو GOOGLE_CLIENT_SECRET غير صحيحة.";
      } else if (errorDetails?.error === 'invalid_grant') {
        arabicReason = "الكود منتهي الصلاحية أو تم استخدامه بالفعل. يرجى المحاولة مرة أخرى.";
      }

      // Display error to user instead of redirecting, for debugging
      res.status(500).send(`
        <html dir="rtl">
          <body style="font-family: 'Cairo', sans-serif; padding: 20px; text-align: center; background-color: #fef2f2;">
            <h2 style="color: #dc2626;">فشل تسجيل الدخول</h2>
            <p style="font-size: 18px;">السبب المحتمل: <strong>${arabicReason}</strong></p>
            
            <div style="margin-top: 30px; padding: 15px; background: #fff; border: 1px solid #fca5a5; border-radius: 8px; text-align: left; direction: ltr;">
              <p style="margin-top: 0; color: #666;">تفاصيل الخطأ التقني (للمطور):</p>
              <pre style="background: #f1f5f9; padding: 10px; border-radius: 5px; overflow-x: auto;">${JSON.stringify(errorDetails, null, 2)}</pre>
              <p>Constructed Redirect URI: <br><strong>${redirectUri}</strong></p>
            </div>
            
            <a href="/" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer; text-decoration: none;">العودة للرئيسية</a>
          </body>
        </html>
      `);
    }
  });

  // Game State
  const rooms = new Map<string, any>();
  const intervals = new Map<string, NodeJS.Timeout>();
  const matchmakingQueue: any[] = [];
  const matchmakingInterval = setInterval(() => {
    processQueue();
  }, 2000); // Run every 2 seconds
  const reportsList: any[] = [];
  const blocks = new Map<string, { blockedId: string, expiresAt: number }[]>();
  const pendingMatches = new Map<string, any>();
  const allPlayers = new Map<string, { 
    name: string, 
    level: number, 
    avatar: string,
    gender?: string, 
    fingerprint?: string,
    ip?: string,
    xp: number, 
    streak: number,
    serial: string, 
    wins: number, 
    reports: number, 
    banUntil: number, 
    banCount: number,
    isPermanentBan: number,
    reportedBy: { reporterSerial: string, timestamp: number }[],
    email?: string,
    isAdmin?: boolean,
    tokens?: number,
    adsWatchedToday?: number,
    lastAdWatchDate?: string,
    adWatchStartTime?: number,
    dailyQuestStreak?: number,
    lastDailyClaim?: number,
    weeklyTokensClaimed?: number,
    lastWeeklyTokenReset?: number,
    lastGuess?: string,
    ownedHelpers?: { [key: string]: number },
    proPackageExpiry?: number,
    unlockedHelpersExpiry?: number,
    claimedRewards?: string[],
    lastRenameAt?: number,
    pendingAvatar?: string,
    avatarStatus?: 'approved' | 'pending' | 'rejected',
    lastComplaintAt?: number,
    lastContactAt?: number,
    blockedSerials?: string[],
    blockedFingerprints?: string[],
    recentOpponents?: { serial: string, name: string, avatar: string, selectedFrame?: string, timestamp: number, level?: number, xp?: number }[],
    reportedSerials?: string[],
    selectedFrame?: string,
    lastRainGiftResetDay?: string,
    rainGiftTokens?: number,
    rainGiftHelpers?: { [key: string]: number },
    notificationsEnabled?: number,
    lastSpinDate?: string,
    dailySpinCount?: number,
    freeSpinUsed?: number,
    luckyWheelTokens?: number,
    luckyWheelHelpers?: { [key: string]: number },
    lastLuckyWheelResetDay?: string,
    luckyWheelDaysUsed?: number
  }>();

  const playerSockets = new Map<string, string>();

  let dbPath = process.env.DB_PATH || path.join(__dirname, 'players.db');
  console.log(`[DB] Using database at: ${dbPath}`);
  console.log(`[DB] Current working directory: ${process.cwd()}`);
  console.log(`[DB] __dirname: ${__dirname}`);
  
  const dbDir = path.dirname(dbPath);
  try {
    if (!fs.existsSync(dbDir)) {
      console.log(`[DB] Creating database directory: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }
    // Test writability
    const testFile = path.join(dbDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log(`[DB] Directory ${dbDir} is writable.`);
  } catch (err) {
    console.error(`[DB] Failed to verify or create database directory ${dbDir}:`, err);
    // If we can't create the directory or it's not writable, fallback to local directory
    const fallbackPath = path.join(__dirname, 'players.db');
    console.log(`[DB] Falling back to local database: ${fallbackPath}`);
    dbPath = fallbackPath;
  }

  let db: any;
  try {
    db = new Database(dbPath, { timeout: 10000 });
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    console.log("[DB] Database connected successfully.");

    // Initialize shop items if needed
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS shop_items (
          id TEXT PRIMARY KEY,
          name TEXT,
          description TEXT,
          price REAL,
          type TEXT,
          image TEXT,
          amount INTEGER,
          active INTEGER DEFAULT 1,
          timestamp INTEGER
        )
      `);

      const count = db.prepare('SELECT COUNT(*) as count FROM shop_items').get() as any;
      if (count.count === 0) {
        console.log("[DB] Seeding shop items...");
        const insert = db.prepare('INSERT OR REPLACE INTO shop_items (id, name, description, price, type, image, amount, active, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        const now = Date.now();
        insert.run('token_pack_1', '1 Token', 'مباراة واحدة مع مستوى 40+', 10, 'token_pack_1', '', 1, 1, now);
        insert.run('token_pack_5', '5 Tokens', '5 مباريات + 1 مجاناً', 40, 'token_pack_5', '', 5, 1, now);
        insert.run('token_pack_10', '10 Tokens', '10 مباريات + 3 مجاناً', 70, 'token_pack_10', '', 10, 1, now);
        insert.run('pro_pack', 'باقة المحترفين', 'استخدم وسائل المساعدة بدون إعلانات لمدة 30 يوم', 150, 'pro_pack', '', 0, 1, now);
        console.log("[DB] Successfully seeded shop items.");
      }
    } catch (err) {
      console.error("[DB] Failed to seed shop items:", err);
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_tokens (
        token TEXT PRIMARY KEY,
        expiresAt INTEGER
      );
    `);

    adminTokens = {
      add: (token: string, expiresInMs: number = 1000 * 60 * 60 * 24 * 365 * 100) => {
        const expiresAt = Date.now() + expiresInMs;
        db.prepare('INSERT INTO admin_tokens (token, expiresAt) VALUES (?, ?)').run(token, expiresAt);
      },
      has: (token: string) => {
        if (!token) return false;
        const row = db.prepare('SELECT expiresAt FROM admin_tokens WHERE token = ?').get(token) as any;
        if (!row) return false;
        if (Date.now() > row.expiresAt) {
          db.prepare('DELETE FROM admin_tokens WHERE token = ?').run(token);
          return false;
        }
        return true;
      },
      delete: (token: string) => {
        db.prepare('DELETE FROM admin_tokens WHERE token = ?').run(token);
      },
      cleanup: () => {
        db.prepare('DELETE FROM admin_tokens WHERE expiresAt < ?').run(Date.now());
      }
    };

    // Cleanup expired tokens on startup
    adminTokens.cleanup();
  } catch (err) {
    console.error(`[DB] Failed to open database at ${dbPath}:`, err);
    // Final fallback to a guaranteed writable location
    try {
      const finalFallback = path.join(process.cwd(), 'players.db');
      console.log(`[DB] Final fallback to: ${finalFallback}`);
      db = new Database(finalFallback);
      db.pragma('journal_mode = WAL');
    } catch (finalErr) {
      console.error("[DB] CRITICAL: All database fallbacks failed.", finalErr);
      // If we can't even open a local DB, we might have to use in-memory or crash
      db = new Database(':memory:');
      console.log("[DB] Using IN-MEMORY database as last resort. DATA WILL NOT PERSIST.");
    }
  }

  // Graceful shutdown
  const shutdown = () => {
    console.log("[DB] Closing database...");
    if (db) db.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  db.exec(`
    CREATE TABLE IF NOT EXISTS banned_identities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fingerprint TEXT,
      ip TEXT,
      timestamp INTEGER
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      serial TEXT PRIMARY KEY,
      name TEXT,
      avatar TEXT,
      xp INTEGER,
      wins INTEGER,
      level INTEGER,
      gender TEXT
    )
  `);

  // Add new columns for reporting system if they don't exist
  try { db.exec(`ALTER TABLE players ADD COLUMN gender TEXT DEFAULT 'boy'`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN fingerprint TEXT`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN ip TEXT`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN reports INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN banUntil INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN banCount INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN isPermanentBan INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN reportedBy TEXT DEFAULT '[]'`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN email TEXT`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN isAdmin INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN tokens INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN adsWatchedToday INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN lastAdWatchDate TEXT`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN ownedHelpers TEXT DEFAULT '{}'`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN lastRainGiftResetDay TEXT`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN rainGiftTokens INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN rainGiftHelpers TEXT DEFAULT '{}'`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN dailyQuestStreak INTEGER DEFAULT 1`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN lastDailyClaim INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN weeklyTokensClaimed INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN streak INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN lastWeeklyTokenReset INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN proPackageExpiry INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN unlockedHelpersExpiry INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN claimedRewards TEXT DEFAULT '[]'`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN reportedSerials TEXT DEFAULT '[]'`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN lastRenameAt INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN pendingAvatar TEXT`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN avatarStatus TEXT DEFAULT 'approved'`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN lastComplaintAt INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN lastContactAt INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN blockedSerials TEXT DEFAULT '[]'`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN blockedFingerprints TEXT DEFAULT '[]'`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN recentOpponents TEXT DEFAULT '[]'`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN selectedFrame TEXT DEFAULT ''`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN notificationsEnabled INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN lastSpinDate TEXT`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN dailySpinCount INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN freeSpinUsed INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN luckyWheelTokens INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN luckyWheelHelpers TEXT DEFAULT '{}'`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN lastLuckyWheelResetDay TEXT`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN luckyWheelDaysUsed INTEGER DEFAULT 0`); } catch (e) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS shop_items (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      price REAL,
      type TEXT,
      image TEXT,
      amount INTEGER,
      active INTEGER DEFAULT 1,
      timestamp INTEGER
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial TEXT,
      subscription TEXT,
      timestamp INTEGER
    )
  `);

  // Setup VAPID keys for Push Notifications
  let vapidKeys = { publicKey: '', privateKey: '' };
  const existingVapid = db.prepare('SELECT value FROM settings WHERE key = ?').get('vapid_keys') as any;
  if (existingVapid) {
    vapidKeys = JSON.parse(existingVapid.value);
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('vapid_keys', JSON.stringify(vapidKeys));
  }
  
  webpush.setVapidDetails(
    'mailto:adhamsabry.co@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS reward_history (
      id TEXT PRIMARY KEY,
      type TEXT,
      durationHours INTEGER,
      tokenAmount INTEGER,
      expiresInDays INTEGER,
      message TEXT,
      sentAt INTEGER,
      expiresAt INTEGER
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_images (
      id TEXT PRIMARY KEY,
      category TEXT,
      name TEXT,
      data TEXT,
      addedBy TEXT,
      timestamp INTEGER
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS used_prizes (
      serial TEXT,
      prize_id TEXT,
      date TEXT,
      PRIMARY KEY (serial, prize_id, date)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT,
      icon TEXT,
      timestamp INTEGER
    )
  `);

  // Insert default categories if none exist
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (catCount.count === 0) {
    const defaultCategories = [
      { id: 'people', name: 'اشخاص', icon: '👥' },
      { id: 'food', name: 'أكلات', icon: '🍕' },
      { id: 'animals', name: 'حيوانات', icon: '🐘' },
      { id: 'objects', name: 'جماد', icon: '📦' },
      { id: 'birds', name: 'طيور', icon: '🦜' },
      { id: 'plants', name: 'نبات', icon: '🌿' },
      { id: 'insects', name: 'حشرات', icon: '🐞' },
      { id: 'football', name: 'كرة القدم', icon: '⚽' },
    ];
    const insertCat = db.prepare('INSERT INTO categories (id, name, icon, timestamp) VALUES (?, ?, ?, ?)');
    const insertManyCats = db.transaction((cats) => {
      for (const cat of cats) {
        insertCat.run(cat.id, cat.name, cat.icon, Date.now());
      }
    });
    insertManyCats(defaultCategories);
  }

  // Migration: Ensure 'insects' and 'football' categories exist and have correct IDs
  const categoriesToMigrate = [
    { oldName: 'حشرات', newId: 'insects', newName: 'حشرات', newIcon: '🐞' },
    { oldName: 'كرة القدم', newId: 'football', newName: 'كرة القدم', newIcon: '⚽' },
  ];

  for (const cat of categoriesToMigrate) {
    // Check if category exists by name
    const existingCat = db.prepare('SELECT * FROM categories WHERE name = ?').get(cat.oldName) as { id: string } | undefined;
    if (existingCat) {
      if (existingCat.id !== cat.newId) {
        // Update custom_images to point to new ID
        db.prepare('UPDATE custom_images SET category = ? WHERE category = ?').run(cat.newId, existingCat.id);
        // Update category ID
        db.prepare('UPDATE categories SET id = ? WHERE id = ?').run(cat.newId, existingCat.id);
      }
    } else {
      // If not exists, insert it
      const exists = db.prepare('SELECT * FROM categories WHERE id = ?').get(cat.newId);
      if (!exists) {
        db.prepare('INSERT INTO categories (id, name, icon, timestamp) VALUES (?, ?, ?, ?)').run(cat.newId, cat.newName, cat.newIcon, Date.now());
      }
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      timestamp INTEGER,
      reporterSerial TEXT,
      reporterName TEXT,
      reportedSerial TEXT,
      reportedName TEXT,
      reason TEXT,
      roomId TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playerSerial TEXT,
      name TEXT,
      subject TEXT,
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS player_collections (
      player_serial TEXT,
      image_name TEXT,
      count INTEGER DEFAULT 0,
      PRIMARY KEY (player_serial, image_name)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS claimed_collection_rewards (
      player_serial TEXT,
      category_id TEXT,
      stage INTEGER,
      PRIMARY KEY (player_serial, category_id, stage)
    )
  `);

  const insertPlayer = db.prepare(`
    INSERT OR REPLACE INTO players (serial, name, avatar, xp, wins, level, gender, fingerprint, ip, reports, banUntil, banCount, isPermanentBan, reportedBy, email, isAdmin, tokens, adsWatchedToday, lastAdWatchDate, ownedHelpers, dailyQuestStreak, lastDailyClaim, weeklyTokensClaimed, streak, lastWeeklyTokenReset, proPackageExpiry, unlockedHelpersExpiry, claimedRewards, lastRenameAt, pendingAvatar, avatarStatus, lastComplaintAt, lastContactAt, blockedSerials, blockedFingerprints, recentOpponents, reportedSerials, selectedFrame, lastRainGiftResetDay, rainGiftTokens, rainGiftHelpers, notificationsEnabled, lastSpinDate, dailySpinCount, freeSpinUsed, luckyWheelTokens, luckyWheelHelpers, lastLuckyWheelResetDay, luckyWheelDaysUsed)
    VALUES (@serial, @name, @avatar, @xp, @wins, @level, @gender, @fingerprint, @ip, @reports, @banUntil, @banCount, @isPermanentBan, @reportedBy, @email, @isAdmin, @tokens, @adsWatchedToday, @lastAdWatchDate, @ownedHelpers, @dailyQuestStreak, @lastDailyClaim, @weeklyTokensClaimed, @streak, @lastWeeklyTokenReset, @proPackageExpiry, @unlockedHelpersExpiry, @claimedRewards, @lastRenameAt, @pendingAvatar, @avatarStatus, @lastComplaintAt, @lastContactAt, @blockedSerials, @blockedFingerprints, @recentOpponents, @reportedSerials, @selectedFrame, @lastRainGiftResetDay, @rainGiftTokens, @rainGiftHelpers, @notificationsEnabled, @lastSpinDate, @dailySpinCount, @freeSpinUsed, @luckyWheelTokens, @luckyWheelHelpers, @lastLuckyWheelResetDay, @luckyWheelDaysUsed)
  `);

  // Helper to check and perform daily reset for Rain Gift rewards
  function checkDailyReset(player: any, serial: string, socket?: any) {
    if (!player) return;
    
    const getRainGiftEventDay = () => {
      const parts = new Intl.DateTimeFormat('en-GB', { 
        timeZone: 'Africa/Cairo', 
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hour12: false 
      }).formatToParts(new Date());
      
      let year = 0, month = 0, day = 0, hour = 0, minute = 0;
      for (const part of parts) {
        if (part.type === 'year') year = parseInt(part.value, 10);
        if (part.type === 'month') month = parseInt(part.value, 10);
        if (part.type === 'day') day = parseInt(part.value, 10);
        if (part.type === 'hour') {
          hour = parseInt(part.value, 10);
          if (hour === 24) hour = 0; // Handle 24:00 as 00:00
        }
        if (part.type === 'minute') minute = parseInt(part.value, 10);
      }
      
      // Event starts at 19:00 Egypt time. Reset at 18:50 Egypt time.
      if (hour < 18 || (hour === 18 && minute < 50)) {
        const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        d.setUTCDate(d.getUTCDate() - 1);
        year = d.getUTCFullYear();
        month = d.getUTCMonth() + 1;
        day = d.getUTCDate();
      }
      
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    };
    
    const getLuckyWheelResetDay = () => {
      const parts = new Intl.DateTimeFormat('en-GB', { 
        timeZone: 'Africa/Cairo', 
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hour12: false 
      }).formatToParts(new Date());
      
      let year = 0, month = 0, day = 0, hour = 0, minute = 0;
      for (const part of parts) {
        if (part.type === 'year') year = parseInt(part.value, 10);
        if (part.type === 'month') month = parseInt(part.value, 10);
        if (part.type === 'day') day = parseInt(part.value, 10);
        if (part.type === 'hour') {
          hour = parseInt(part.value, 10);
          if (hour === 24) hour = 0;
        }
        if (part.type === 'minute') minute = parseInt(part.value, 10);
      }
      
      // Reset at 23:50 Egypt time
      if (hour < 23 || (hour === 23 && minute < 50)) {
        const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        d.setUTCDate(d.getUTCDate() - 1);
        year = d.getUTCFullYear();
        month = d.getUTCMonth() + 1;
        day = d.getUTCDate();
      }
      
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    };

    let needsSave = false;
    
    const currentDay = getRainGiftEventDay();
    if (player.lastRainGiftResetDay !== currentDay) {
      player.lastRainGiftResetDay = currentDay;
      
      // Reset only the unused tokens and helpers obtained from Rain Gift
      if (player.rainGiftTokens && player.rainGiftTokens > 0) {
        player.tokens = Math.max(0, (player.tokens || 0) - player.rainGiftTokens);
        player.rainGiftTokens = 0;
      }
      
      if (player.rainGiftHelpers) {
        if (!player.ownedHelpers) player.ownedHelpers = {};
        for (const [helperId, count] of Object.entries(player.rainGiftHelpers)) {
          if (typeof count === 'number' && count > 0) {
            player.ownedHelpers[helperId] = Math.max(0, (player.ownedHelpers[helperId] || 0) - count);
            if (player.ownedHelpers[helperId] === 0) {
              delete player.ownedHelpers[helperId];
            }
          }
        }
        player.rainGiftHelpers = {};
      }

      console.log(`[Rain Gift] Daily reset for ${serial} on ${currentDay}`);
      needsSave = true;
    }

    const currentLuckyWheelDay = getLuckyWheelResetDay();
    if (player.lastLuckyWheelResetDay !== currentLuckyWheelDay) {
      player.lastLuckyWheelResetDay = currentLuckyWheelDay;

      // Reset only the unused tokens and helpers obtained from Lucky Wheel
      if (player.luckyWheelTokens && player.luckyWheelTokens > 0) {
        player.tokens = Math.max(0, (player.tokens || 0) - player.luckyWheelTokens);
        player.luckyWheelTokens = 0;
      }
      
      if (player.luckyWheelHelpers) {
        if (!player.ownedHelpers) player.ownedHelpers = {};
        for (const [helperId, count] of Object.entries(player.luckyWheelHelpers)) {
          if (typeof count === 'number' && count > 0) {
            player.ownedHelpers[helperId] = Math.max(0, (player.ownedHelpers[helperId] || 0) - count);
            if (player.ownedHelpers[helperId] === 0) {
              delete player.ownedHelpers[helperId];
            }
          }
        }
        player.luckyWheelHelpers = {};
      }

      console.log(`[Lucky Wheel] Daily reset for ${serial} on ${currentLuckyWheelDay}`);
      needsSave = true;
    }

    if (needsSave) {
      savePlayerData(serial);
      if (socket) {
        socket.emit("player_data_update", { 
          serial, 
          tokens: player.tokens, 
          ownedHelpers: player.ownedHelpers 
        });
      }
    }
  }

  function savePlayerData(serial: string) {
    try {
      const player = allPlayers.get(serial);
      if (!player) return;
      
      insertPlayer.run({
        ...player,
        gender: player.gender || 'boy',
        fingerprint: player.fingerprint || null,
        ip: player.ip || null,
        reportedBy: JSON.stringify(player.reportedBy || []),
        email: player.email || null,
        isAdmin: player.isAdmin ? 1 : 0,
        tokens: player.tokens || 0,
        adsWatchedToday: player.adsWatchedToday || 0,
        lastAdWatchDate: player.lastAdWatchDate || null,
        ownedHelpers: JSON.stringify(player.ownedHelpers || {}),
        dailyQuestStreak: player.dailyQuestStreak || 1,
        streak: player.streak || 0,
        lastDailyClaim: player.lastDailyClaim || 0,
        weeklyTokensClaimed: player.weeklyTokensClaimed || 0,
        lastWeeklyTokenReset: player.lastWeeklyTokenReset || 0,
        proPackageExpiry: player.proPackageExpiry || 0,
        unlockedHelpersExpiry: player.unlockedHelpersExpiry || 0,
        claimedRewards: JSON.stringify(player.claimedRewards || []),
        lastRenameAt: player.lastRenameAt || 0,
        pendingAvatar: player.pendingAvatar || null,
        avatarStatus: player.avatarStatus || 'approved',
        lastComplaintAt: player.lastComplaintAt || 0,
        lastContactAt: player.lastContactAt || 0,
        blockedSerials: JSON.stringify(player.blockedSerials || []),
        blockedFingerprints: JSON.stringify(player.blockedFingerprints || []),
        recentOpponents: JSON.stringify(player.recentOpponents || []),
        reportedSerials: JSON.stringify(player.reportedSerials || []),
        selectedFrame: player.selectedFrame || '',
        lastRainGiftResetDay: player.lastRainGiftResetDay || null,
        rainGiftTokens: player.rainGiftTokens || 0,
        rainGiftHelpers: JSON.stringify(player.rainGiftHelpers || {}),
        notificationsEnabled: player.notificationsEnabled !== undefined ? player.notificationsEnabled : 0,
        lastSpinDate: player.lastSpinDate || null,
        dailySpinCount: player.dailySpinCount || 0,
        freeSpinUsed: player.freeSpinUsed || 0,
        luckyWheelTokens: player.luckyWheelTokens || 0,
        luckyWheelHelpers: JSON.stringify(player.luckyWheelHelpers || {}),
        lastLuckyWheelResetDay: player.lastLuckyWheelResetDay || null,
        luckyWheelDaysUsed: player.luckyWheelDaysUsed || 0
      });
      invalidateTopPlayersCache();
    } catch (err) {
      console.error(`Failed to save player data for ${serial}:`, err);
    }
  }

  const insertMany = db.transaction((players) => {
    for (const player of players) {
      insertPlayer.run({
        ...player,
        gender: player.gender || 'boy',
        fingerprint: player.fingerprint || null,
        ip: player.ip || null,
        reportedBy: JSON.stringify(player.reportedBy || []),
        email: player.email || null,
        isAdmin: player.isAdmin ? 1 : 0,
        tokens: player.tokens || 0,
        adsWatchedToday: player.adsWatchedToday || 0,
        lastAdWatchDate: player.lastAdWatchDate || null,
        ownedHelpers: JSON.stringify(player.ownedHelpers || {}),
        dailyQuestStreak: player.dailyQuestStreak || 1,
        lastDailyClaim: player.lastDailyClaim || 0,
        weeklyTokensClaimed: player.weeklyTokensClaimed || 0,
        lastWeeklyTokenReset: player.lastWeeklyTokenReset || 0,
        proPackageExpiry: player.proPackageExpiry || 0,
        unlockedHelpersExpiry: player.unlockedHelpersExpiry || 0,
        claimedRewards: JSON.stringify(player.claimedRewards || []),
        lastRenameAt: player.lastRenameAt || 0,
        pendingAvatar: player.pendingAvatar || null,
        avatarStatus: player.avatarStatus || 'approved',
        lastComplaintAt: player.lastComplaintAt || 0,
        lastContactAt: player.lastContactAt || 0,
        blockedSerials: JSON.stringify(player.blockedSerials || []),
        blockedFingerprints: JSON.stringify(player.blockedFingerprints || []),
        recentOpponents: JSON.stringify(player.recentOpponents || []),
        reportedSerials: JSON.stringify(player.reportedSerials || []),
        selectedFrame: player.selectedFrame || '',
        lastRainGiftResetDay: player.lastRainGiftResetDay || null,
        rainGiftTokens: player.rainGiftTokens || 0,
        rainGiftHelpers: JSON.stringify(player.rainGiftHelpers || {}),
        notificationsEnabled: player.notificationsEnabled !== undefined ? player.notificationsEnabled : 0,
        lastSpinDate: player.lastSpinDate || null,
        dailySpinCount: player.dailySpinCount || 0,
        freeSpinUsed: player.freeSpinUsed || 0,
        luckyWheelTokens: player.luckyWheelTokens || 0,
        luckyWheelHelpers: JSON.stringify(player.luckyWheelHelpers || {}),
        lastLuckyWheelResetDay: player.lastLuckyWheelResetDay || null,
        luckyWheelDaysUsed: player.luckyWheelDaysUsed || 0
      });
    }
  });

  function saveAllPlayersData() {
    try {
      const players = Array.from(allPlayers.values());
      // Only run full save if queue is small or during maintenance
      // For performance, we prefer individual saves
      if (players.length > 100) {
        console.log(`[DB] Warning: Full save of ${players.length} players. This might block the event loop.`);
      }
      insertMany(players);
      invalidateTopPlayersCache();
    } catch (err) {
      console.error("Failed to save all players data:", err);
    }
  }

  function loadPlayersData() {
    try {
      const rows = db.prepare('SELECT * FROM players').all();
      allPlayers.clear();
      
      rows.forEach((row: any) => {
        let reportedBy = [];
        try {
          reportedBy = JSON.parse(row.reportedBy || '[]');
        } catch (e) {}
        
        allPlayers.set(row.serial, {
          ...row,
          gender: row.gender || 'boy',
          fingerprint: row.fingerprint || null,
          ip: row.ip || null,
          reports: row.reports || 0,
          banUntil: row.banUntil || 0,
          banCount: row.banCount || 0,
          isPermanentBan: row.isPermanentBan || 0,
          reportedBy: reportedBy,
          email: row.email,
          isAdmin: row.isAdmin === 1,
          streak: row.streak || 0,
          tokens: row.tokens || 0,
          adsWatchedToday: row.adsWatchedToday || 0,
          lastAdWatchDate: row.lastAdWatchDate || null,
          ownedHelpers: JSON.parse(row.ownedHelpers || '{}'),
          dailyQuestStreak: row.dailyQuestStreak || 1,
          lastDailyClaim: row.lastDailyClaim || 0,
          weeklyTokensClaimed: row.weeklyTokensClaimed || 0,
          lastWeeklyTokenReset: row.lastWeeklyTokenReset || 0,
          proPackageExpiry: row.proPackageExpiry || 0,
          unlockedHelpersExpiry: row.unlockedHelpersExpiry || 0,
          claimedRewards: JSON.parse(row.claimedRewards || '[]'),
          lastRenameAt: row.lastRenameAt || 0,
          pendingAvatar: row.pendingAvatar,
          avatarStatus: row.avatarStatus || 'approved',
          blockedSerials: JSON.parse(row.blockedSerials || '[]'),
          blockedFingerprints: JSON.parse(row.blockedFingerprints || '[]'),
          recentOpponents: JSON.parse(row.recentOpponents || '[]'),
          reportedSerials: JSON.parse(row.reportedSerials || '[]'),
          selectedFrame: row.selectedFrame || '',
          lastRainGiftResetDay: row.lastRainGiftResetDay || null,
          rainGiftTokens: row.rainGiftTokens || 0,
          rainGiftHelpers: JSON.parse(row.rainGiftHelpers || '{}'),
          notificationsEnabled: row.notificationsEnabled !== undefined ? row.notificationsEnabled : 0,
          lastSpinDate: row.lastSpinDate || null,
          dailySpinCount: row.dailySpinCount || 0,
          freeSpinUsed: row.freeSpinUsed || 0
        });
      });
      console.log(`Loaded ${allPlayers.size} players from SQLite.`);
    } catch (err) {
      console.error("Failed to load players data:", err);
    }
  }

  loadPlayersData();

  // Load Global Reward
  try {
    const rewardRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('global_reward') as any;
    if (rewardRow && rewardRow.value) {
      activeGlobalReward = JSON.parse(rewardRow.value);
      // Check if expired
      if (activeGlobalReward.expiresAt < Date.now()) {
        activeGlobalReward = null;
        db.prepare('DELETE FROM settings WHERE key = ?').run('global_reward');
      }
    }
  } catch (err) {
    console.error("Failed to load global reward:", err);
  }

  // Load Game Policies
  try {
    const termsArRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('terms_policy_ar') as any;
    if (termsArRow && termsArRow.value) gamePolicies.termsAr = termsArRow.value;
    
    const termsEnRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('terms_policy_en') as any;
    if (termsEnRow && termsEnRow.value) gamePolicies.termsEn = termsEnRow.value;
    
    const privacyArRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('privacy_policy_ar') as any;
    if (privacyArRow && privacyArRow.value) gamePolicies.privacyAr = privacyArRow.value;
    
    const privacyEnRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('privacy_policy_en') as any;
    if (privacyEnRow && privacyEnRow.value) gamePolicies.privacyEn = privacyEnRow.value;
    
    const rainGiftRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('is_rain_gift_enabled') as any;
    if (rainGiftRow && rainGiftRow.value !== undefined) gamePolicies.isRainGiftEnabled = rainGiftRow.value === 'true';
  } catch (err) {
    console.error("Failed to load game policies:", err);
  }

  // Load Theme Config
  let themeConfig = {
    bgBodyStart: '#FFD700',
    bgBodyEnd: '#FF8C00',
    textMain: '#000000',
    textLight: '#FFFFFF',
    borderGame: '#000000',
    bgBox: '#FFFFFF',
    bgCard: '#FFFFFF',
    btnPrimaryBgStart: '#FF3366',
    btnPrimaryBgEnd: '#FF0033',
    btnPrimaryBorder: '#000000',
    btnPrimaryHover: '#FF3366',
    btnSecondaryBgStart: '#00FFFF',
    btnSecondaryBgEnd: '#00CCCC',
    btnSecondaryBorder: '#000000',
    btnSecondaryHover: '#00FFFF',
    btnSuccessBgStart: '#00FF00',
    btnSuccessBgEnd: '#00CC00',
    btnSuccessBorder: '#000000',
    btnSuccessHover: '#00FF00',
    btnDangerBgStart: '#FFFF00',
    btnDangerBgEnd: '#CCCC00',
    btnDangerBorder: '#000000',
    btnDangerHover: '#FFFF00',
    accentOrange: '#FF3300',
    accentPurple: '#9900FF',
    accentBlue: '#0066FF',
    accentGreen: '#00AA00',
    shopHeaderStart: '#9900FF',
    shopHeaderEnd: '#6600CC',
    shopTokenText: '#000000',
    shopInfoTitle: '#000000',
    shopWarningTitle: '#FF0000',
    shopModalBg: '#FFFFFF',
    textMuted: '#333333',
    textLightAccent: '#666666',
    textSoft: '#999999',
    rank1BgStart: '#FFD700',
    rank1BgEnd: '#FFD700',
    rank1Border: '#000000',
    rank2BgStart: '#C0C0C0',
    rank2BgEnd: '#C0C0C0',
    rank2Border: '#000000',
    rank3BgStart: '#CD7F32',
    rank3BgEnd: '#CD7F32',
    rank3Border: '#000000',
    modalBg: '#FFFFFF',
    levelBarBg: '#FFFFFF',
    levelBarFill: '#0066FF',
    xpBarBg: '#FFFFFF',
    xpBarFill: '#FF6600',
    xpBarText: '#000000',
    xpBarTextActive: '#FFFFFF',
    reportBarBg: '#FFFFFF',
    reportBarLow: '#00FF00',
    reportBarMedium: '#FF6600',
    reportBarHigh: '#FF0000',
  };

  try {
    const savedTheme = db.prepare('SELECT value FROM settings WHERE key = ?').get('theme_config');
    if (savedTheme) {
      const parsedTheme = JSON.parse(savedTheme.value);
      // If the saved theme is the old default theme, ignore it and use the new comic theme
      if (parsedTheme.bgBodyStart === '#fbf4e1') {
        console.log("[Theme] Old default theme detected in database. Ignoring it to use the new comic theme.");
        db.prepare('DELETE FROM settings WHERE key = ?').run('theme_config');
      } else {
        themeConfig = { ...themeConfig, ...parsedTheme };
        console.log("[Theme] Loaded saved theme config.");
      }
    }
  } catch (e) {
    console.error("Failed to load theme config:", e);
  }

  let cachedTopPlayers: any[] = [];
  let topPlayersCacheTime = 0;

  function getTopPlayers(force = false) {
    const now = Date.now();
    if (force || now - topPlayersCacheTime > 60000) { // Cache for 1 minute unless forced
      cachedTopPlayers = Array.from(allPlayers.values())
        .filter(p => !p.isAdmin) // Exclude admins from leaderboard
        .sort((a, b) => {
          if (b.xp !== a.xp) return b.xp - a.xp;
          return (b.wins || 0) - (a.wins || 0);
        })
        .slice(0, 100)
        .map((p, i) => ({ 
          name: p.name,
          xp: p.xp,
          level: p.level,
          wins: p.wins,
          streak: p.streak || 0,
          avatar: p.avatar,
          selectedFrame: p.selectedFrame,
          gender: p.gender,
          isAdmin: p.isAdmin,
          serial: p.serial,
          isOnline: playerSockets.has(p.serial),
          rank: i + 1 
        }));
      topPlayersCacheTime = now;
    }
    return cachedTopPlayers;
  }

  // Optimized: Update leaderboard for all clients every 1 minute
  setInterval(() => {
    const topPlayers = getTopPlayers(true);
    io.emit("top_players_update", topPlayers);
  }, 60000);

  function invalidateTopPlayersCache() {
    topPlayersCacheTime = 0;
    io.emit("top_players_update", getTopPlayers(true));
  }

  let currentFakeBots = 15 + Math.floor(Math.random() * 20);

  // Update fake bots count gradually with random intervals
  function updateFakeBotsGradually() {
    const change = Math.floor(Math.random() * 9) - 3; // -3 to +5
    currentFakeBots += change;
    
    // Keep it within a reasonable range (e.g., 10 to 50)
    if (currentFakeBots < 10) currentFakeBots = 10;
    if (currentFakeBots > 50) currentFakeBots = 50;
    
    broadcastOnlineCount();
    
    const nextDelay = 30000 + Math.random() * 60000; // 30-90 seconds
    setTimeout(updateFakeBotsGradually, nextDelay);
  }
  updateFakeBotsGradually();

  function broadcastOnlineCount() {
    io.emit('online_count', { online: playerSockets.size + currentFakeBots, total: allPlayers.size + 50 });
  }

  app.get("/api/reports", (req, res) => {
    res.json(reportsList);
  });

  app.get("/api/admin/players", (req, res) => {
    res.json(Array.from(allPlayers.values()));
  });

  app.get("/api/admin/download-db", (req, res) => {
    const token = req.query.token as string;
    console.log(`[DB Download] Request received with token: ${token}`);
    console.log(`[DB Download] Current adminTokens: (DB backed)`);
    if (!token || !adminTokens.has(token)) {
      console.log(`[DB Download] Unauthorized. Token missing or invalid.`);
      return res.status(403).send("Unauthorized");
    }
    
    console.log(`[DB Download] Token valid. Sending file: ${dbPath}`);
    res.download(dbPath, 'players.db', (err) => {
      if (err) {
        console.error("Error downloading database:", err);
        if (!res.headersSent) {
          res.status(500).send("Error downloading database");
        }
      } else {
        console.log(`[DB Download] File sent successfully.`);
        // Remove token after use for security
        adminTokens.delete(token);
      }
    });
  });

  app.get("/api/admin/download-uploads", (req, res) => {
    const token = req.query.token as string;
    if (!token || !adminTokens.has(token)) {
      return res.status(403).send("Unauthorized");
    }

    const uploadsPath = path.join(__dirname, 'public/uploads');
    if (!fs.existsSync(uploadsPath)) {
      return res.status(404).send("Uploads folder not found");
    }

    res.attachment('uploads-backup.zip');
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    archive.on('error', (err) => {
      console.error("Error creating zip archive:", err);
      if (!res.headersSent) {
        res.status(500).send({ error: err.message });
      }
    });

    archive.pipe(res);
    archive.directory(uploadsPath, false);
    archive.finalize().then(() => {
      adminTokens.delete(token);
    });
  });

  app.post("/api/admin/upload-db", dbUpload.single('database'), (req, res) => {
    const token = req.query.token as string;
    console.log(`[DB Upload] Request received with token: ${token}`);
    if (!token || !adminTokens.has(token)) {
      console.log(`[DB Upload] Unauthorized. Token missing or invalid.`);
      return res.status(403).send("Unauthorized");
    }

    if (!req.file) {
      console.log(`[DB Upload] No file uploaded.`);
      return res.status(400).send("No file uploaded");
    }

    console.log(`[DB Upload] Token valid. Processing file: ${req.file.path}`);
    try {
      // 1. Close current DB connection
      console.log(`[DB Upload] Closing current database connection...`);
      db.close();

      // 2. Overwrite the actual DB file with the uploaded one
      console.log(`[DB Upload] Overwriting database file at ${dbPath}...`);
      fs.copyFileSync(req.file.path, dbPath);

      // 2.5 Delete WAL and SHM files if they exist to prevent corruption
      const walPath = `${dbPath}-wal`;
      const shmPath = `${dbPath}-shm`;
      if (fs.existsSync(walPath)) {
        console.log(`[DB Upload] Deleting old WAL file...`);
        fs.unlinkSync(walPath);
      }
      if (fs.existsSync(shmPath)) {
        console.log(`[DB Upload] Deleting old SHM file...`);
        fs.unlinkSync(shmPath);
      }

      // 3. Clean up temp file
      console.log(`[DB Upload] Cleaning up temporary file...`);
      fs.unlinkSync(req.file.path);

      // 4. Send success response
      console.log(`[DB Upload] Database replaced successfully. Restarting server...`);
      res.json({ success: true, message: "Database uploaded successfully. Server will restart." });

      // 5. Exit process to trigger restart
      setTimeout(() => {
        process.exit(0);
      }, 1000);

    } catch (err) {
      console.error("[DB Upload] Error uploading database:", err);
      if (!res.headersSent) {
        res.status(500).send("Error uploading database");
      }
    }
  });

  // Paymob Integration
  app.post("/api/paymob/initiate", async (req, res) => {
    try {
      const { itemId, playerSerial, paymentMethod, customerInfo, quantity = 1 } = req.body;
      const player = allPlayers.get(playerSerial);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const item = db.prepare('SELECT * FROM shop_items WHERE id = ? AND active = 1').get(itemId) as any;
      if (!item) return res.status(404).json({ error: "Item not found" });

      const getSetting = (key: string, defaultValue: string) => {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
        return row ? row.value : defaultValue;
      };

      const PAYMOB_API_KEY = getSetting('paymob_api_key', "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRFek9EazBNU3dpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS5ySGdYVGNEVmFpSkQ2bTktQ1lETzJzSEV1N3JqVjR1RkdpR2F2dHlZNEM4T0JicXFSYWF3NEFqVWdES1otQ25NOHd3aGtDZlVfVFk3UkRjNV9jZ3BUZw==");
      const WALLET_INTEGRATION_ID = getSetting('paymob_wallet_integration_id', "5579190");
      const CARD_INTEGRATION_ID = getSetting('paymob_card_integration_id', "5572379");
      const IFRAME_ID = getSetting('paymob_iframe_id', "1013400");

      const integrationId = paymentMethod === 'wallet' ? WALLET_INTEGRATION_ID : CARD_INTEGRATION_ID;

      // 1. Authentication
      const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: PAYMOB_API_KEY })
      });
      const authData = await authRes.json();
      const authToken = authData.token;

      // 2. Order Registration
      const amountCents = Math.round(item.price * 100) * quantity;
      const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: authToken,
          delivery_needed: "false",
          amount_cents: amountCents,
          currency: "EGP",
          items: [{
            name: item.name,
            amount_cents: Math.round(item.price * 100),
            description: item.description,
            quantity: quantity.toString()
          }]
        })
      });
      const orderData = await orderRes.json();
      const orderId = orderData.id;

      // 3. Payment Key Request
      const paymentKeyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: authToken,
          amount_cents: amountCents,
          expiration: 3600,
          order_id: orderId,
          billing_data: {
            apartment: "NA", 
            email: customerInfo?.email || player.email || "test@test.com", 
            floor: "NA", 
            first_name: customerInfo?.name || player.name,
            street: "NA", 
            building: "NA", 
            phone_number: customerInfo?.phone || "01000000000", 
            shipping_method: "NA",
            postal_code: "NA", 
            city: "NA", 
            country: "EG", 
            last_name: player.serial, 
            state: "NA"
          },
          currency: "EGP",
          integration_id: integrationId
        })
      });
      const paymentKeyData = await paymentKeyRes.json();
      const paymentToken = paymentKeyData.token;

      // Save order info to verify later
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(`order_${orderId}`, JSON.stringify({ playerSerial, itemId, quantity }));

      if (paymentMethod === 'wallet') {
        // 4. Pay with Wallet
        const walletRes = await fetch('https://accept.paymob.com/api/acceptance/payments/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: {
              identifier: customerInfo?.phone,
              subtype: "WALLET"
            },
            payment_token: paymentToken
          })
        });
        const walletData = await walletRes.json();
        if (walletData.redirect_url) {
          res.json({ redirectUrl: walletData.redirect_url });
        } else {
          res.status(500).json({ error: "فشل في إنشاء رابط الدفع للمحفظة" });
        }
      } else {
        // 4. Pay with Card (Iframe redirect)
        res.json({ redirectUrl: `https://accept.paymob.com/api/acceptance/iframes/${IFRAME_ID}?payment_token=${paymentToken}` });
      }

    } catch (err) {
      console.error("Paymob initiate error:", err);
      res.status(500).json({ error: "Payment initiation failed" });
    }
  });

  app.post("/api/paymob/webhook", (req, res) => {
    try {
      const hmac = req.query.hmac as string;
      const { obj } = req.body;
      
      const getSetting = (key: string, defaultValue: string) => {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
        return row ? row.value : defaultValue;
      };
      const PAYMOB_HMAC = getSetting('paymob_hmac', "A2DBAF7F92579F5B6CE8687D60BE29BA");

      if (obj && hmac) {
        // Calculate HMAC
        const hmacString = [
          obj.amount_cents,
          obj.created_at,
          obj.currency,
          obj.error_occured,
          obj.has_parent_transaction,
          obj.id,
          obj.integration_id,
          obj.is_3d_secure,
          obj.is_auth,
          obj.is_capture,
          obj.is_refunded,
          obj.is_standalone_payment,
          obj.is_voided,
          obj.order.id,
          obj.owner,
          obj.pending,
          obj.source_data.pan,
          obj.source_data.sub_type,
          obj.source_data.type,
          obj.success
        ].join('');

        const calculatedHmac = crypto.createHmac('sha512', PAYMOB_HMAC).update(hmacString).digest('hex');

        if (calculatedHmac !== hmac) {
          console.error("Paymob Webhook: Invalid HMAC signature");
          return res.status(401).send("Unauthorized");
        }
      }

      if (obj && obj.success === true) {
        const orderId = obj.order.id;
        const orderInfoRow = db.prepare('SELECT value FROM settings WHERE key = ?').get(`order_${orderId}`) as any;
        
        if (orderInfoRow) {
          const orderInfo = JSON.parse(orderInfoRow.value);
          const player = allPlayers.get(orderInfo.playerSerial);
          const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(orderInfo.itemId) as any;

          if (player && item) {
            if (item.type === 'tokens' || item.type.startsWith('token_pack')) {
              const qty = orderInfo.quantity || 1;
              const addedTokens = (item.amount || 1) * qty;
              player.tokens = (player.tokens || 0) + addedTokens;
              savePlayerData(player.serial);
              
              // Notify the player
              const socketId = playerSockets.get(player.serial);
              if (socketId) {
                io.to(socketId).emit('player_update', player);
                io.to(socketId).emit('show_alert', { message: `تم إضافة ${addedTokens} Tokens بنجاح!`, title: 'عملية ناجحة' });
              }
            } else if (item.type === 'pro_pack') {
              const days = item.amount > 0 ? item.amount : 30;
              const ms = days * 24 * 60 * 60 * 1000;
              player.proPackageExpiry = Date.now() + ms;
              savePlayerData(player.serial);

              // Notify the player
              const socketId = playerSockets.get(player.serial);
              if (socketId) {
                io.to(socketId).emit('player_update', player);
                io.to(socketId).emit('show_alert', { message: `تم تفعيل باقة المحترفين (${days} يوم) بنجاح!`, title: 'عملية ناجحة' });
              }
            }
          }
        }
      }
      res.status(200).send("OK");
    } catch (err) {
      console.error("Paymob webhook error:", err);
      res.status(500).send("Error");
    }
  });

  const contactIps = new Map<string, number>();

  app.post("/api/contact", (req, res) => {
    try {
      const { playerSerial, name, subject, message } = req.body;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      if (!name || !subject || !message) {
        return res.status(400).json({ error: "Missing fields" });
      }

      if (playerSerial) {
        const player = allPlayers.get(playerSerial);
        if (player) {
          if (player.lastContactAt && isSameDay(player.lastContactAt, Date.now())) {
            return res.status(429).json({ error: "لقد قمت بإرسال رسالة اليوم بالفعل." });
          }
          player.lastContactAt = Date.now();
          savePlayerData(playerSerial);
        }
      } else {
        const lastContact = contactIps.get(ip);
        if (lastContact && isSameDay(lastContact, Date.now())) {
          return res.status(429).json({ error: "لقد قمت بإرسال رسالة اليوم بالفعل." });
        }
        contactIps.set(ip, Date.now());
      }

      db.prepare('INSERT INTO contacts (playerSerial, name, subject, message) VALUES (?, ?, ?, ?)').run(playerSerial || null, name, subject, message);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving contact message:", error);
      res.status(500).json({ error: "Failed to save message" });
    }
  });

  app.get("/api/categories", (req, res) => {
    try {
      const categories = db.prepare(`
        SELECT c.id, c.name, c.icon, c.timestamp, MAX(i.timestamp) as latestImageTimestamp
        FROM categories c
        LEFT JOIN custom_images i ON c.id = i.category
        GROUP BY c.id
        ORDER BY c.timestamp ASC
      `).all();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/collection/:serial", (req, res) => {
    try {
      const { serial } = req.params;
      const collection = db.prepare("SELECT * FROM player_collections WHERE player_serial = ?").all(serial);
      const claimed = db.prepare("SELECT * FROM claimed_collection_rewards WHERE player_serial = ?").all(serial);
      res.json({ collection, claimed });
    } catch (error) {
      console.error("Error fetching collection:", error);
      res.status(500).json({ error: "Failed to fetch collection" });
    }
  });

  app.post("/api/admin/categories", (req, res) => {
    try {
      const { name, icon } = req.body;
      if (!name || !icon) {
        return res.status(400).json({ error: "Missing fields" });
      }
      const id = Math.random().toString(36).substring(2, 15);
      db.prepare('INSERT INTO categories (id, name, icon, timestamp) VALUES (?, ?, ?, ?)').run(id, name, icon, Date.now());
      res.json({ success: true, id, name, icon });
    } catch (error) {
      console.error("Error adding category:", error);
      res.status(500).json({ error: "Failed to add category" });
    }
  });

  app.delete("/api/admin/categories/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      // Also delete images in this category
      db.prepare('DELETE FROM custom_images WHERE category = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  app.get("/api/admin/images", (req, res) => {
    try {
      const images = db.prepare('SELECT id, category, name, data, timestamp, addedBy FROM custom_images ORDER BY timestamp DESC').all();
      console.log(`[API] Fetching images, found: ${images.length}`);
      res.json(images);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.post("/api/admin/images", (req, res) => {
    try {
      const { category, name, data, addedBy } = req.body;
      if (!category || !name || !data) {
        return res.status(400).json({ error: "Missing fields" });
      }
      const id = Math.random().toString(36).substring(2, 15);
      db.prepare('INSERT INTO custom_images (id, category, name, data, addedBy, timestamp) VALUES (?, ?, ?, ?, ?, ?)').run(id, category, name, data, addedBy || 'admin', Date.now());
      io.emit('categories_updated');
      res.json({ success: true, id });
    } catch (error) {
      console.error("Error adding image:", error);
      res.status(500).json({ error: "Failed to add image" });
    }
  });

  app.delete("/api/admin/images/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM custom_images WHERE id = ?').run(id);
      io.emit('categories_updated');
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  function isBlocked(p1: any, p2: any) {
    const now = Date.now();
    const b1 = blocks.get(p1.playerId) || [];
    const b2 = blocks.get(p2.playerId) || [];
    
    // Clean up expired blocks
    if (b1.length > 0) blocks.set(p1.playerId, b1.filter(b => b.expiresAt > now));
    if (b2.length > 0) blocks.set(p2.playerId, b2.filter(b => b.expiresAt > now));

    const hasTemporaryBlock = b1.some(b => b.blockedId === p2.playerId && b.expiresAt > now) ||
                              b2.some(b => b.blockedId === p1.playerId && b.expiresAt > now);
                              
    if (hasTemporaryBlock) return true;
    
    // Check persistent blocks
    const serverP1 = allPlayers.get(p1.serial);
    const serverP2 = allPlayers.get(p2.serial);
    
    if (serverP1) {
      if (serverP1.blockedSerials?.includes(p2.serial)) return true;
      if (serverP2?.fingerprint && serverP1.blockedFingerprints?.includes(serverP2.fingerprint)) return true;
    }
    
    if (serverP2) {
      if (serverP2.blockedSerials?.includes(p1.serial)) return true;
      if (serverP1?.fingerprint && serverP2.blockedFingerprints?.includes(serverP1.fingerprint)) return true;
    }

    return false;
  }

  function processQueue() {
    const now = Date.now();
    
    // Filter out players who are no longer searching or disconnected
    const availablePlayers = matchmakingQueue.filter(p => 
      p.status === 'searching' && 
      p.socket.connected
    );

    if (availablePlayers.length < 2) {
      // Check if a human player is waiting for more than 5 seconds
      if (configCache.aiBotEnabled && availablePlayers.length === 1 && Date.now() - availablePlayers[0].joinedAt > 5000) {
        const botPersona = BOT_PERSONAS[Math.floor(Math.random() * BOT_PERSONAS.length)];
        
        // Calculate avatar based on level
        let botAvatar = botPersona.avatar;
        if (botPersona.level >= 10) {
          const levelMilestone = Math.floor(botPersona.level / 10) * 10;
          botAvatar = `avatar-lvl-${botPersona.gender}-${levelMilestone}.png`;
        } else {
          botAvatar = `avatar-free-${botPersona.gender}-01.png`;
        }

        const bot = {
          id: 'bot_' + Date.now(),
          playerId: 'bot_' + Date.now(),
          playerName: botPersona.name,
          avatar: botAvatar,
          age: botPersona.age,
          xp: (botPersona.level - 1) * (botPersona.level - 1) * 50,
          streak: 0,
          wins: 0,
          serial: 'bot_' + Date.now(),
          joinedAt: Date.now(),
          status: 'searching',
          isBot: true,
          socket: {
            connected: true,
            emit: (event: string, data: any) => {
              console.log(`[Bot ${botPersona.name}] Received event ${event}:`, data);
            }
          }
        };
        matchmakingQueue.push(bot);
      }
      return;
    }

    // Sort by joinedAt to be fair
    availablePlayers.sort((a, b) => a.joinedAt - b.joinedAt);

    const matchedIndices = new Set<number>();

    for (let i = 0; i < availablePlayers.length; i++) {
      if (matchedIndices.has(i)) continue;
      
      for (let j = i + 1; j < availablePlayers.length; j++) {
        if (matchedIndices.has(j)) continue;

        const p1 = availablePlayers[i];
        const p2 = availablePlayers[j];

        // Check if blocked
        if (isBlocked(p1, p2)) continue;

        // Check token constraints
        const p1Level = getLevel(p1.xp);
        const p2Level = getLevel(p2.xp);
        if (p1.useToken && p2Level < 40) continue;
        if (p2.useToken && p1Level < 40) continue;

        // Check if temporarily skipped (10 seconds cooldown)
        const p1SkippedP2 = p1.skipped?.get(p2.playerId);
        const p2SkippedP1 = p2.skipped?.get(p1.playerId);

        if (p1SkippedP2 && now < p1SkippedP2) continue;
        if (p2SkippedP1 && now < p2SkippedP1) continue;

        // Match found!
        matchedIndices.add(i);
        matchedIndices.add(j);

        p1.status = 'proposing';
        p2.status = 'proposing';

        const matchId = `match_${Math.random().toString(36).substr(2, 9)}`;
        
        const timeoutId = setTimeout(() => {
          const match = pendingMatches.get(matchId);
          if (match) {
            pendingMatches.delete(matchId);
            
            // Handle timeout
            [match.p1, match.p2].forEach(p => {
              if (p.isBot) return;
              p.status = 'searching';
              p.socket.emit("match_rejected", { reason: 'timeout' });
              
              // Add to skipped list against the other
              const other = p === match.p1 ? match.p2 : match.p1;
              if (!p.skipped) p.skipped = new Map();
              p.skipped.set(other.playerId, Date.now() + 10000);

              // Put back in queue
              matchmakingQueue.push(p);
            });
            processQueue();
          }
        }, 12000); // 12 seconds total (10 for client + 2 buffer)

        pendingMatches.set(matchId, {
          id: matchId,
          p1,
          p2,
          p1Response: null,
          p2Response: null,
          timeoutId,
          createdAt: now
        });

        p1.socket.emit("match_proposed", {
          matchId,
          opponent: { name: p2.playerName, avatar: p2.avatar, selectedFrame: p2.selectedFrame || '', age: p2.age, level: getLevel(p2.xp || 0) }
        });
        p2.socket.emit("match_proposed", {
          matchId,
          opponent: { name: p1.playerName, avatar: p1.avatar, selectedFrame: p1.selectedFrame || '', age: p1.age, level: getLevel(p1.xp || 0) }
        });

        break; // Found a match for p1, move to next available player
      }
    }

    // Remove matched players from the main queue
    for (let i = matchmakingQueue.length - 1; i >= 0; i--) {
      if (matchmakingQueue[i].status === 'proposing') {
        matchmakingQueue.splice(i, 1);
      }
    }
  }

  function finalizeMatch(matchId: string) {
    const match = pendingMatches.get(matchId);
    if (!match) return;
    if (match.p1Response !== 'accept' || match.p2Response !== 'accept') {
      console.log(`[Matchmaking] Cannot finalize match ${matchId}. p1Response: ${match.p1Response}, p2Response: ${match.p2Response}`);
      return;
    }

    console.log(`[Matchmaking] Both players accepted match ${matchId}. Finalizing...`);
    clearTimeout(match.timeoutId);
    pendingMatches.delete(matchId);
    
    const roomId = `random_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[Matchmaking] Room created: ${roomId} for match ${matchId}`);
    
    match.p1.socket.join(roomId);
    if (match.p1.socket.data) match.p1.socket.data.isSearching = false;
    
    // Update bot socket to use roomId instead of matchId
    if (match.p2.isBot) {
      console.log(`[Matchmaking] Setting up bot for room ${roomId}`);
      match.p2.socket.emit = (event: string, data: any) => {
        handleBotEvent(roomId, event, data);
      };
    } else {
      match.p2.socket.join(roomId);
      if (match.p2.socket.data) match.p2.socket.data.isSearching = false;
    }

    const p1ServerPlayer = allPlayers.get(match.p1.serial);
    const p2ServerPlayer = match.p2.isBot ? null : allPlayers.get(match.p2.serial);

    const room = {
      id: roomId,
      players: [
        {
          id: match.p1.socket.id,
          playerId: match.p1.playerId,
          serial: match.p1.serial,
          name: match.p1.playerName,
          age: match.p1.age,
          avatar: match.p1.avatar,
          selectedFrame: match.p1.selectedFrame || '',
          score: 1000,
          targetImage: null,
          isMuted: false,
          hasGuessed: false,
          selectedCategory: null,
          hintCount: 0,
          quickGuessUsed: false,
          wordLengthUsed: false,
          timeFreezeUsed: false,
          wordCountUsed: false,
          spyLensUsed: false,
          reported: false,
          xp: match.p1.xp || 0,
          level: getLevel(match.p1.xp || 0),
          streak: match.p1.streak || 0,
          wins: match.p1.wins || 0,
          reports: p1ServerPlayer ? p1ServerPlayer.reports : 0,
          reportedBy: p1ServerPlayer ? p1ServerPlayer.reportedBy : [],
          useToken: match.p1.useToken,
          profanityCount: 0,
          helpersUsedCount: 0,
          ownedHelpers: match.p1.ownedHelpers || {},
          isAdmin: !!p1ServerPlayer?.isAdmin
        },
        {
          id: match.p2.socket.id,
          playerId: match.p2.playerId,
          serial: match.p2.serial || 'bot_serial',
          name: match.p2.playerName,
          age: match.p2.age,
          avatar: match.p2.avatar,
          selectedFrame: match.p2.selectedFrame || '',
          score: 1000,
          targetImage: null,
          isMuted: false,
          hasGuessed: false,
          selectedCategory: null,
          hintCount: 0,
          quickGuessUsed: false,
          wordLengthUsed: false,
          timeFreezeUsed: false,
          wordCountUsed: false,
          spyLensUsed: false,
          reported: false,
          xp: match.p2.xp || 0,
          level: getLevel(match.p2.xp || 0),
          streak: match.p2.streak || 0,
          wins: match.p2.wins || 0,
          reports: p2ServerPlayer ? p2ServerPlayer.reports : 0,
          reportedBy: p2ServerPlayer ? p2ServerPlayer.reportedBy : [],
          isBot: match.p2.isBot,
          persona: match.p2.persona,
          useToken: match.p2.useToken,
          profanityCount: 0,
          helpersUsedCount: 0,
          ownedHelpers: match.p2.ownedHelpers || {},
          isAdmin: !!p2ServerPlayer?.isAdmin
        }
      ],
      gameState: "waiting",
      timer: 60,
      category: "people",
      isPaused: false,
      pausingPlayerId: null,
      quickGuessTimer: 0,
      adCooldownTimer: 0,
    };

    rooms.set(roomId, room);
    startWaitingInterval(roomId);
    
    // Emit directly to sockets to avoid race condition with join()
    match.p1.socket.emit("room_update", room);
    match.p1.socket.emit("random_match_found", { roomId });
    
    if (!match.p2.isBot) {
      match.p2.socket.emit("room_update", room);
      match.p2.socket.emit("random_match_found", { roomId });
    }

    // Also emit to room for any other listeners (like spectators if they existed)
    io.to(roomId).emit("room_update", room);
    io.to(roomId).emit("random_match_found", { roomId });
    
    if (match.p2.isBot) {
      handleBotEvent(roomId, 'room_update', room);
    }
  }

  function checkBotMatchmaking() {
    const configPath = path.join(__dirname, 'public/uploads/config.json');
    let aiBotEnabled = false;
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        aiBotEnabled = !!config.aiBotEnabled;
      } catch (e) {}
    }

    if (!aiBotEnabled) return;

    const now = Date.now();
    // Requirement 5: Only add bot if a human is searching
    const humanSearching = matchmakingQueue.find(p => !p.isBot && p.status === 'searching');
    if (!humanSearching) return;

    for (let i = 0; i < matchmakingQueue.length; i++) {
      const p = matchmakingQueue[i];
      if (p.isBot || p.status !== 'searching') continue;
      
      // If player has been waiting for more than 10 seconds
      if (p.joinedAt && now - p.joinedAt > 10000 && !p.useToken) {
        // Create a bot match
        p.status = 'proposing';
        matchmakingQueue.splice(i, 1);
        
        const botPersona = BOT_PERSONAS[Math.floor(Math.random() * BOT_PERSONAS.length)];
        const matchId = `match_bot_${Math.random().toString(36).substr(2, 9)}`;
        
        // Requirement 4: Bot avatar based on level
        let botAvatar = botPersona.avatar;
        if (botPersona.level >= 10) {
          const levelMilestone = Math.floor(botPersona.level / 10) * 10;
          botAvatar = `avatar-lvl-${botPersona.gender}-${levelMilestone}.png`;
        } else {
          botAvatar = `avatar-free-${botPersona.gender}-01.png`;
        }

        const botPlayer = {
          playerId: `bot_${Math.random().toString(36).substr(2, 9)}`,
          playerName: botPersona.name,
          avatar: botAvatar,
          age: botPersona.age,
          gender: botPersona.gender,
          xp: (botPersona.level - 1) * (botPersona.level - 1) * 50,
          isBot: true,
          persona: botPersona.personality,
          selectedFrame: '',
          socket: {
            id: `bot_socket_${Math.random().toString(36).substr(2, 9)}`,
            emit: (event: string, data: any) => {
              handleBotEvent(matchId, event, data);
            }
          }
        };

        pendingMatches.set(matchId, {
          id: matchId,
          p1: p,
          p2: botPlayer,
          p1Response: null,
          p2Response: null,
          timeoutId: setTimeout(() => {
            const match = pendingMatches.get(matchId);
            if (match && match.p1Response !== 'accept') {
              pendingMatches.delete(matchId);
              match.p1.status = 'searching';
              match.p1.socket.emit("match_rejected", { reason: 'timeout' });
              matchmakingQueue.push(match.p1);
            }
          }, 12000)
        });

        p.socket.emit("match_proposed", {
          matchId,
          opponent: { name: botPlayer.playerName, avatar: botPlayer.avatar, selectedFrame: botPlayer.selectedFrame || '', age: botPlayer.age, level: botPersona.level },
          opponentAccepted: false
        });
        
        console.log(`[Bot Matchmaking] Proposed match ${matchId} between human ${p.playerName} and bot ${botPlayer.playerName}`);

        break;
      }
    }
  }

  // setInterval(checkBotMatchmaking, 5000);

  const botConversations = new Map<string, any[]>();
  const botFlags = new Map<string, boolean>();
  const botIntervals = new Map<string, NodeJS.Timeout>();
  const botTimeouts = new Map<string, NodeJS.Timeout>();
  const playerBotHistory = new Map<string, number>();

  async function triggerBotQuestion(roomId: string, bot: any) {
    const currentRoom = rooms.get(roomId);
    if (!currentRoom || currentRoom.gameState !== 'discussion') return;
    
    // Only ask if it's the bot's turn
    if (currentRoom.currentTurn !== bot.id) return;

    // Bot watching ad logic (10% chance if level >= 10)
    if (bot.level >= 10 && Math.random() < 0.1) {
      const helpers = ['word_length', 'word_count', 'time_freeze', 'hint', 'spy_lens'];
      const randomHelper = helpers[Math.floor(Math.random() * helpers.length)];
      const helperNames: Record<string, string> = {
        'word_length': 'كاشف الحروف',
        'word_count': 'عدد الكلمات',
        'time_freeze': 'تجميد الوقت',
        'hint': 'تلميح',
        'spy_lens': 'الجاسوس'
      };
      
      const verb = (bot.gender === 'girl' || bot.gender === 'female') ? 'تقوم' : 'يقوم';
      io.to(roomId).emit("chat_bubble", { 
        senderId: "system", 
        text: `${verb} ${bot.playerName} بمشاهدة إعلان لفتح وسيلة مساعدة "${helperNames[randomHelper]}"، انتظر قليلاً.` 
      });

      // Wait for ad to finish
      await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 3000));
      
      // Re-fetch room state after waiting
      const updatedRoom = rooms.get(roomId);
      if (!updatedRoom || updatedRoom.gameState !== 'discussion' || updatedRoom.currentTurn !== bot.id) return;
    }

    try {
      const player = currentRoom.players.find((p: any) => !p.isBot);
      const botPersona = BOT_PERSONAS.find(p => p.name === bot.playerName);
      
      // Bot Quick Guess Logic
      const winCount = playerBotHistory.get(player.playerId) || 0;
      if (winCount > 0 && Math.random() < 0.15) { // 15% chance to attempt quick guess if played before
        const confirmedAnswersCount = currentRoom.confirmedAnswers ? currentRoom.confirmedAnswers.length : 0;
        
        currentRoom.isPaused = true;
        currentRoom.pausingPlayerId = bot.id;
        currentRoom.quickGuessTimer = 15;
        io.to(roomId).emit("room_update", currentRoom);
        io.to(roomId).emit("quick_guess_started", { playerId: bot.id });
        
        // Wait a bit to simulate thinking
        await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
        
        const updatedRoom = rooms.get(roomId);
        if (!updatedRoom || updatedRoom.gameState !== 'discussion') return;

        let isCorrect = false;
        let guess = "";
        
        if (confirmedAnswersCount >= 3) {
          isCorrect = true;
          guess = bot.targetImage.name || bot.targetImage;
        } else {
          // Guess wrong
          const categoryImages = getCategoryImages(currentRoom.category);
          const wrongImages = categoryImages.filter(img => img !== bot.targetImage);
          guess = wrongImages[Math.floor(Math.random() * wrongImages.length)]?.name || "مش عارف";
        }
        
        updatedRoom.isPaused = false;
        updatedRoom.pausingPlayerId = null;
        io.to(roomId).emit("room_update", updatedRoom);

        if (isCorrect) {
          io.to(roomId).emit("guess_result", { playerId: bot.id, correct: true });
          endGame(roomId, bot.playerName, false, true);
        } else {
          io.to(roomId).emit("guess_result", { playerId: bot.id, correct: false });
          endGame(roomId, player.name);
        }
        return;
      }

      const configPath = path.join(__dirname, 'public/uploads/config.json');
      let questions: string[] = [];
      let isAskingBranch = false;
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          if (config.quickChat) {
            const catKey = `qc_${currentRoom.category}`;
            const categoryNode = config.quickChat.find((qc: any) => 
              qc.id === catKey || 
              qc.id === currentRoom.category || 
              qc.text === currentRoom.category ||
              normalizeEgyptian(qc.text) === normalizeEgyptian(currentRoom.category) ||
              (qc.id === 'qc_animals' && (currentRoom.category === 'حيوانات' || currentRoom.category === 'animals')) ||
              (qc.id === 'qc_food' && (currentRoom.category === 'أكلات' || currentRoom.category === 'food')) ||
              (qc.id === 'qc_people' && (currentRoom.category === 'اشخاص' || currentRoom.category === 'people')) ||
              (qc.id === 'qc_objects' && (currentRoom.category === 'جماد' || currentRoom.category === 'objects')) ||
              (qc.id === 'qc_plants' && (currentRoom.category === 'نبات' || currentRoom.category === 'plants')) ||
              (qc.id === 'qc_birds' && (currentRoom.category === 'طيور' || currentRoom.category === 'birds')) ||
              (qc.id === 'qc_insects' && (currentRoom.category === 'حشرات' || currentRoom.category === 'insects')) ||
              (qc.id === 'qc_football' && (currentRoom.category === 'كرة القدم' || currentRoom.category === 'football'))
            );
            console.log(`[BotQuestion] Room: ${roomId}, Category: ${currentRoom.category}, NodeFound: ${!!categoryNode}`);
            
            if (categoryNode && categoryNode.children) {
              console.log(`[BotQuestion] Room: ${roomId}, ChildrenCount: ${categoryNode.children.length}`);
              if (categoryNode.children.length > 0) {
                console.log(`[BotQuestion] FirstChild: ${JSON.stringify(categoryNode.children[0].text)}, HasChildren: ${!!categoryNode.children[0].children}`);
              }
              
              // Identify branches (nodes with children) and leaves (nodes without children)
              const branches = categoryNode.children.filter((c: any) => c.children && c.children.length > 0);
              const topLevelLeaves = categoryNode.children.filter((c: any) => !c.children || c.children.length === 0);
              
              console.log(`[BotQuestion] Room: ${roomId}, Branches: ${branches.length}, TopLevelLeaves: ${topLevelLeaves.length}`);
              
              const chatHistory = currentRoom.chatHistory || [];
              const askedQuestionTexts = new Set<string>();
              const rejectedBranchTexts = new Set<string>();
              let confirmedBranch = null;

              const normalize = (t: string) => normalizeEgyptian(t);

              for (let i = 0; i < chatHistory.length; i++) {
                const msg = chatHistory[i];
                let text = msg.text.trim();
                if (text === 'اه') text = 'آه';
                if (text === 'لا') text = 'لأ';
                const normText = normalize(text);
                
                if (text === 'آه' || text === 'لأ') continue;
                
                // Only track questions asked by the bot to guess the player's image
                if (msg.senderId === bot.id) {
                  askedQuestionTexts.add(normText);
                  
                  // Check if this was a branch question
                  const branch = branches.find((b: any) => 
                    normText === normalize(b.text)
                  );
                  
                  if (branch && i < chatHistory.length - 1) {
                    const answerMsg = chatHistory[i+1];
                    // The answer should be from the player
                    if (answerMsg.senderId !== bot.id) {
                      let answer = answerMsg.text.trim();
                      if (answer === 'اه') answer = 'آه';
                      if (answer === 'لا') answer = 'لأ';
                      
                      if (answer === 'آه') {
                        confirmedBranch = branch;
                      } else if (answer === 'لأ') {
                        rejectedBranchTexts.add(normalize(branch.text));
                        
                        // INFERENCE LOGIC: If there are exactly 2 branches, confirm the other one
                        if (branches.length === 2) {
                          const otherBranch = branches.find((b: any) => b.text !== branch.text);
                          if (otherBranch) {
                            confirmedBranch = otherBranch;
                            console.log(`[BotQuestion] Inferred Branch: ${confirmedBranch.text} because ${branch.text} was rejected.`);
                          }
                        }
                      }
                    }
                  }
                }
              }

              if (confirmedBranch) {
                console.log(`[BotQuestion] Room: ${roomId}, ConfirmedBranch: ${confirmedBranch.text}`);
                // We have a confirmed branch, ask questions from it
                confirmedBranch.children.forEach((q: any) => {
                  if (!askedQuestionTexts.has(normalize(q.text))) {
                    questions.push(q.text);
                  }
                });
                // If all questions in branch are asked, fallback to top-level leaves
                if (questions.length === 0) {
                  topLevelLeaves.forEach((l: any) => {
                    if (!askedQuestionTexts.has(normalize(l.text))) {
                      questions.push(l.text);
                    }
                  });
                }
              } else {
                // No branch confirmed yet, prioritize unasked branches
                const unaskedBranches = branches.filter((b: any) => 
                  !askedQuestionTexts.has(normalize(b.text)) && 
                  !rejectedBranchTexts.has(normalize(b.text))
                );
                
                console.log(`[BotQuestion] Room: ${roomId}, UnaskedBranches: ${unaskedBranches.length}`);
                
                if (unaskedBranches.length > 0) {
                  // MANDATORY: Ask branches first!
                  unaskedBranches.forEach((b: any) => questions.push(b.text));
                  isAskingBranch = true; // Flag that we are asking a branch
                } else {
                  // All branches asked/rejected or no branches exist, use all leaves
                  const allPossibleLeaves: string[] = [];
                  topLevelLeaves.forEach((l: any) => allPossibleLeaves.push(l.text));
                  
                  // Also include leaves from branches that weren't explicitly rejected
                  branches.forEach((b: any) => {
                    if (!rejectedBranchTexts.has(normalize(b.text))) {
                      b.children.forEach((c: any) => allPossibleLeaves.push(c.text));
                    }
                  });
                  
                  allPossibleLeaves.forEach(qText => {
                    if (!askedQuestionTexts.has(normalize(qText))) {
                      questions.push(qText);
                    }
                  });
                }
              }
              
              console.log(`[BotQuestion] Room: ${roomId}, FinalQuestionsCount: ${questions.length}`);
            }
          }
        } catch (e) {
          console.error("Config Parsing Error in triggerBotQuestion:", e);
        }
      }

      const categoryImages = getCategoryImages(currentRoom.category);
      const categoryImageNames = categoryImages.map((img: any) => img.name).join('، ');

      // Pick a question without AI
      let botReply = "";
      if (questions.length > 0) {
        botReply = questions[Math.floor(Math.random() * questions.length)];
      } else {
        // Fallback if no questions are available
        // Pass the turn to the human player
        currentRoom.currentTurn = player.id;
        currentRoom.waitingForAnswerFrom = null;
        io.to(roomId).emit("room_update", currentRoom);
        return;
      }
      
      console.log(`[BotQuestion] Room: ${roomId}, BotSelected (Deterministic): ${botReply}`);
      
      const chatHistory = botConversations.get(roomId) || [];
      chatHistory.push({ role: 'model', parts: [{ text: botReply }] });
      botConversations.set(roomId, chatHistory);

      // Simulate changing questions if it's not a branch question (30% chance)
      if (!isAskingBranch && Math.random() < 0.3) {
        io.to(roomId).emit("opponent_typing");
        setTimeout(() => {
          io.to(roomId).emit("opponent_stop_typing");
          handleBotChat(roomId, bot, botReply);
        }, 2000 + Math.random() * 2000);
      } else {
        handleBotChat(roomId, bot, botReply);
      }

    } catch (error) {
      console.error("Bot Questioning Error:", error);
    }
  }

  function startBotQuestioning(roomId: string) {
    const room = rooms.get(roomId);
    if (!room || room.gameState !== 'discussion') return;

    const bot = room.players.find((p: any) => p.isBot);
    if (!bot) return;

    if (botIntervals.has(roomId)) clearInterval(botIntervals.get(roomId));

    // If it's the bot's turn at the start, ask immediately
    if (room.currentTurn === bot.id) {
      setTimeout(() => {
        triggerBotQuestion(roomId, bot);
      }, 3000 + Math.random() * 2000);
    }
  }

  function handleBotChat(roomId: string, bot: any, text: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    const messageObj = { senderId: bot.id, text: text };
    if (!room.chatHistory) room.chatHistory = [];
    room.chatHistory.push({ ...messageObj, senderName: bot.playerName, timestamp: Date.now() });
    io.to(roomId).emit("chat_bubble", messageObj);

    // Turn logic (Requirement 7)
    if (room.gameState === 'discussion') {
      const opponent = room.players.find((p: any) => p.id !== bot.id);
      if (text.startsWith('آه') || text.startsWith('لأ')) {
        // Answered, turn goes to the one who answered
        room.currentTurn = bot.id;
        room.waitingForAnswerFrom = null;
      } else {
        // Asked a question, waiting for answer
        room.currentTurn = null;
        room.waitingForAnswerFrom = opponent?.id || null;
      }
      io.to(roomId).emit("room_update", room);
    }
  }

  function startBotGuessing(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    const bot = room.players.find((p: any) => p.isBot);
    if (!bot) return;

    const player = room.players.find((p: any) => !p.isBot);
    if (!player) return;

    setTimeout(async () => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom || currentRoom.gameState !== 'guessing') return;

      const currentBot = currentRoom.players.find((p: any) => p.isBot);
      const currentPlayer = currentRoom.players.find((p: any) => !p.isBot);
      if (!currentBot || !currentPlayer) return;

      // The bot is trying to guess its OWN hidden image (which is visible to the human)
      const targetImage = currentBot.targetImage;
      const winCount = playerBotHistory.get(currentPlayer.playerId) || 0;
      
      // More random win logic instead of strictly every 4th match
      let shouldWin = false;
      if (winCount > 0) {
        // The more matches played, the higher the chance of the bot winning
        const winChance = Math.min(0.2 + (winCount * 0.1), 0.6); // 30% to 60% max
        shouldWin = Math.random() < winChance;
      }
      
      playerBotHistory.set(player.playerId, winCount + 1);

      let guess = targetImage;
      if (!shouldWin) {
        const categoryImages = getCategoryImages(currentRoom.category);
        const wrongImages = categoryImages.filter(img => img !== targetImage);
        guess = wrongImages[Math.floor(Math.random() * wrongImages.length)] || "مش عارف";
      }

      bot.hasGuessed = true;
      const correct = guess === targetImage;
      io.to(roomId).emit("guess_result", { playerId: bot.id, correct });

      if (correct) {
        endGame(roomId, bot.playerName, false, true);
      } else {
        if (room.players.every((p: any) => p.hasGuessed)) {
          endGame(roomId, null);
        }
      }
    }, 10000 + Math.random() * 15000);
  }

  async function handleBotEvent(roomId: string, event: string, data: any) {
    const room = rooms.get(roomId);
    if (!room) return;

    // Explicitly identify bot and human players to avoid any confusion
    const botPlayer = room.players.find((p: any) => p.isBot);
    const humanPlayer = room.players.find((p: any) => !p.isBot);

    if (!botPlayer || !humanPlayer) {
      console.log(`[handleBotEvent] Missing bot or human player in room ${roomId}. Players:`, room.players.map((p: any) => ({ name: p.playerName, isBot: p.isBot })));
      return;
    }

    if (event === 'room_update') {
      // Initialize conversation if not already done
      if (!botConversations.has(roomId)) {
        botConversations.set(roomId, []);
      }
      
      // Requirement 6: Category selection negotiation
      if (room.gameState === 'waiting') {
        if (!botFlags.has(roomId + '_category_logic')) {
          botFlags.set(roomId + '_category_logic', true);
          
          const performCategorySelection = async () => {
            const categories = ["animals", "food", "people", "objects", "birds", "plants", "insects", "football"];
            
            // 1. Initial wait (1 to 3 seconds) before doing anything
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
            
            let currentRoom = rooms.get(roomId);
            if (!currentRoom || currentRoom.gameState !== 'waiting') return;
            let currentPlayer = currentRoom.players.find((p: any) => !p.isBot);
            
            // 2. Decide initial action
            const rand = Math.random();
            if (rand < 0.3 && currentPlayer?.selectedCategory) {
              // 30% chance to agree immediately if player already selected
              botPlayer.selectedCategory = currentPlayer.selectedCategory;
              currentRoom.category = currentPlayer.selectedCategory;
              io.to(currentRoom.id).emit("room_update", currentRoom);
              
              if (Math.random() < 0.5) {
                setTimeout(() => {
                  const r = rooms.get(roomId);
                  if (r && r.gameState === 'waiting' && r.players.every((p: any) => p.selectedCategory === r.category)) {
                    startGame(roomId);
                  }
                }, 1500 + Math.random() * 2000);
              }
            } else {
              // Pick a random category
              botPlayer.selectedCategory = categories[Math.floor(Math.random() * categories.length)];
              io.to(currentRoom.id).emit("room_update", currentRoom);
              
              // 3. Hesitate and change mind (40% chance)
              if (Math.random() < 0.4) {
                await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
                currentRoom = rooms.get(roomId);
                if (!currentRoom || currentRoom.gameState !== 'waiting') return;
                
                botPlayer.selectedCategory = categories[Math.floor(Math.random() * categories.length)];
                io.to(currentRoom.id).emit("room_update", currentRoom);
              }
              
              // 4. Eventually agree with player after some time (to not block the game)
              await new Promise(r => setTimeout(r, 4000 + Math.random() * 4000));
              currentRoom = rooms.get(roomId);
              if (!currentRoom || currentRoom.gameState !== 'waiting') return;
              
              currentPlayer = currentRoom.players.find((p: any) => !p.isBot);
              if (currentPlayer?.selectedCategory) {
                botPlayer.selectedCategory = currentPlayer.selectedCategory;
                currentRoom.category = currentPlayer.selectedCategory;
                io.to(currentRoom.id).emit("room_update", currentRoom);
                
                if (Math.random() < 0.5) {
                  setTimeout(() => {
                    const r = rooms.get(roomId);
                    if (r && r.gameState === 'waiting' && r.players.every((p: any) => p.selectedCategory === r.category)) {
                      startGame(roomId);
                    }
                  }, 1500 + Math.random() * 2000);
                }
              }
            }
          };
          
          performCategorySelection();
        } else {
          // If the initial sequence is done, but the player changes category again,
          // the bot should agree after a short delay to allow the game to start.
          if (humanPlayer?.selectedCategory && botPlayer.selectedCategory !== humanPlayer.selectedCategory) {
            if (!botTimeouts.has(roomId + '_agree_timeout')) {
              const timeout = setTimeout(() => {
                const currentRoom = rooms.get(roomId);
                if (!currentRoom || currentRoom.gameState !== 'waiting') return;
                const currentPlayer = currentRoom.players.find((p: any) => !p.isBot);
                if (currentPlayer?.selectedCategory) {
                  botPlayer.selectedCategory = currentPlayer.selectedCategory;
                  currentRoom.category = currentPlayer.selectedCategory;
                  io.to(currentRoom.id).emit("room_update", currentRoom);
                  
                  if (Math.random() < 0.5) {
                    setTimeout(() => {
                      const r = rooms.get(roomId);
                      if (r && r.gameState === 'waiting' && r.players.every((p: any) => p.selectedCategory === r.category)) {
                        startGame(roomId);
                      }
                    }, 1500 + Math.random() * 2000);
                  }
                }
                botTimeouts.delete(roomId + '_agree_timeout');
              }, 3000 + Math.random() * 2000); // 3-5 seconds delay
              botTimeouts.set(roomId + '_agree_timeout', timeout);
            }
          }
        }
      }
    }

    if (event === 'game_started') {
      // Initialize conversation
      botConversations.set(roomId, []);
      
      // Start questioning loop
      startBotQuestioning(roomId);
    }

    if (event === 'chat_message') {
      // Requirement: Bot should not respond to chat during category selection (waiting state)
      if (room.gameState === 'waiting') return;

      const { senderId, text } = data;
      if (senderId === botPlayer.id) return; // Don't respond to self

      // Add to history
      const history = botConversations.get(roomId) || [];
      history.push({ role: 'user', parts: [{ text }] });
      botConversations.set(roomId, history);

      // If the human answered "آه" or "لأ", the bot should NOT reply with an answer.
      if (text === 'آه' || text === 'لأ') {
        if (room.currentTurn === botPlayer.id) {
          // Human passed turn, bot should ask
          setTimeout(() => {
            triggerBotQuestion(roomId, botPlayer);
          }, 2000 + Math.random() * 2000);
        }
        return; // Do not generate a reply
      }

      // Check if user message is an emoji (including complex emojis with ZWJ and modifiers)
      const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?(\u200D\p{Emoji_Presentation}|\u200D\p{Emoji}\uFE0F)*)+$/u;
      const isUserEmoji = emojiRegex.test(text.trim());

      try {
        const botPersona = BOT_PERSONAS.find(p => p.name === botPlayer.playerName);
        
        console.log(`[BotAnswer] Room: ${roomId}, BotHas: ${botPlayer.targetImage?.name || botPlayer.targetImage}, UserAsked: ${text}`);
        
        let botReply = '';

        if (isUserEmoji) {
          // If user sent emoji, bot should reply with emoji
          const fallbackEmojis = ["😂", "🤪", "😡","😔", "🤔", "🙄", "🤯", "😭", "👀", "🕒", "👋", "✋", "👌", "👍", "👎", "🎉", "🤷🏼‍♂️", "🤷🏻‍♀️", "🤦🏼‍♂️", "🤦"];
          botReply = fallbackEmojis[Math.floor(Math.random() * fallbackEmojis.length)];
        } else {
          // Read files directly to avoid cache issues as requested
          let botAnswers: any = {};
          let config: any = { quickChat: [] };
          try {
            const botAnswersPath = path.join(process.cwd(), 'public/uploads/bot_answers.json');
            const configPath = path.join(process.cwd(), 'public/uploads/config.json');
            botAnswers = JSON.parse(fs.readFileSync(botAnswersPath, 'utf-8'));
            config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          } catch (e) {
            console.error("Error reading bot files:", e);
          }

          const botImage = botPlayer.targetImage;
          const botImageName = (botImage && typeof botImage === 'object') ? botImage.name : botImage;
          const playerImage = humanPlayer.targetImage;
          const playerImageName = (playerImage && typeof playerImage === 'object') ? playerImage.name : playerImage;
          
          console.log(`[BotAnswer] Room: ${roomId}`);
          console.log(`[BotAnswer] Bot Player: "${botPlayer.playerName}" (ID: ${botPlayer.id})`);
          console.log(`[BotAnswer] Bot Target Image: "${botImageName}"`);
          console.log(`[BotAnswer] Human Player Target Image: "${playerImageName}"`);
          console.log(`[BotAnswer] User Asked: "${text}"`);

          const questionId = findQuestionId(text, config.quickChat || []);
          console.log(`[BotAnswer] Found Question ID: "${questionId}"`);

          let deterministicAnswer = null;

          if (questionId) {
            // Check if questionId is the category ID itself
            if (questionId === room.category || questionId === `qc_${room.category}`) {
              deterministicAnswer = "آه";
              console.log(`[BotAnswer] Matched category ID: ${questionId}`);
            } 
            else {
              // CRITICAL: The human is trying to guess their OWN hidden image.
              // Therefore, the bot must answer based on the HUMAN'S image, not the bot's image.
              deterministicAnswer = getBotAnswer(room.category, playerImageName, questionId, botAnswers);
            }
          }

          if (deterministicAnswer) {
            botReply = deterministicAnswer;
            console.log(`[BotAnswer] Deterministic answer: ${botReply}`);
          } else {
            botReply = "لأ";
            console.log(`[BotAnswer] Defaulting to "لأ"`);
          }
          
          botReply = botReply.trim();
        }

        history.push({ role: 'model', parts: [{ text: botReply }] });
        botConversations.set(roomId, history);

        const typingDelay = Math.min(4000, Math.max(1000, botReply.length * 50));
        
        setTimeout(() => {
          const messageObj = { senderId: botPlayer.id, text: botReply };
          if (!room.chatHistory) room.chatHistory = [];
          room.chatHistory.push({ ...messageObj, senderName: botPlayer.playerName, timestamp: Date.now() });
          io.to(roomId).emit("chat_bubble", messageObj);
          
          if (botReply === 'آه' || botReply === 'لأ') {
            // Update turn logic: after bot answers, it's the bot's turn to ask
            room.currentTurn = botPlayer.id;
            room.waitingForAnswerFrom = null;
            io.to(roomId).emit("room_update", room);
            
            // Trigger bot to ask a question shortly after answering
            setTimeout(() => {
              triggerBotQuestion(roomId, botPlayer);
            }, 2000 + Math.random() * 2000);
          }
        }, typingDelay);

      } catch (error) {
        console.error("Gemini Error:", error);
      }
    }
  }

  const CATEGORIES = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    broadcastOnlineCount();

    // Send current theme to new user
    socket.emit('theme_updated', themeConfig);
    socket.emit('top_players_update', getTopPlayers());
    socket.emit('policies_update', gamePolicies);
    
    try {
      const luckyWheelSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('lucky_wheel_enabled') as { value: string } | undefined;
      socket.emit('app_settings', { lucky_wheel_enabled: luckyWheelSetting ? luckyWheelSetting.value === 'true' : true });
    } catch (e) {
      console.error("Failed to fetch app settings:", e);
    }

    socket.on('admin_save_theme', (newTheme) => {
      console.log("[Theme] Admin updated theme");
      themeConfig = { ...themeConfig, ...newTheme };
      try {
        db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('theme_config', JSON.stringify(themeConfig));
        io.emit('theme_updated', themeConfig); // Broadcast to all
      } catch (e) {
        console.error("Failed to save theme:", e);
      }
    });

    socket.on('request_match_intro', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.gameState === 'waiting') {
        room.gameState = 'starting'; // Prevent bot from changing category during intro
        io.to(roomId).emit('match_intro_triggered');
      }
    });

    socket.on("register_player", ({ name, avatar, xp, gender, fingerprint }, callback) => {
      const forwardedFor = socket.handshake.headers['x-forwarded-for'];
      const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : (forwardedFor ? forwardedFor.split(',')[0].trim() : socket.handshake.address);
      
      // Check if banned
      const banned = db.prepare('SELECT * FROM banned_identities WHERE (fingerprint = ? AND fingerprint IS NOT NULL) OR (ip = ? AND ip IS NOT NULL)').get(fingerprint || null, ip || null);
      if (banned) {
        callback({ error: 'تم حظرك نهائياً من اللعبة' });
        return;
      }

      // Generate a unique non-sequential ID
      const serial = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const level = getLevel(xp || 0);
      let filteredName = filterProfanity(name);
      if (filteredName.length > 15) {
        filteredName = filteredName.substring(0, 15);
      }
      
      allPlayers.set(serial, { 
        name: filteredName, 
        level, 
        avatar, 
        gender: gender || 'boy',
        fingerprint: fingerprint || null,
        ip: ip,
        xp: xp || 0, 
        streak: 0,
        serial, 
        wins: 0, 
        reports: 0, 
        banUntil: 0, 
        banCount: 0,
        isPermanentBan: 0,
        reportedBy: [],
        tokens: 0,
        adsWatchedToday: 0,
        lastAdWatchDate: null
      });
      savePlayerData(serial);
      callback({ serial, name: filteredName });
    });

    socket.on("claim_serial_prize", ({ serial, helperId }, callback) => {
      if (!serial || !helperId) {
        callback({ success: false, error: 'بيانات غير مكتملة' });
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      const check = db.prepare('SELECT * FROM used_prizes WHERE serial = ? AND prize_id = ? AND date = ?').get(serial, helperId, today);
      
      if (check) {
        callback({ success: false, error: 'تم استخدام هذه الجائزة اليوم بالفعل' });
        return;
      }
      
      db.prepare('INSERT INTO used_prizes (serial, prize_id, date) VALUES (?, ?, ?)').run(serial, helperId, today);
      callback({ success: true, helperId });
    });

    socket.on("start_ad_watch", ({ serial }) => {
      const player = allPlayers.get(serial);
      if (!player) return;
      player.adWatchStartTime = Date.now();
    });

    socket.on("watch_ad_request", ({ serial }) => {
      const player = allPlayers.get(serial);
      if (!player) return;

      // SECURITY: Check if they actually waited
      if (!player.adWatchStartTime || Date.now() - player.adWatchStartTime < 4000) {
        socket.emit("ad_error", "يجب مشاهدة الإعلان بالكامل!");
        return;
      }
      player.adWatchStartTime = 0; // Reset

      // 1. Check Level (Changed to 1 for testing)
      const level = getLevel(player.xp);
      if (level < 1) {
        socket.emit("ad_error", "يجب الوصول للمستوى 1 لاستخدام هذه الميزة");
        return;
      }

      // 2. Check Date & Reset if needed
      const today = new Date().toISOString().split('T')[0];
      if (player.lastAdWatchDate !== today) {
        player.adsWatchedToday = 0;
        player.lastAdWatchDate = today;
      }

      // 3. Check Limit
      if ((player.adsWatchedToday || 0) >= 5) {
        socket.emit("ad_error", "لقد استهلكت جميع المحاولات اليومية (5/5)");
        return;
      }

      // 4. Grant Reward
      player.adsWatchedToday = (player.adsWatchedToday || 0) + 1;
      player.tokens = (player.tokens || 0) + 1;
      
      savePlayerData(serial); // Persist changes

      socket.emit("ad_success", { 
        tokens: player.tokens, 
        adsWatched: player.adsWatchedToday,
        maxAds: 5
      });
      
      // Notify player of update
      socket.emit("player_stats_update", {
        xp: player.xp,
        level: getLevel(player.xp),
        streak: 0,
        wins: player.wins || 0,
        tokens: player.tokens
      });
    });

    socket.on("check_ad_status", ({ serial }) => {
      const player = allPlayers.get(serial);
      if (!player) return;

      const today = new Date().toISOString().split('T')[0];
      if (player.lastAdWatchDate !== today) {
        player.adsWatchedToday = 0;
        player.lastAdWatchDate = today;
        savePlayerData(serial);
      }

      socket.emit("ad_status", {
        adsWatched: player.adsWatchedToday || 0,
        maxAds: 5,
        canWatch: (player.adsWatchedToday || 0) < 5 && getLevel(player.xp) >= 1
      });
    });

    socket.on("get_spin_status", ({ serial }) => {
      const player = allPlayers.get(serial);
      if (!player) return;

      const today = new Date().toISOString().split('T')[0];
      if (player.lastSpinDate !== today) {
        player.dailySpinCount = 0;
        player.freeSpinUsed = 0;
        player.lastSpinDate = today;
        savePlayerData(serial);
      }

      socket.emit("spin_status", {
        dailySpinCount: player.dailySpinCount || 0,
        freeSpinUsed: player.freeSpinUsed || 0,
        maxPaidSpins: 10,
        hasFreeSpin: (player.freeSpinUsed || 0) === 0
      });
    });

    socket.on("perform_spin", ({ serial, isAdSpin }) => {
      const player = allPlayers.get(serial);
      if (!player) return;

      const today = new Date().toISOString().split('T')[0];
      if (player.lastSpinDate !== today) {
        player.dailySpinCount = 0;
        player.freeSpinUsed = 0;
        player.lastSpinDate = today;
      }

      const freeSpinAvailable = (player.freeSpinUsed || 0) === 0;
      const paidSpinsDone = (player.dailySpinCount || 0) - (player.freeSpinUsed || 0);
      
      if (!isAdSpin && !freeSpinAvailable) {
        socket.emit("spin_error", "لقد استنفدت المحاولة المجانية اليوم!");
        return;
      }

      if (isAdSpin && paidSpinsDone >= 10 && !player.isAdmin) {
        socket.emit("spin_error", "لقد استنفدت جميع المحاولات المدفوعة اليوم (10 محاولات)!");
        return;
      }

      // Perform weighted random selection
      const totalWeight = SPIN_REWARDS.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedReward = SPIN_REWARDS[0];

      for (const reward of SPIN_REWARDS) {
        if (random < reward.weight) {
          selectedReward = reward;
          break;
        }
        random -= reward.weight;
      }

      // Update player state
      if (!isAdSpin) {
        player.freeSpinUsed = 1;
        
        // Smart retention mechanic for free spins
        const daysUsed = player.luckyWheelDaysUsed || 0;
        if (daysUsed === 0) {
          selectedReward = SPIN_REWARDS.find(r => r.id === 'xp_5000') || selectedReward;
        } else if (daysUsed === 2) {
          selectedReward = SPIN_REWARDS.find(r => r.id === 'xp_10000') || selectedReward;
        } else if (daysUsed === 4) {
          selectedReward = SPIN_REWARDS.find(r => r.id === 'token_10') || selectedReward;
        }
        player.luckyWheelDaysUsed = daysUsed + 1;
      }
      player.dailySpinCount = (player.dailySpinCount || 0) + 1;

      // Apply reward
      if (selectedReward.type === 'xp') {
        player.xp = (player.xp || 0) + (selectedReward.value as number);
      } else if (selectedReward.type === 'token') {
        player.tokens = (player.tokens || 0) + (selectedReward.value as number);
        player.luckyWheelTokens = (player.luckyWheelTokens || 0) + (selectedReward.value as number);
      } else if (selectedReward.type === 'helper') {
        const helpers = player.ownedHelpers || {};
        helpers[selectedReward.value as string] = (helpers[selectedReward.value as string] || 0) + 1;
        player.ownedHelpers = helpers;
        
        const lwHelpers = player.luckyWheelHelpers || {};
        lwHelpers[selectedReward.value as string] = (lwHelpers[selectedReward.value as string] || 0) + 1;
        player.luckyWheelHelpers = lwHelpers;
      } else if (selectedReward.type === 'pro') {
        const currentExpiry = player.proPackageExpiry || Date.now();
        player.proPackageExpiry = Math.max(currentExpiry, Date.now()) + (selectedReward.value as number) * 24 * 60 * 60 * 1000;
      }

      savePlayerData(serial);

      socket.emit("spin_result", {
        reward: selectedReward,
        dailySpinCount: player.dailySpinCount,
        freeSpinUsed: player.freeSpinUsed,
        newStats: {
          xp: player.xp,
          tokens: player.tokens,
          ownedHelpers: player.ownedHelpers || {},
          proPackageExpiry: player.proPackageExpiry
        }
      });
    });

    socket.on("claim_daily_quest", ({ serial, isPro }) => {
      const player = allPlayers.get(serial);
      if (!player) return;

      // Check for daily reset before claiming rewards
      checkDailyReset(player, serial, socket);

      const now = Date.now();
      const lastClaim = player.lastDailyClaim || 0;
      
      // Check if already claimed today
      const isSameDay = (d1: number, d2: number) => {
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        return date1.getUTCFullYear() === date2.getUTCFullYear() &&
               date1.getUTCMonth() === date2.getUTCMonth() &&
               date1.getUTCDate() === date2.getUTCDate();
      };

      if (lastClaim !== 0 && isSameDay(now, lastClaim)) {
        socket.emit("daily_quest_error", "لقد حصلت على جائزتك اليوم بالفعل!");
        return;
      }

      // Calculate streak
      let streak = player.dailyQuestStreak || 1;
      if (streak > 7) streak = 1; // Reset if we finished the week last time

      const isConsecutiveDay = (d1: number, d2: number) => {
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        date2.setUTCDate(date2.getUTCDate() + 1);
        return date1.getUTCFullYear() === date2.getUTCFullYear() &&
               date1.getUTCMonth() === date2.getUTCMonth() &&
               date1.getUTCDate() === date2.getUTCDate();
      };

      if (lastClaim !== 0 && !isConsecutiveDay(now, lastClaim)) {
        streak = 1; // Reset streak if missed a day
      }

      // Calculate rewards based on streak
      const dayIndex = (streak - 1) % 7;
      const xpRewards = [50, 100, 150, 250, 300, 400, 500];
      
      let xpReward = xpRewards[dayIndex];
      let tokenReward = 0;
      
      const HELPER_ITEMS = [
        { id: 'word_length', name: 'كاشف الحروف', icon: 'Type' },
        { id: 'word_count', name: 'عدد الكلمات', icon: 'Hash' },
        { id: 'time_freeze', name: 'تجميد الوقت', icon: 'Snowflake' },
        { id: 'hint', name: 'تلميح', icon: 'HelpCircle' },
        { id: 'spy_lens', name: 'الجاسوس', icon: 'Eye' }
      ];
      const randomHelper = HELPER_ITEMS[Math.floor(Math.random() * HELPER_ITEMS.length)];

      const playerLevel = getLevel(player.xp);
      let helperReward: any = randomHelper;

      // Level 50+ Logic: Helper turns into 100 XP
      if (playerLevel >= 50) {
        helperReward = { id: 'bonus_xp', name: '100 XP إضافية', icon: '⭐' };
        xpReward += 100;
      }

      // Level 50+ and 50+ Pro: Random 1 Token (Max 2 per week)
      if (playerLevel >= 50) {
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (!player.lastWeeklyTokenReset || (now - player.lastWeeklyTokenReset > oneWeek)) {
          player.weeklyTokensClaimed = 0;
          player.lastWeeklyTokenReset = now;
        }

        if ((player.weeklyTokensClaimed || 0) < 2) {
          if (Math.random() < 0.2) { // 20% chance
            tokenReward = 1;
            player.weeklyTokensClaimed = (player.weeklyTokensClaimed || 0) + 1;
          }
        }
      }

      // Apply rewards
      player.xp = (player.xp || 0) + xpReward;
      player.level = getLevel(player.xp);
      if (tokenReward > 0) {
        player.tokens = (player.tokens || 0) + tokenReward;
      }
      
      // Add the new helper (if any and not virtual)
      if (!player.ownedHelpers) player.ownedHelpers = {};
      if (helperReward && helperReward.id !== 'bonus_xp') {
        player.ownedHelpers[helperReward.id] = (player.ownedHelpers[helperReward.id] || 0) + 1;
      }

      // Update streak
      player.dailyQuestStreak = streak + 1;
      player.lastDailyClaim = now;

      savePlayerData(serial);

      socket.emit("daily_quest_success", {
        xpReward,
        tokenReward,
        helperReward,
        newXp: player.xp,
        newTokens: player.tokens,
        newOwnedHelpers: player.ownedHelpers,
        newStreak: player.dailyQuestStreak,
        newLastClaim: player.lastDailyClaim,
        weeklyTokensClaimed: player.weeklyTokensClaimed || 0
      });
      
      socket.emit("player_stats_update", {
        xp: player.xp,
        level: player.level,
        streak: 0,
        wins: player.wins || 0,
        tokens: player.tokens
      });
    });

    socket.on("claim_rain_gift", ({ serial, rewards, isPro }) => {
      const player = allPlayers.get(serial);
      if (!player) return;

      // Check for daily reset
      checkDailyReset(player, serial, socket);

      // Apply rewards
      if (rewards.xp) player.xp = (player.xp || 0) + rewards.xp;
      if (rewards.tokens) {
        player.tokens = (player.tokens || 0) + rewards.tokens;
        player.rainGiftTokens = (player.rainGiftTokens || 0) + rewards.tokens;
      }
      
      if (rewards.helpers && typeof rewards.helpers === 'object') {
        if (!player.ownedHelpers) player.ownedHelpers = {};
        if (!player.rainGiftHelpers) player.rainGiftHelpers = {};
        const playerLevel = getLevel(player.xp);
        
        Object.entries(rewards.helpers).forEach(([helperId, count]) => {
          if (typeof count === 'number' && count > 0) {
            // Level 50+ or Level 50+ Pro: Convert to XP
            if (playerLevel >= 50) {
              player.xp = (player.xp || 0) + (count * 100);
            } else {
              player.ownedHelpers[helperId] = (player.ownedHelpers[helperId] || 0) + count;
              player.rainGiftHelpers[helperId] = (player.rainGiftHelpers[helperId] || 0) + count;
            }
          }
        });
      }

      player.level = getLevel(player.xp);
      savePlayerData(serial);

      socket.emit("player_data_update", { 
        serial, 
        xp: player.xp, 
        tokens: player.tokens, 
        ownedHelpers: player.ownedHelpers,
        level: player.level
      });
      
      socket.emit("player_stats_update", {
        xp: player.xp,
        level: player.level,
        streak: player.streak || 0,
        wins: player.wins || 0,
        tokens: player.tokens
      });
    });

    socket.on("update_player_data", ({ serial, ...updates }) => {
      const player = allPlayers.get(serial);
      if (player) {
        // SECURITY: Only allow updating specific non-sensitive fields
        const allowedFields = ['name', 'avatar', 'gender', 'age'];
        const safeUpdates: any = {};
        for (const key of allowedFields) {
          if (updates[key] !== undefined) {
            safeUpdates[key] = updates[key];
          }
        }
        
        if (Object.keys(safeUpdates).length > 0) {
          Object.assign(player, safeUpdates);
          savePlayerData(serial);
          socket.emit("player_data_update", player);
          
          // Update in active rooms
          for (const room of rooms.values()) {
            const roomPlayer = room.players.find((p: any) => p.serial === serial);
            if (roomPlayer) {
              Object.assign(roomPlayer, safeUpdates);
            }
          }
        }
      }
    });

    socket.on("use_helper", ({ roomId, helperId, serial }) => {
      const room = rooms.get(roomId);
      if (!room || room.gameState === 'finished') return;

      const player = room.players.find((p: any) => p.id === socket.id);
      if (!player) return;

      // SECURITY: Deduct helper from player data
      const dbPlayer = allPlayers.get(serial);
      if (!dbPlayer || !dbPlayer.ownedHelpers || !dbPlayer.ownedHelpers[helperId] || dbPlayer.ownedHelpers[helperId] <= 0) {
        socket.emit("error", "لا تملك هذه المساعدة!");
        return;
      }

      // Deduct
      if (dbPlayer.rainGiftHelpers && dbPlayer.rainGiftHelpers[helperId] > 0) {
        dbPlayer.rainGiftHelpers[helperId] -= 1;
      }
      dbPlayer.ownedHelpers[helperId] -= 1;
      if (dbPlayer.ownedHelpers[helperId] === 0) {
        delete dbPlayer.ownedHelpers[helperId];
      }
      savePlayerData(serial);
      socket.emit("player_data_update", { serial, ownedHelpers: dbPlayer.ownedHelpers });

      // Broadcast to room that a helper was used
      io.to(roomId).emit("helper_used", { playerId: socket.id, helperId });

      // Specific logic for helpers
      if (helperId === 'reveal_letter') {
        const targetName = player.targetImage.name;
        // Reveal a random letter that hasn't been revealed by hints yet
        const revealedCount = player.hintCount || 0;
        const letterToReveal = targetName[revealedCount] || targetName[0];
        socket.emit("helper_effect", { 
          helperId, 
          data: { 
            message: `المساعدة: الحرف التالي هو "${letterToReveal}"`,
            letter: letterToReveal
          } 
        });
      } else if (helperId === 'extra_time') {
        room.timer = (room.timer || 0) + 30;
        io.to(roomId).emit("timer_update", room.timer);
        socket.emit("helper_effect", { 
          helperId, 
          data: { message: "تم إضافة 30 ثانية للوقت!" } 
        });
      } else if (helperId === 'remove_wrong') {
        socket.emit("helper_effect", { 
          helperId, 
          data: { message: "تم تسهيل التخمين لك!" } 
        });
      }
    });

    socket.on("request_custom_avatar", ({ playerSerial, avatar, status }, callback) => {
      const player = allPlayers.get(playerSerial);
      if (player) {
        if (getLevel(player.xp) < 50) {
          if (callback) callback({ success: false, message: "يجب أن يكون مستواك 50+ لرفع صورة مخصصة" });
          return;
        }

        if (status === 'approved') {
          player.avatar = avatar;
          player.avatarStatus = 'approved';
          player.pendingAvatar = undefined;
          if (callback) callback({ success: true, message: "تمت رفع الصورة بنجاح!" });
        } else {
          player.pendingAvatar = avatar;
          player.avatarStatus = 'pending';
          if (callback) callback({ success: true, message: "تم إرسال الصورة للمراجعة اليدوية." });
        }
        savePlayerData(playerSerial);
      }
    });

    socket.on("admin_get_pending_avatars", (callback) => {
      const pending = Array.from(allPlayers.values())
        .filter(p => p.avatarStatus === 'pending' && p.pendingAvatar)
        .map(p => ({
          serial: p.serial,
          name: p.name,
          level: getLevel(p.xp),
          pendingAvatar: p.pendingAvatar
        }));
      callback(pending);
    });

    socket.on("admin_review_avatar", ({ playerSerial, status }, callback) => {
      const player = allPlayers.get(playerSerial);
      if (player) {
        if (status === 'approved' && player.pendingAvatar) {
          player.avatar = player.pendingAvatar;
          player.avatarStatus = 'approved';
          player.pendingAvatar = undefined;
        } else if (status === 'rejected') {
          player.avatarStatus = 'rejected';
          player.pendingAvatar = undefined;
          // We don't reset player.avatar here anymore, so they keep their previous avatar
        }
        savePlayerData(playerSerial);
        if (callback) callback({ success: true });
        
        // Notify player if online
        const socketId = playerSockets.get(playerSerial);
        if (socketId) {
          io.to(socketId).emit('avatar_review_result', { 
            success: true, 
            status: player.avatarStatus,
            avatar: player.avatar,
            message: status === 'approved' ? 'تمت الموافقة على صورتك الشخصية!' : 'تم رفض صورتك الشخصية لمخالفتها السياسات.'
          });
        }
      } else {
        if (callback) callback({ success: false, error: "اللاعب غير موجود" });
      }
    });

    socket.on("update_profile", ({ playerSerial, playerName, avatar, gender }, callback) => {
      const player = allPlayers.get(playerSerial);
      if (player) {
        let filteredName = filterProfanity(playerName);
        if (filteredName.length > 15) {
          filteredName = filteredName.substring(0, 15);
        }
        
        // Check if name is changing
        if (player.name !== filteredName) {
          player.name = filteredName;
          player.lastRenameAt = Date.now();
        }
        
        // Avatar validation:
        // If it's a custom avatar (base64/data URL), it must be the currently approved one.
        // Otherwise, it must be one of the default avatars.
        const isCustom = avatar && avatar.startsWith('data:image/');
        if (isCustom) {
          // If player tries to set a custom avatar, it must match their approved one
          if (player.avatarStatus !== 'approved' || player.avatar !== avatar) {
            // If not approved or doesn't match, we don't update the avatar field to this new one
            console.log(`Player ${player.name} tried to set unapproved custom avatar.`);
          } else {
            player.avatar = avatar;
          }
        } else {
          // Default avatars are always allowed
          player.avatar = avatar;
        }

        if (gender) {
          player.gender = gender;
          // Update gender in all rooms the player is in
          for (const [roomId, room] of rooms.entries()) {
            const playerInRoom = room.players.find((p: any) => p.serial === playerSerial);
            if (playerInRoom) {
              playerInRoom.gender = gender;
              // Emit room_update so clients see the change
              io.to(roomId).emit("room_update", room);
            }
          }
        }
        savePlayerData(playerSerial);
        if (callback) callback({ topPlayers: getTopPlayers(), name: player.name, lastRenameAt: player.lastRenameAt });
      }
    });

    socket.on("update_selected_frame", ({ playerSerial, frame }, callback) => {
      const player = allPlayers.get(playerSerial);
      if (player) {
        player.selectedFrame = frame;
        savePlayerData(playerSerial);
        if (callback) callback({ success: true, frame: player.selectedFrame });
      } else {
        if (callback) callback({ success: false, error: "Player not found" });
      }
    });

    socket.on("update_player_notifications", ({ serial, enabled }) => {
      const player = allPlayers.get(serial);
      if (player) {
        player.notificationsEnabled = enabled ? 1 : 0;
        savePlayerData(serial);
      }
    });

    socket.on("get_top_players", (callback) => {
      callback(getTopPlayers());
    });
    
    socket.on("get_player_data", (data, callback) => {
      const serial = typeof data === 'string' ? data : data.serial;
      const fingerprint = typeof data === 'object' ? data.fingerprint : null;
      
      const player = allPlayers.get(serial);
      if (player && callback) {
        // Check for daily reset as soon as player connects/gets data
        checkDailyReset(player, serial, socket);

        // Update IP and fingerprint
        const forwardedFor = socket.handshake.headers['x-forwarded-for'];
        const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : (forwardedFor ? forwardedFor.split(',')[0].trim() : socket.handshake.address);
        
        // Check if banned
        const banned = db.prepare('SELECT * FROM banned_identities WHERE (fingerprint = ? AND fingerprint IS NOT NULL) OR (ip = ? AND ip IS NOT NULL)').get(fingerprint || null, ip || null);
        if (banned || player.isPermanentBan) {
          callback({ error: 'تم حظرك نهائياً من اللعبة' });
          return;
        }

        let updated = false;
        if (ip && player.ip !== ip) {
          player.ip = ip;
          updated = true;
        }
        if (fingerprint && player.fingerprint !== fingerprint) {
          player.fingerprint = fingerprint;
          updated = true;
        }
        
        if (updated) {
          savePlayerData(serial);
        }

        const now = Date.now();
        const lastClaim = player.lastDailyClaim || 0;
        const isSameDay = (d1: number, d2: number) => {
          const date1 = new Date(d1);
          const date2 = new Date(d2);
          return date1.getUTCFullYear() === date2.getUTCFullYear() &&
                 date1.getUTCMonth() === date2.getUTCMonth() &&
                 date1.getUTCDate() === date2.getUTCDate();
        };

        // The checkDailyReset function handles daily resets for ownedHelpers and tokens.
        // We don't need to clear ownedHelpers here based on lastDailyClaim.

        // Check if there's an active global reward
        if (activeGlobalReward && activeGlobalReward.expiresAt > Date.now()) {
          if (!player.claimedRewards) player.claimedRewards = [];
          if (!player.claimedRewards.includes(activeGlobalReward.id)) {
            // Only send token rewards to level 50+
            const level = Math.floor(Math.sqrt((player.xp || 0) / 50)) + 1;
            if (activeGlobalReward.type !== 'tokens' || level >= 50) {
              socket.emit("global_reward_available", activeGlobalReward);
            }
          }
        }

        callback(player);
      } else if (callback) {
        callback(null);
      }
    });
    
    socket.on("get_blocked_players", ({ serial }, callback) => {
      const player = allPlayers.get(serial);
      if (player && player.blockedSerials && callback) {
        const blockedList = player.blockedSerials.map((blockedSerial: string) => {
          const bPlayer = allPlayers.get(blockedSerial);
          return {
            serial: blockedSerial,
            name: bPlayer ? bPlayer.name : 'لاعب غير معروف'
          };
        });
        callback(blockedList);
      } else if (callback) {
        callback([]);
      }
    });

    socket.on("unblock_player", ({ serial, blockedSerial }, callback) => {
      const player = allPlayers.get(serial);
      if (player) {
        if (player.blockedSerials) {
          player.blockedSerials = player.blockedSerials.filter((s: string) => s !== blockedSerial);
        }
        // We also need to remove the fingerprint if possible, but since we don't know which fingerprint belongs to which serial easily here, 
        // we might just leave the fingerprint block or try to find it.
        const blockedPlayer = allPlayers.get(blockedSerial);
        if (blockedPlayer && blockedPlayer.fingerprint && player.blockedFingerprints) {
          player.blockedFingerprints = player.blockedFingerprints.filter((f: string) => f !== blockedPlayer.fingerprint);
        }
        
        savePlayerData(serial);
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ success: false });
      }
    });

    socket.on("delete_account", ({ playerSerial }, callback) => {
      try {
        // Delete related reports
        db.prepare('DELETE FROM reports WHERE reporterSerial = ? OR reportedSerial = ?').run(playerSerial, playerSerial);
        
        // Delete player
        db.prepare('DELETE FROM players WHERE serial = ?').run(playerSerial);
        allPlayers.delete(playerSerial);
        
        if (callback) callback({ success: true });
        
        // Disconnect socket to trigger cleanup (remove from queues, rooms, etc.)
        // Use a small timeout to ensure the callback reaches the client first
        setTimeout(() => {
          socket.disconnect(true);
        }, 500);
      } catch (err) {
        console.error("Failed to delete player from DB:", err);
        if (callback) callback({ success: false, error: "Database error" });
      }
    });

    socket.on("join_room", ({ roomId, playerName, avatar, age, xp, streak, serial, wins }) => {
      socket.data.isSearching = false;
      // Check if player is banned
      const serverPlayer = allPlayers.get(serial);
      if (!serverPlayer) {
        socket.emit("auth_error");
        return;
      }
      
      // Check for daily reset
      checkDailyReset(serverPlayer, serial, socket);
      
      // Safety: Unban admin if they were accidentally banned
      if (serverPlayer.email === 'adhamsabry.co@gmail.com' && (serverPlayer.banUntil > 0 || serverPlayer.isPermanentBan)) {
        serverPlayer.banUntil = 0;
        serverPlayer.isPermanentBan = 0;
        savePlayerData(serial);
      }
      
      let validAge = age;
      if (typeof age === 'number' && age > 80) {
        validAge = 80;
      }
      
      if (serverPlayer.isPermanentBan) {
          socket.emit("banned_status", { isPermanent: true });
          return;
        }
        if (serverPlayer.banUntil > Date.now()) {
          socket.emit("banned_status", { banUntil: serverPlayer.banUntil, isPermanent: false });
          return;
        }

      // If room exists and is in 'finished' state, delete it to start fresh
      const existingRoom = rooms.get(roomId);
      if (existingRoom && existingRoom.gameState === "finished") {
        if (intervals.has(roomId)) {
          clearInterval(intervals.get(roomId));
          intervals.delete(roomId);
        }
        rooms.delete(roomId);
      }

      // Check if player is already in a match
      const isAlreadyInMatch = Array.from(rooms.values()).some(room => 
        room.gameState !== 'finished' && room.gameState !== 'waiting' && room.players.some(p => p.serial === serial)
      );

      if (isAlreadyInMatch && !serverPlayer.isAdmin) {
        socket.emit("error", { message: "أنت بالفعل في مباراة أخرى!" });
        return;
      }

      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          startTime: Date.now(),
          id: roomId,
          players: [],
          gameState: "waiting",
          timer: 60,
          category: "people",
          isPaused: false,
          pausingPlayerId: null,
          quickGuessTimer: 0,
          adCooldownTimer: 0,
          lastUpdates: null,
          chatHistory: [],
          currentTurn: null,
          waitingForAnswerFrom: null,
        });
      }

      const room = rooms.get(roomId);
      if (room && room.players.length < 2) {
        socket.join(roomId);
        
        // Use server data as absolute source of truth
        const actualXp = serverPlayer.xp;
        const actualWins = serverPlayer.wins;
        const actualReports = serverPlayer.reports;
        const actualReportedBy = serverPlayer.reportedBy;
        const actualName = serverPlayer.name || filterProfanity(playerName);

        const player = {
          id: socket.id,
          serial: serial,
          name: actualName,
          age: validAge,
          avatar: avatar,
          gender: serverPlayer.gender || 'boy',
          selectedFrame: serverPlayer.selectedFrame || '',
          score: 1000,
          targetImage: null,
          isMuted: false,
          hasGuessed: false,
          selectedCategory: null,
          hintCount: 0,
          quickGuessUsed: false,
          wordLengthUsed: false,
          timeFreezeUsed: false,
          wordCountUsed: false,
          spyLensUsed: false,
          reported: false,
          xp: actualXp,
          level: getLevel(actualXp),
          streak: streak || 0,
          wins: actualWins,
          reports: actualReports,
          reportedBy: actualReportedBy,
          usedToken: false,
          profanityCount: 0,
          helpersUsedCount: 0,
          ownedHelpers: serverPlayer.ownedHelpers || {},
          isAdmin: !!serverPlayer.isAdmin
        };
        room.players.push(player);
        
        if (room.players.length === 2) {
          startWaitingInterval(roomId);
        }

        io.to(roomId).emit("room_update", room);
      } else {
        socket.emit("error", "الغرفة ممتلئة، يجب تغيير كود الغرفة");
      }
    });

    socket.on("find_random_match", ({ playerId, playerName, avatar, age, xp, streak, serial, wins, useToken }) => {
      // Check if player is banned
      const bannedPlayer = allPlayers.get(serial);
      if (!bannedPlayer) {
        socket.emit("auth_error");
        return;
      }

      // Safety: Unban admin if they were accidentally banned
      if (bannedPlayer.email === 'adhamsabry.co@gmail.com' && (bannedPlayer.banUntil > 0 || bannedPlayer.isPermanentBan)) {
        bannedPlayer.banUntil = 0;
        bannedPlayer.isPermanentBan = 0;
        savePlayerData(serial);
      }

      if (useToken && (bannedPlayer.tokens || 0) <= 0) {
        socket.emit("error", "لا تملك Tokens كافية");
        return;
      }

      if (useToken && getLevel(bannedPlayer.xp || 0) < 50) {
        socket.emit("error", "يجب أن تصل للمستوى 50 لاستخدام الـ Tokens");
        return;
      }
      
      let validAge = age;
      if (typeof age === 'number' && age > 80) {
        validAge = 80;
      }
      
      if (bannedPlayer.isPermanentBan) {
          socket.emit("banned_status", { isPermanent: true });
          return;
        }
        if (bannedPlayer.banUntil > Date.now()) {
          socket.emit("banned_status", { banUntil: bannedPlayer.banUntil, isPermanent: false });
          return;
        }

      // Remove from queue if already there (re-join)
      const existingIndex = matchmakingQueue.findIndex(p => p.playerId === playerId || p.id === socket.id);
      if (existingIndex !== -1) matchmakingQueue.splice(existingIndex, 1);
      
      socket.data.isSearching = true;

      for (const [matchId, match] of pendingMatches.entries()) {
        if (match.p1.socket.id === socket.id || match.p2.socket.id === socket.id) {
          const oppData = match.p1.socket.id === socket.id ? match.p2 : match.p1;
          pendingMatches.delete(matchId);
          oppData.status = 'searching';
          oppData.socket.emit("match_rejected", { reason: 'opponent_left' });
          matchmakingQueue.unshift(oppData);
          break;
        }
      }

      // Use server data as absolute source of truth
      const actualXp = bannedPlayer.xp;
      const actualWins = bannedPlayer.wins;
      const actualName = bannedPlayer.name || filterProfanity(playerName);

      matchmakingQueue.push({ 
        id: socket.id, 
        socket, 
        playerId, 
        playerName: actualName, 
        avatar, 
        selectedFrame: bannedPlayer.selectedFrame || '',
        age: validAge,
        xp: actualXp,
        streak: streak || 0,
        serial: serial,
        wins: actualWins,
        useToken: !!useToken,
        ownedHelpers: bannedPlayer.ownedHelpers || {},
        skipped: new Map(), // Initialize skipped map (playerId -> timestamp)
        joinedAt: Date.now(),
        status: 'searching'
      });
      socket.emit("waiting_for_match");
      processQueue();
    });

    socket.on("respond_to_match", ({ matchId, response }) => {
      const match = pendingMatches.get(matchId);
      if (!match) {
        console.log(`[Matchmaking] Match ${matchId} not found for response ${response}`);
        return;
      }

      const isP1 = match.p1.socket.id === socket.id;
      const isP2 = match.p2.socket.id === socket.id;

      console.log(`[Matchmaking] Response ${response} from socket ${socket.id} for match ${matchId}. isP1: ${isP1}, isP2: ${isP2}. Match P1 Socket: ${match.p1.socket.id}, Match P2 Socket: ${match.p2.socket.id}`);

      if (!isP1 && !isP2) {
        console.log(`[Matchmaking] Socket ${socket.id} is neither P1 nor P2 for match ${matchId}`);
        return;
      }

      if (isP1) match.p1Response = response;
      if (isP2) match.p2Response = response;

      // If human accepts and opponent is bot, bot accepts after a delay
      if (isP1 && response === 'accept' && match.p2.isBot) {
        console.log(`[Bot Matchmaking] Human ${match.p1.playerName} accepted match ${matchId}. Bot ${match.p2.playerName} will accept shortly.`);
        setTimeout(() => {
          const currentMatch = pendingMatches.get(matchId);
          if (currentMatch && currentMatch.p1Response === 'accept') {
            console.log(`[Bot Matchmaking] Bot ${currentMatch.p2.playerName} automatically accepting match ${matchId}`);
            currentMatch.p2Response = 'accept';
            currentMatch.p1.socket.emit("opponent_accepted");
            
            // Check if both accepted
            if (currentMatch.p1Response === 'accept' && currentMatch.p2Response === 'accept') {
              finalizeMatch(matchId);
            }
          }
        }, 1500 + Math.random() * 1500);
      }

      const myData = isP1 ? match.p1 : match.p2;
      const oppData = isP1 ? match.p2 : match.p1;

      if (response === 'accept') {
        oppData.socket.emit("opponent_accepted");
      }

      if (response === 'block') {
        const myBlocks = blocks.get(myData.playerId) || [];
        myBlocks.push({ blockedId: oppData.playerId, expiresAt: Date.now() + 60 * 60 * 1000 }); // 1 hour
        blocks.set(myData.playerId, myBlocks);
      }

      if (response === 'reject' || response === 'block') {
        clearTimeout(match.timeoutId);
        pendingMatches.delete(matchId);
        
        // Notify both players
        oppData.socket.emit("match_rejected", { reason: response === 'block' ? 'blocked' : 'rejected' });
        myData.socket.emit("match_rejected", { reason: 'you_rejected' });
        
        // Put innocent back in queue immediately
        if (!oppData.isBot) {
          oppData.status = 'searching';
          matchmakingQueue.unshift(oppData);
          processQueue();
        }
        
        // Delay putting rejector back into the queue for 5 seconds to prevent spam
        if (!myData.isBot) {
          myData.status = 'searching';
          setTimeout(() => {
            // Only add back if they haven't started another search or joined a room
            const stillInQueue = matchmakingQueue.some(p => p.id === myData.id);
            if (!stillInQueue && myData.socket.connected && myData.socket.data?.isSearching) {
              matchmakingQueue.push(myData);
            }
          }, 5000);
        }
        
        return;
      }

      if (match.p1Response === 'accept' && match.p2Response === 'accept') {
        finalizeMatch(matchId);
      }
    });

    socket.on("select_category", ({ roomId, category }) => {
      const room = rooms.get(roomId);
      if (room && room.gameState === "waiting") {
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player) {
          player.selectedCategory = category;
          
          // Check if both players selected the same category
          const allSelected = room.players.length === 2 && 
                            room.players.every((p: any) => p.selectedCategory === category);
          
          if (allSelected) {
            room.category = category;
            // io.to(roomId).emit('match_intro_triggered'); // Removed automatic trigger
          }
          
          io.to(roomId).emit("room_update", room);

          // Trigger bot to check if it needs to select a category
          const bot = room.players.find((p: any) => p.isBot);
          if (bot) {
            handleBotEvent(roomId, 'room_update', room);
          }
        }
      }
    });

    socket.on("force_start_game", ({ roomId }) => {
      console.log(`[MatchIntro] Force start game requested for room: ${roomId}`);
      const room = rooms.get(roomId);
      if (room && room.players.length === 2 && room.gameState === 'starting') {
        console.log(`[MatchIntro] Starting game for room: ${roomId}`);
        room.gameState = 'waiting'; // Ensure it's in a state that can start
        startGame(roomId);
      } else {
        console.log(`[MatchIntro] Failed to start game for room: ${roomId}. Room exists: ${!!room}, Players: ${room?.players?.length}, State: ${room?.gameState}`);
      }
    });

    socket.on("start_game_request", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.players.length === 2 && room.gameState === "waiting") {
        const p1 = room.players[0];
        const p2 = room.players[1];
        if (p1.selectedCategory && p1.selectedCategory === p2.selectedCategory) {
          startGame(roomId);
        }
      }
    });

    socket.on("send_emote", ({ roomId, emote }) => {
      const room = rooms.get(roomId);
      if (room) {
        io.to(roomId).emit("emote_received", { senderId: socket.id, emote });
        
        // Bot emote response logic
        const sender = room.players.find((p: any) => p.id === socket.id);
        if (sender && !sender.isBot) {
          const bot = room.players.find((p: any) => p.isBot);
          if (bot) {
            setTimeout(() => {
              const botEmotes = ["😂", "🤪", "😡","😔", "🤔", "🙄", "🤯", "😭", "👀", "🕒", "👋", "✋", "👌", "👍", "👎", "🎉", "🤷🏼‍♂️", "🤷🏻‍♀️", "🤦🏼‍♂️", "🤦"];
              const randomEmote = botEmotes[Math.floor(Math.random() * botEmotes.length)];
              io.to(roomId).emit("emote_received", { senderId: bot.id, emote: randomEmote });
            }, 1000 + Math.random() * 2000);
          }
        }
      }
    });

    socket.on("send_chat", ({ roomId, text, passTurn }) => {
      console.log(`Chat request from ${socket.id} for room ${roomId}: ${text}`);
      const room = rooms.get(roomId);
      if (room) {
        const sender = room.players.find((p: any) => p.id === socket.id);
        if (!sender) return;

        const messageToSend = text;

        console.log(`Broadcasting chat to room ${roomId}`);
        
        // Turn logic for Quick Chat (Updates state but doesn't block for speed)
        if (room.gameState === 'discussion') {
          const opponent = room.players.find((p: any) => p.id !== socket.id);
          const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?(\u200D\p{Emoji_Presentation}|\u200D\p{Emoji}\uFE0F)*)+$/u;
          const isEmoji = emojiRegex.test(messageToSend.trim());

          if (!isEmoji) {
            if (messageToSend === 'آه' || messageToSend === 'لأ') {
              if (messageToSend === 'آه') {
                if (!room.confirmedAnswers) room.confirmedAnswers = [];
                // Find the last question asked by the opponent
                const lastQuestion = room.chatHistory?.slice().reverse().find((m: any) => m.senderId !== socket.id && m.text !== 'آه' && m.text !== 'لأ');
                if (lastQuestion) {
                  room.confirmedAnswers.push(lastQuestion.text);
                }
              }
              if (passTurn && opponent) {
                // The answerer has no questions, so turn goes back to the asker
                room.currentTurn = opponent.id;
                room.waitingForAnswerFrom = null;
              } else {
                // Turn switches to the player who answered
                room.currentTurn = socket.id;
                room.waitingForAnswerFrom = null;
              }
            } else {
              room.currentTurn = null;
              if (opponent) {
                room.waitingForAnswerFrom = opponent.id;
              }
            }
          }
        }
        
        // Save to room chat history
        if (!room.chatHistory) room.chatHistory = [];
        room.chatHistory.push({
          senderId: socket.id,
          senderName: sender.name,
          text: messageToSend,
          timestamp: Date.now()
        });
        if (room.chatHistory.length > 500) room.chatHistory.shift();

        io.to(roomId).emit("chat_bubble", { senderId: socket.id, text: messageToSend });
        io.to(roomId).emit("room_update", room);
        
        // Clear typing status when message is sent
        socket.to(roomId).emit("opponent_stop_typing");

        // Trigger bot response if applicable
        const bot = room.players.find((p: any) => p.isBot);
        if (bot) {
          handleBotEvent(roomId, 'chat_message', { senderId: socket.id, text: messageToSend });
        }
      } else {
        console.log(`Room ${roomId} not found for chat`);
      }
    });

    socket.on("pass_turn", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.gameState === 'discussion') {
        const opponent = room.players.find((p: any) => p.id !== socket.id);
        if (opponent) {
          room.currentTurn = opponent.id;
          room.waitingForAnswerFrom = null;
          io.to(roomId).emit("room_update", room);
          
          if (opponent.isBot) {
            setTimeout(() => {
              triggerBotQuestion(roomId, opponent);
            }, 2000 + Math.random() * 2000);
          }
        }
      }
    });

    socket.on("typing", ({ roomId }) => {
      socket.to(roomId).emit("opponent_typing");
    });

    socket.on("stop_typing", ({ roomId }) => {
      socket.to(roomId).emit("opponent_stop_typing");
    });

    socket.on("submit_guess", ({ roomId, guess }) => {
      const room = rooms.get(roomId);
      if (room && room.gameState === "guessing") {
        const player = room.players.find((p: any) => p.id === socket.id);
        
        if (player) {
          const isCorrect = normalizeEgyptian(guess.trim()).toLowerCase() === normalizeEgyptian(player.targetImage.name).toLowerCase();
          
          if (isCorrect) {
            player.hasGuessed = true;
            player.lastGuess = guess;
            player.score += 500;
            io.to(roomId).emit("guess_result", { playerId: socket.id, correct: true });
            
            // Pass winner name to endGame
            endGame(roomId, player.name, false, true);
          } else {
            player.lastGuess = guess;
            io.to(roomId).emit("guess_result", { playerId: socket.id, correct: false });
          }
        }
      }
    });

    socket.on("use_card", ({ roomId, cardType, serial, isAdReward }) => {
      const room = rooms.get(roomId);
      if (!room || room.isPaused) return;

      const player = room.players.find((p: any) => p.id === socket.id);
      const opponent = room.players.find((p: any) => p.id !== socket.id);
      if (!player || !opponent) return;

      const dbPlayer = allPlayers.get(serial);
      if (dbPlayer) checkDailyReset(dbPlayer, serial, socket);
      
      const hasFreeUse = dbPlayer && dbPlayer.ownedHelpers && dbPlayer.ownedHelpers[cardType] > 0;
      const hasPro = dbPlayer && dbPlayer.proPackageExpiry && dbPlayer.proPackageExpiry > Date.now();
      const hasUnlockedHelpers = dbPlayer && dbPlayer.unlockedHelpersExpiry && dbPlayer.unlockedHelpersExpiry > Date.now();
      
      // Check if this use is from a verified ad reward
      const isVerifiedAdReward = isAdReward && room.adRewardedPowerUps && room.adRewardedPowerUps.get(socket.id) === cardType;

      // Helper function to deduct free use
      const deductFreeUse = () => {
        const requiredLevels: { [key: string]: number } = {
          'hint': 10,
          'word_length': 20,
          'time_freeze': 30,
          'word_count': 40,
          'spy_lens': 50
        };
        
        const playerLevel = getLevel(dbPlayer.xp || 0);
        const isLevelLocked = cardType !== 'quick_guess' && playerLevel < (requiredLevels[cardType] || 0);

        if (isVerifiedAdReward) {
          // Consume the ad reward
          if (room.adRewardedPowerUps) room.adRewardedPowerUps.delete(socket.id);
          
          // If they have a free use (gift), we consume it
          // This is mandatory if they are level-locked, and optional but preferred if they aren't
          if (hasFreeUse && !hasPro && !hasUnlockedHelpers) {
            if (dbPlayer.rainGiftHelpers && dbPlayer.rainGiftHelpers[cardType] > 0) {
              dbPlayer.rainGiftHelpers[cardType] -= 1;
            }
            dbPlayer.ownedHelpers[cardType] -= 1;
            if (dbPlayer.ownedHelpers[cardType] <= 0) {
              delete dbPlayer.ownedHelpers[cardType];
            }
            savePlayerData(serial);
            socket.emit("player_data_update", { serial, ownedHelpers: dbPlayer.ownedHelpers });
            
            // Update room player
            player.ownedHelpers = dbPlayer.ownedHelpers;
          }
          return;
        }
        
        if (hasFreeUse && !hasPro && !hasUnlockedHelpers) { // Only deduct if NOT Pro and NOT using Unlocked Helpers
          if (dbPlayer.rainGiftHelpers && dbPlayer.rainGiftHelpers[cardType] > 0) {
            dbPlayer.rainGiftHelpers[cardType] -= 1;
          }
          dbPlayer.ownedHelpers[cardType] -= 1;
          if (dbPlayer.ownedHelpers[cardType] <= 0) {
            delete dbPlayer.ownedHelpers[cardType];
          }
          savePlayerData(serial);
          socket.emit("player_data_update", { serial, ownedHelpers: dbPlayer.ownedHelpers });
          
          // Update room player
          player.ownedHelpers = dbPlayer.ownedHelpers;
        }
      };

      if (cardType === "hint") {
        const playerLevel = getLevel(player.xp || 0);
        if ((playerLevel >= 10 || hasFreeUse || hasPro || hasUnlockedHelpers || isVerifiedAdReward) && (!player.hintCount || player.hintCount < 2)) {
          deductFreeUse();
          if (!player.hintCount) player.hintCount = 0;
          player.hintCount++;
          player.helpersUsedCount = (player.helpersUsedCount || 0) + 1;
          const targetName = player.targetImage.name;
          const hintChar = targetName[player.hintCount - 1] || "?";
          socket.emit("hint_received", { 
            hint: `التلميح رقم ${player.hintCount}: الحرف هو "${hintChar}"`,
            count: player.hintCount
          });
          io.to(roomId).emit("room_update", room);
        }
      } else if (cardType === "quick_guess") {
        const playerLevel = getLevel(player.xp || 0);
        const threshold = getQuickGuessThreshold(playerLevel);
        if (room.timer <= threshold && !player.quickGuessUsed) {
          player.quickGuessUsed = true;
          room.isPaused = true;
          room.pausingPlayerId = socket.id;
          room.quickGuessTimer = 60;
          io.to(roomId).emit("room_update", room);
          io.to(roomId).emit("quick_guess_started", { playerId: socket.id });
        }
      } else if (cardType === "word_length") {
        const playerLevel = getLevel(player.xp || 0);
        if ((playerLevel >= 20 || hasFreeUse || hasPro || hasUnlockedHelpers || isVerifiedAdReward) && !player.wordLengthUsed) {
          deductFreeUse();
          player.wordLengthUsed = true;
          player.helpersUsedCount = (player.helpersUsedCount || 0) + 1;
          const targetName = player.targetImage.name;
          const lengthWithoutSpaces = targetName.replace(/\s+/g, '').length;
          socket.emit("word_length_result", { length: lengthWithoutSpaces });
          io.to(roomId).emit("room_update", room);
        }
      } else if (cardType === "word_count") {
        const playerLevel = getLevel(player.xp || 0);
        if ((playerLevel >= 40 || hasFreeUse || hasPro || hasUnlockedHelpers || isVerifiedAdReward) && !player.wordCountUsed) {
          deductFreeUse();
          player.wordCountUsed = true;
          player.helpersUsedCount = (player.helpersUsedCount || 0) + 1;
          const targetName = player.targetImage.name;
          const wordCount = targetName.trim().split(/\s+/).length;
          socket.emit("word_count_result", { count: wordCount });
          io.to(roomId).emit("room_update", room);
        }
      } else if (cardType === "time_freeze") {
        const playerLevel = getLevel(player.xp || 0);
        if ((playerLevel >= 30 || hasFreeUse || hasPro || hasUnlockedHelpers || isVerifiedAdReward) && !player.timeFreezeUsed && !room.isFrozen) {
          deductFreeUse();
          player.timeFreezeUsed = true;
          room.isFrozen = true;
          room.freezeTimer = 60;
          io.to(roomId).emit("freeze_started", { playerId: socket.id });
          io.to(roomId).emit("room_update", room);
        }
      } else if (cardType === "spy_lens") {
        const playerLevel = getLevel(player.xp || 0);
        if ((playerLevel >= 50 || hasFreeUse || hasPro || hasUnlockedHelpers || isVerifiedAdReward) && !player.spyLensUsed) {
          deductFreeUse();
          player.spyLensUsed = true;
          player.helpersUsedCount = (player.helpersUsedCount || 0) + 1;
          // The player wants to see their own target image (which is what the opponent sees)
          socket.emit("spy_lens_active", { image: player.targetImage.image });
          io.to(roomId).emit("room_update", room);
        }
      }
    });

    socket.on("cancel_quick_guess", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.isPaused && room.pausingPlayerId === socket.id) {
        const player = room.players.find((p: any) => p.id === socket.id);
        const playerLevel = getLevel(player.xp || 0);
        
        if (playerLevel >= 20) {
          room.isPaused = false;
          room.pausingPlayerId = null;
          room.quickGuessTimer = 0;
          
          // Refund the usage so it remains available
          if (player) {
            player.quickGuessUsed = false;
          }
          
          io.to(roomId).emit("room_update", room);
        }
      }
    });

    socket.on("ad_started", ({ roomId, powerUpName, helperId }) => {
      const room = rooms.get(roomId);
      if (room) {
        if (!room.adPausedPlayers) room.adPausedPlayers = new Set();
        
        // Only emit message if player was NOT already in adPausedPlayers
        const alreadyInAd = room.adPausedPlayers.has(socket.id);
        room.adPausedPlayers.add(socket.id);
        
        if (powerUpName) {
          if (!room.powerUpAdsInProgress) room.powerUpAdsInProgress = new Map();
          room.powerUpAdsInProgress.set(socket.id, helperId || true);
          
          if (!alreadyInAd) {
            const sender = room.players.find((p: any) => p.id === socket.id);
            if (sender) {
              const verb = (sender.gender === 'girl' || sender.gender === 'female') ? 'تقوم' : 'يقوم';
              const actionText = powerUpName === 'استلام مكافأة' 
                ? `بمشاهدة إعلان لاستلام مكافأة`
                : `بمشاهدة إعلان لفتح وسيلة مساعدة "${powerUpName}"`;
              io.to(roomId).emit("chat_bubble", { 
                senderId: "system", 
                text: `${verb} ${sender.name} ${actionText}، انتظر قليلاً.` 
              });
            }
          }
        }
      }
    });

    socket.on("ad_reward_ready", ({ roomId, helperId }) => {
      const room = rooms.get(roomId);
      if (room && room.powerUpAdsInProgress && room.powerUpAdsInProgress.has(socket.id)) {
        if (!room.adRewardedPowerUps) room.adRewardedPowerUps = new Map();
        room.adRewardedPowerUps.set(socket.id, helperId);
      }
    });

    socket.on("ad_ended", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.adPausedPlayers) {
        room.adPausedPlayers.delete(socket.id);
        
        if (room.powerUpAdsInProgress && room.powerUpAdsInProgress.has(socket.id)) {
          room.powerUpAdsInProgress.delete(socket.id);
          room.adCooldownTimer = 30; // Start 30s cooldown where game timer is paused
        }
      }
    });

    socket.on("submit_quick_guess", ({ roomId, guess }) => {
      const room = rooms.get(roomId);
      if (room && room.isPaused && room.pausingPlayerId === socket.id) {
        const player = room.players.find((p: any) => p.id === socket.id);
        const isCorrect = normalizeEgyptian(guess.trim()).toLowerCase() === normalizeEgyptian(player.targetImage.name).toLowerCase();
        
        if (isCorrect) {
          io.to(roomId).emit("guess_result", { playerId: socket.id, correct: true });
          endGame(roomId, player.name, false, true);
        } else {
          // Wrong quick guess = instant lose
          io.to(roomId).emit("guess_result", { playerId: socket.id, correct: false });
          const opponent = room.players.find((p: any) => p.id !== socket.id);
          endGame(roomId, opponent ? opponent.name : "المنافس");
        }
      }
    });

    socket.on("report_player_by_serial", ({ reporterSerial, reportedSerial, reason }, callback) => {
      const serverReportedPlayer = allPlayers.get(reportedSerial);
      const serverReporter = allPlayers.get(reporterSerial);
      
      if (serverReportedPlayer && serverReporter) {
        const now = Date.now();
        const oneDayInMs = 24 * 60 * 60 * 1000;
        
        const lastReport = serverReportedPlayer.reportedBy.find(r => r.reporterSerial === serverReporter.serial);
        
        if (!lastReport || (now - lastReport.timestamp) >= oneDayInMs) {
          if (lastReport) {
            lastReport.timestamp = now;
          } else {
            serverReportedPlayer.reportedBy.push({ reporterSerial: serverReporter.serial, timestamp: now });
          }
          
          serverReportedPlayer.reports += 1;
          
          if (!serverReporter.reportedSerials) serverReporter.reportedSerials = [];
          if (!serverReporter.reportedSerials.includes(reportedSerial)) {
            serverReporter.reportedSerials.push(reportedSerial);
          }
          
          // Save report to DB
          try {
            const reportId = Math.random().toString(36).substr(2, 9);
            db.prepare(`
              INSERT INTO reports (id, timestamp, reporterSerial, reporterName, reportedSerial, reportedName, reason, roomId)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(reportId, now, serverReporter.serial, serverReporter.name, serverReportedPlayer.serial, serverReportedPlayer.name, reason, "profile");
          } catch (err) {
            console.error("Failed to save report to DB:", err);
          }
          
          // Notify the reported player if online
          for (const [socketId, s] of io.sockets.sockets) {
            if (s.data?.serial === serverReportedPlayer.serial) {
              io.to(socketId).emit("player_data_update", { reports: serverReportedPlayer.reports });
              break;
            }
          }
          
          if (serverReportedPlayer.reports >= 10) {
            serverReportedPlayer.reports = 0; // Reset reports after ban
            serverReportedPlayer.banCount += 1;
            
            if (serverReportedPlayer.banCount >= 5) {
              serverReportedPlayer.isPermanentBan = 1;
              for (const [socketId, s] of io.sockets.sockets) {
                if (s.data?.serial === serverReportedPlayer.serial) {
                  io.to(socketId).emit("banned_status", { isPermanent: true });
                  break;
                }
              }
            } else {
              serverReportedPlayer.banUntil = now + oneDayInMs;
              for (const [socketId, s] of io.sockets.sockets) {
                if (s.data?.serial === serverReportedPlayer.serial) {
                  io.to(socketId).emit("banned_status", { banUntil: serverReportedPlayer.banUntil, isPermanent: false });
                  break;
                }
              }
            }
          }
          savePlayerData(serverReportedPlayer.serial);
          savePlayerData(serverReporter.serial);
          
          // Notify the reporter to update their reportedSerials state
          for (const [socketId, s] of io.sockets.sockets) {
            if (s.data?.serial === serverReporter.serial) {
              io.to(socketId).emit("update_reported_serials", serverReporter.reportedSerials);
              break;
            }
          }
          
          if (callback) callback({ success: true });
        } else {
          if (callback) callback({ success: false, message: 'لقد قمت بالإبلاغ عن هذا اللاعب بالفعل.' });
        }
      } else {
        if (callback) callback({ success: false, message: 'حدث خطأ أثناء معالجة الإبلاغ.' });
      }
    });

    socket.on("report_player", ({ roomId, reportedPlayerId, reason }, callback) => {
      const room = rooms.get(roomId);
      if (room) {
        const reportedPlayer = room.players.find((p: any) => p.id === reportedPlayerId);
        const reporter = room.players.find((p: any) => p.id === socket.id);
        if (reportedPlayer && reporter) {
          reportedPlayer.reported = true;
          
          // Update allPlayers data
          const serverReportedPlayer = allPlayers.get(reportedPlayer.serial);
          const serverReporter = allPlayers.get(reporter.serial);
          
          console.log(`Report attempt: Reporter=${reporter.name}(Serial: ${reporter.serial}, ID: ${reporter.id}), Reported=${reportedPlayer.name}(Serial: ${reportedPlayer.serial}, ID: ${reportedPlayer.id})`);
          console.log(`AllPlayers keys: ${Array.from(allPlayers.keys()).join(', ')}`);
          
          if (serverReportedPlayer && serverReporter) {
            const now = Date.now();
            const oneDayInMs = 24 * 60 * 60 * 1000;
            
            // Check if this reporter has already reported this player today
            const lastReport = serverReportedPlayer.reportedBy.find(r => r.reporterSerial === serverReporter.serial);
            
            if (!lastReport || (now - lastReport.timestamp) >= oneDayInMs) {
              console.log(`Report accepted for ${serverReportedPlayer.name}. Previous reports: ${serverReportedPlayer.reports}`);
              if (lastReport) {
                lastReport.timestamp = now;
              } else {
                serverReportedPlayer.reportedBy.push({ reporterSerial: serverReporter.serial, timestamp: now });
              }
              
              serverReportedPlayer.reports += 1;
              reportedPlayer.reports = serverReportedPlayer.reports;
              
              // Save report to DB
              try {
                const reportId = Math.random().toString(36).substr(2, 9);
                db.prepare(`
                  INSERT INTO reports (id, timestamp, reporterSerial, reporterName, reportedSerial, reportedName, reason, roomId)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(reportId, now, serverReporter.serial, reporter.name, serverReportedPlayer.serial, reportedPlayer.name, reason, roomId);
              } catch (err) {
                console.error("Failed to save report to DB:", err);
              }
              
              // Notify the reported player so their profile updates
              io.to(reportedPlayer.id).emit("player_data_update", { reports: serverReportedPlayer.reports });
              
              if (serverReportedPlayer.reports >= 10) {
                serverReportedPlayer.reports = 0; // Reset reports after ban
                reportedPlayer.reports = 0;
                serverReportedPlayer.banCount += 1;
                
                if (serverReportedPlayer.banCount >= 5) {
                  serverReportedPlayer.isPermanentBan = 1;
                  console.log(`Player ${serverReportedPlayer.name} has been permanently banned.`);
                  io.to(reportedPlayer.id).emit("banned_status", { isPermanent: true });
                } else {
                  serverReportedPlayer.banUntil = now + oneDayInMs;
                  console.log(`Player ${serverReportedPlayer.name} has been banned for 24 hours (Ban #${serverReportedPlayer.banCount}).`);
                  io.to(reportedPlayer.id).emit("banned_status", { banUntil: serverReportedPlayer.banUntil, isPermanent: false });
                }
              }
              savePlayerData(serverReportedPlayer.serial);
              if (callback) callback({ success: true });
            } else {
              console.log(`Report rejected: Already reported within 24h by ${serverReporter.name}`);
              if (callback) callback({ success: false, message: 'لقد قمت بالإبلاغ عن هذا اللاعب بالفعل.' });
            }
          } else {
            console.log(`Report failed: serverReportedPlayer=${!!serverReportedPlayer}, serverReporter=${!!serverReporter}`);
            if (callback) callback({ success: false, message: 'حدث خطأ أثناء معالجة الإبلاغ.' });
          }

          const report = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            roomId,
            reporterId: reporter.id,
            reporterName: reporter.name,
            reportedPlayerId: reportedPlayer.id,
            reportedPlayerName: reportedPlayer.name,
            reason
          };
          reportsList.push(report);
          console.log(`Player ${reportedPlayer.name} (${reportedPlayer.id}) reported for: ${reason} in room ${roomId}`);
          io.to(roomId).emit("room_update", room); // Update clients to reflect reported status if needed
        }
      }
    });

    socket.on("block_player_by_serial", ({ blockerSerial, blockedSerial }, callback) => {
      const serverBlocker = allPlayers.get(blockerSerial);
      const serverBlocked = allPlayers.get(blockedSerial);
      
      if (serverBlocker && serverBlocked) {
        if (!serverBlocker.blockedSerials) serverBlocker.blockedSerials = [];
        if (!serverBlocker.blockedFingerprints) serverBlocker.blockedFingerprints = [];
        
        if (!serverBlocker.blockedSerials.includes(serverBlocked.serial)) {
          serverBlocker.blockedSerials.push(serverBlocked.serial);
        }
        if (serverBlocker.recentOpponents) {
          serverBlocker.recentOpponents = serverBlocker.recentOpponents.filter((op: any) => op.serial !== blockedSerial);
        }
        if (serverBlocked.fingerprint && !serverBlocker.blockedFingerprints.includes(serverBlocked.fingerprint)) {
          serverBlocker.blockedFingerprints.push(serverBlocked.fingerprint);
        }
        
        savePlayerData(serverBlocker.serial);
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ success: false, error: 'حدث خطأ أثناء حظر اللاعب.' });
      }
    });

    socket.on("block_player", ({ roomId, blockedPlayerId }, callback) => {
      const room = rooms.get(roomId);
      if (room) {
        const blockedPlayer = room.players.find((p: any) => p.id === blockedPlayerId);
        const blocker = room.players.find((p: any) => p.id === socket.id);
        
        if (blockedPlayer && blocker) {
          const serverBlocker = allPlayers.get(blocker.serial);
          const serverBlocked = allPlayers.get(blockedPlayer.serial);
          
          if (serverBlocker && serverBlocked) {
            if (!serverBlocker.blockedSerials) serverBlocker.blockedSerials = [];
            if (!serverBlocker.blockedFingerprints) serverBlocker.blockedFingerprints = [];
            
            if (!serverBlocker.blockedSerials.includes(serverBlocked.serial)) {
              serverBlocker.blockedSerials.push(serverBlocked.serial);
            }
            if (serverBlocker.recentOpponents) {
              serverBlocker.recentOpponents = serverBlocker.recentOpponents.filter((op: any) => op.serial !== serverBlocked.serial);
            }
            if (serverBlocked.fingerprint && !serverBlocker.blockedFingerprints.includes(serverBlocked.fingerprint)) {
              serverBlocker.blockedFingerprints.push(serverBlocked.fingerprint);
            }
            
            // Mute the player immediately in the current room
            blockedPlayer.isMuted = true;
            io.to(blockedPlayer.id).emit("opponent_muted_you", true);
            io.to(roomId).emit("room_update", room);
            
            savePlayerData(blocker.serial);
            console.log(`Player ${blocker.name} blocked ${blockedPlayer.name}`);
            if (callback) callback({ success: true });
          } else {
            if (callback) callback({ success: false, error: "Player not found" });
          }
        } else {
          if (callback) callback({ success: false, error: "Player not in room" });
        }
      } else {
        if (callback) callback({ success: false, error: "Room not found" });
      }
    });

    socket.on("send_complaint", ({ text }, callback) => {
      const player = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (player) {
        // Check if already sent today
        if (player.lastComplaintAt && isSameDay(player.lastComplaintAt, Date.now())) {
          callback({ success: false, error: "لقد قمت بإرسال شكوى اليوم بالفعل." });
          return;
        }
        
        player.lastComplaintAt = Date.now();
        savePlayerData(player.serial);

        const reportId = Math.random().toString(36).substr(2, 9);
        db.prepare('INSERT INTO reports (id, timestamp, reporterSerial, reporterName, reason) VALUES (?, ?, ?, ?, ?)')
          .run(reportId, Date.now(), player.serial, player.name, text);
        callback({ success: true });
      } else {
        callback({ success: false, error: "Player not found" });
      }
    });

    socket.on("check_complaint_status", (_, callback) => {
      const player = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (player) {
        const canSend = !player.lastComplaintAt || !isSameDay(player.lastComplaintAt, Date.now());
        callback({ success: true, canSend });
      } else {
        callback({ success: false, error: "Player not found" });
      }
    });

    socket.on("leave_room", ({ roomId }, callback) => {
      const room = rooms.get(roomId);
      if (room) {
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player) {
          const opponent = room.players.find((p: any) => p.id !== socket.id);
          
          if (room.gameState !== "finished" && room.gameState !== "waiting") {
            // Player intentionally left during an active game
            const messageObj = { senderId: "system", text: `غادر ${player.name} الغرفة` };
            if (!room.chatHistory) room.chatHistory = [];
            room.chatHistory.push({ ...messageObj, senderName: "النظام", timestamp: Date.now() });
            io.to(roomId).emit("chat_bubble", messageObj);
            endGame(roomId, opponent ? opponent.name : "المنافس", true);
          } else if (room.gameState === "waiting") {
            socket.to(roomId).emit("opponent_left_lobby");
          }

          // Remove player from room
          room.players = room.players.filter((p: any) => p.id !== socket.id);

          // Stop the game for everyone and delete room to ensure fresh start
          if (intervals.has(roomId)) {
            clearInterval(intervals.get(roomId));
            intervals.delete(roomId);
          }
          
          if (room.gameState !== "finished") {
            rooms.delete(roomId);
          } else {
            // Emit room update so the remaining player knows the opponent left
            socket.to(roomId).emit("room_update", room);
          }
        }
      }
      socket.leave(roomId);
      if (callback) callback();
    });

    socket.on("leave_matchmaking", () => {
      socket.data.isSearching = false;
      const qIndex = matchmakingQueue.findIndex(p => p.id === socket.id);
      if (qIndex !== -1) matchmakingQueue.splice(qIndex, 1);

      for (const [matchId, match] of pendingMatches.entries()) {
        if (match.p1.socket.id === socket.id || match.p2.socket.id === socket.id) {
          const oppData = match.p1.socket.id === socket.id ? match.p2 : match.p1;
          clearTimeout(match.timeoutId);
          pendingMatches.delete(matchId);
          oppData.status = 'searching';
          oppData.socket.emit("match_rejected", { reason: 'opponent_left' });
          matchmakingQueue.unshift(oppData);
          processQueue();
          break;
        }
      }
    });

    socket.on("toggle_mute_opponent", ({ roomId, isMuted }) => {
      const room = rooms.get(roomId);
      if (room) {
        const opponent = room.players.find((p: any) => p.id !== socket.id);
        if (opponent) {
          io.to(opponent.id).emit("opponent_muted_you", isMuted);
        }
      }
    });

    socket.on("play_again", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.gameState === "finished") {
        // Reset room state
        room.gameState = "waiting";
        room.timer = 60;
        room.winnerId = null;
        room.isPaused = false;
        room.pausingPlayerId = null;
        room.quickGuessTimer = 0;
        
        // Reset players state
        room.players.forEach((p: any) => {
          p.targetImage = null;
          p.hasGuessed = false;
          p.selectedCategory = null;
          p.hintCount = 0;
          p.quickGuessUsed = false;
          p.wordLengthUsed = false;
          p.timeFreezeUsed = false;
          p.wordCountUsed = false;
          p.spyLensUsed = false;
          p.chatBuffer = "";
          p.engChatBuffer = "";
        });
        
        // Clear any existing intervals for this room
        if (intervals.has(roomId)) {
          clearInterval(intervals.get(roomId));
          intervals.delete(roomId);
        }
        
        startWaitingInterval(roomId);
        io.to(roomId).emit("room_update", room);
      } else if (!room) {
        socket.emit("opponent_left_lobby");
      }
    });

    socket.on("admin_get_players", (callback) => {
      const player = socket.data?.serial ? allPlayers.get(socket.data.serial) : undefined;
      console.log(`[Admin Get Players] socket.data.serial: ${socket.data?.serial}, player.isAdmin: ${player?.isAdmin}, socket.data.isAdmin: ${socket.data?.isAdmin}`);
      if (player?.isAdmin || socket.data?.isAdmin) {
        const playersWithOnlineStatus = Array.from(allPlayers.values()).map(p => ({
          ...p,
          isOnline: playerSockets.has(p.serial)
        }));
        callback(playersWithOnlineStatus);
      } else {
        console.log(`[Admin Get Players] Unauthorized for socket ${socket.id}`);
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_get_shop_items", (callback) => {
      const player = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (player?.isAdmin || socket.data?.isAdmin) {
        try {
          const items = db.prepare('SELECT * FROM shop_items ORDER BY timestamp DESC').all();
          callback(items);
        } catch (err) {
          callback({ error: "Database error" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_add_shop_item", (item, callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        try {
          const id = Math.random().toString(36).substring(2, 15);
          db.prepare('INSERT INTO shop_items (id, name, description, price, type, image, amount, active, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
            id, item.name, item.description, item.price, item.type, item.image, item.amount || 0, item.active ? 1 : 0, Date.now()
          );
          callback({ success: true, id });
        } catch (err) {
          callback({ error: "Database error" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_update_shop_item", ({ id, updates }, callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        try {
          const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
          const values = Object.values(updates).map(v => typeof v === 'boolean' ? (v ? 1 : 0) : v);
          db.prepare(`UPDATE shop_items SET ${setClause} WHERE id = ?`).run(...values, id);
          callback({ success: true });
        } catch (err) {
          console.error("Error updating shop item:", err);
          callback({ error: "Database error" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_delete_shop_item", (id, callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        try {
          db.prepare('DELETE FROM shop_items WHERE id = ?').run(id);
          callback({ success: true });
        } catch (err) {
          callback({ error: "Database error" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_get_settings", (callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        try {
          const rows = db.prepare('SELECT * FROM settings').all();
          const settings = rows.reduce((acc: any, row: any) => {
            acc[row.key] = row.value;
            return acc;
          }, {});
          callback(settings);
        } catch (err) {
          callback({ error: "Database error" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_update_settings", (settings, callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        try {
          const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
          db.transaction(() => {
            for (const [key, value] of Object.entries(settings)) {
              stmt.run(key, String(value));
            }
          })();
          
          if (settings.lucky_wheel_enabled !== undefined) {
            io.emit('app_settings', { lucky_wheel_enabled: settings.lucky_wheel_enabled === 'true' || settings.lucky_wheel_enabled === true });
          }
          
          callback({ success: true });
        } catch (err) {
          callback({ error: "Database error" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_send_announcement", (message, callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      console.log(`[Admin Send Announcement] socket.data.serial: ${socket.data?.serial}, admin.isAdmin: ${admin?.isAdmin}, socket.data.isAdmin: ${socket.data?.isAdmin}`);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        io.emit("system_announcement", message);
        callback({ success: true });
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_force_refresh", (callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      console.log(`[Admin Force Refresh] socket.data.serial: ${socket.data?.serial}, admin.isAdmin: ${admin?.isAdmin}, socket.data.isAdmin: ${socket.data?.isAdmin}`);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        io.emit("force_refresh");
        callback({ success: true });
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_update_policies", (data, callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        try {
          gamePolicies.termsAr = data.termsAr;
          gamePolicies.termsEn = data.termsEn;
          gamePolicies.privacyAr = data.privacyAr;
          gamePolicies.privacyEn = data.privacyEn;
          gamePolicies.isRainGiftEnabled = data.isRainGiftEnabled;
          
          db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('terms_policy_ar', data.termsAr);
          db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('terms_policy_en', data.termsEn);
          db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('privacy_policy_ar', data.privacyAr);
          db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('privacy_policy_en', data.privacyEn);
          db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('is_rain_gift_enabled', data.isRainGiftEnabled ? 'true' : 'false');
          
          io.emit('policies_update', gamePolicies);
          callback({ success: true });
        } catch (err) {
          console.error("Failed to update policies:", err);
          callback({ error: "Failed to update policies" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });


    socket.on("admin_set_global_reward", (rewardData, callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        try {
          const newReward = {
            id: 'reward_' + Date.now(),
            type: rewardData.type, // 'pro_package', 'unlock_helpers', or 'tokens'
            durationHours: rewardData.durationHours,
            tokenAmount: rewardData.tokenAmount || 0,
            message: rewardData.message,
            expiresAt: Date.now() + (rewardData.durationHours || 24) * 60 * 60 * 1000
          };
          activeGlobalReward = newReward;
          db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('global_reward', JSON.stringify(newReward));
          
          // Add to history
          try {
            db.prepare('INSERT INTO reward_history (id, type, durationHours, tokenAmount, expiresInDays, message, sentAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
              .run(newReward.id, newReward.type, newReward.durationHours, newReward.tokenAmount, Math.ceil(newReward.durationHours / 24), newReward.message, Date.now(), newReward.expiresAt);
          } catch (historyErr) {
            console.error("Failed to save reward history:", historyErr);
          }

          if (newReward.type === 'tokens') {
            // Only emit to level 50+ players
            io.sockets.sockets.forEach((s) => {
              const serial = s.data?.serial;
              if (serial) {
                const player = allPlayers.get(serial);
                if (player) {
                  const level = Math.floor(Math.sqrt((player.xp || 0) / 50)) + 1;
                  if (level >= 50) {
                    s.emit("global_reward_available", newReward);
                  }
                }
              }
            });
          } else {
            io.emit("global_reward_available", newReward);
          }
          callback({ success: true, reward: newReward });
        } catch (err) {
          console.error("Failed to set global reward:", err);
          callback({ error: "Failed to set reward" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_get_reward_history", (callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        try {
          const history = db.prepare('SELECT * FROM reward_history ORDER BY sentAt DESC LIMIT 20').all();
          callback(history);
        } catch (err) {
          console.error("Failed to get reward history:", err);
          callback([]);
        }
      } else {
        callback([]);
      }
    });

    socket.on("admin_cancel_global_reward", (callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        try {
          activeGlobalReward = null;
          db.prepare('DELETE FROM settings WHERE key = ?').run('global_reward');
          io.emit("global_reward_available", null); // Tell clients to remove active reward
          callback({ success: true });
        } catch (err) {
          console.error("Failed to cancel global reward:", err);
          callback({ error: "Failed to cancel reward" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("claim_global_reward", (callback) => {
      const serial = socket.data?.serial;
      if (!serial) return callback({ error: "Not logged in" });
      
      const player = allPlayers.get(serial);
      if (!player) return callback({ error: "Player not found" });

      if (!activeGlobalReward) return callback({ error: "No active reward" });
      if (activeGlobalReward.expiresAt < Date.now()) return callback({ error: "Reward expired" });

      if (!player.claimedRewards) player.claimedRewards = [];
      if (player.claimedRewards.includes(activeGlobalReward.id)) {
        return callback({ error: "Already claimed" });
      }

      // Calculate remaining time
      const now = Date.now();
      const remainingMs = Math.max(0, activeGlobalReward.expiresAt - now);
      
      if (remainingMs <= 0) {
        return callback({ error: "Reward expired" });
      }

      // Check level restriction for tokens
      const level = Math.floor(Math.sqrt((player.xp || 0) / 50)) + 1;
      if (activeGlobalReward.type === 'tokens' && level < 50) {
        return callback({ error: "هذه المكافأة مخصصة للاعبين مستوى 50 فما فوق فقط" });
      }

      // Apply reward
      if (activeGlobalReward.type === 'pro_package') {
        player.proPackageExpiry = Math.max(player.proPackageExpiry || 0, now) + remainingMs;
      } else if (activeGlobalReward.type === 'unlock_helpers') {
        player.unlockedHelpersExpiry = Math.max(player.unlockedHelpersExpiry || 0, now) + remainingMs;
      } else if (activeGlobalReward.type === 'tokens') {
        player.tokens = (player.tokens || 0) + (activeGlobalReward.tokenAmount || 0);
      }

      player.claimedRewards.push(activeGlobalReward.id);
      savePlayerData(serial);

      callback({ success: true, player });
    });

    socket.on("get_shop_items", (callback) => {
      try {
        const items = db.prepare('SELECT * FROM shop_items WHERE active = 1 ORDER BY timestamp DESC').all();
        callback(items);
      } catch (err) {
        callback([]);
      }
    });

    socket.on("admin_get_contacts", (callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        try {
          const contacts = db.prepare('SELECT * FROM contacts ORDER BY timestamp DESC').all();
          callback(contacts);
        } catch (err) {
          callback({ error: "Failed to fetch contacts" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_delete_contact", (id, callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        try {
          db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
          callback({ success: true });
        } catch (err) {
          callback({ error: "Failed to delete contact" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_get_reports", (callback) => {
      const player = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (player?.isAdmin || socket.data?.isAdmin) {
        try {
          const reports = db.prepare('SELECT * FROM reports ORDER BY timestamp DESC').all();
          callback(reports);
        } catch (err) {
          callback({ error: "Failed to fetch reports" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_delete_report", (reportId, callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        try {
          db.prepare('DELETE FROM reports WHERE id = ?').run(reportId);
          callback({ success: true });
        } catch (err) {
          callback({ error: "Failed to delete report" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_get_active_rooms", (callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      console.log(`[Admin Get Active Rooms] socket.data.serial: ${socket.data?.serial}, admin.isAdmin: ${admin?.isAdmin}, socket.data.isAdmin: ${socket.data?.isAdmin}`);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        const activeRooms = Array.from(rooms.entries())
          .filter(([id, room]) => room.gameState !== 'waiting' && room.gameState !== 'finished')
          .map(([id, room]) => ({
            id,
            players: room.players.map(p => ({
              name: p.name,
              serial: p.serial,
              avatar: p.avatar,
              xp: p.xp
            })),
            gameState: room.gameState,
            startTime: room.startTime
          }));
        callback(activeRooms);
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_join_spectator", (roomId, callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        const room = rooms.get(roomId);
        if (room) {
          socket.join(roomId);
          // Send initial room state to admin
          socket.emit('room_update', room);
          callback({ success: true });
        } else {
          callback({ error: "Room not found" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_leave_spectator", (roomId, callback) => {
      socket.leave(roomId);
      callback({ success: true });
    });

    socket.on("admin_update_player", ({ serial, updates }, callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        const player = allPlayers.get(serial);
        if (player) {
          Object.assign(player, updates);
          if (updates.xp !== undefined) player.level = getLevel(updates.xp);
          if (updates.tokens !== undefined) player.tokens = updates.tokens;
          
          if (updates.isPermanentBan === 1) {
            if (player.fingerprint || player.ip) {
              db.prepare('INSERT INTO banned_identities (fingerprint, ip, timestamp) VALUES (?, ?, ?)').run(player.fingerprint || null, player.ip || null, Date.now());
            }
          } else if (updates.isPermanentBan === 0) {
            db.prepare('DELETE FROM banned_identities WHERE (fingerprint = ? AND fingerprint IS NOT NULL) OR (ip = ? AND ip IS NOT NULL)').run(player.fingerprint || null, player.ip || null);
          }
          
          savePlayerData(serial);
          
          // Find socket ID for this player serial to send direct update
          for (const [socketId, s] of io.sockets.sockets) {
            if (s.data?.serial === serial) {
              io.to(socketId).emit("player_data_update", player);
              if (updates.isPermanentBan === 1) {
                io.to(socketId).emit("banned_status", { isPermanent: true });
              } else if (updates.banUntil && updates.banUntil > Date.now()) {
                io.to(socketId).emit("banned_status", { banUntil: updates.banUntil, isPermanent: false });
              }
              break;
            }
          }
          
          callback({ success: true });
        } else {
          callback({ error: "Player not found" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_delete_player", (serial, callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        if (allPlayers.has(serial)) {
          allPlayers.delete(serial);
          db.prepare('DELETE FROM players WHERE serial = ?').run(serial);
          
          for (const [socketId, s] of io.sockets.sockets) {
            if (s.data?.serial === serial) {
              io.to(socketId).emit("account_deleted_by_admin");
              io.to(socketId).emit("banned_status", { isPermanent: true });
              break;
            }
          }
          
          callback({ success: true });
        } else {
          callback({ error: "Player not found" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("claim_collection_reward", ({ serial, categoryId, stage }, callback) => {
      const player = allPlayers.get(serial);
      if (!player) return;

      // Check if already claimed
      const alreadyClaimed = db.prepare(`
        SELECT 1 FROM claimed_collection_rewards 
        WHERE player_serial = ? AND category_id = ? AND stage = ?
      `).get(serial, categoryId, stage);

      if (alreadyClaimed) return;

      // Verify completion
      const category = COLLECTION_DATA.find(c => c.id === categoryId);
      const targetStage = category?.stages.find(s => s.stage === stage);
      if (!category || !targetStage) return;

      const collection = db.prepare(`SELECT * FROM player_collections WHERE player_serial = ?`).all(serial);
      const collectionMap = new Map<string, number>(collection.map((c: any) => [c.image_name, c.count]));

      const isStageComplete = targetStage.images.every((imgName: string) => {
        const normImgName = normalizeEgyptian(imgName).toLowerCase();
        return (collectionMap.get(normImgName) || 0) >= 5;
      });

      if (isStageComplete) {
        db.prepare(`
          INSERT INTO claimed_collection_rewards (player_serial, category_id, stage)
          VALUES (?, ?, ?)
        `).run(serial, categoryId, stage);

        player.xp = (player.xp || 0) + targetStage.reward.xp;
        player.level = getLevel(player.xp);
        savePlayerData(serial);

        socket.emit("collection_reward_claimed", {
          categoryName: category.name,
          stage: stage,
          xp: targetStage.reward.xp,
          frame: targetStage.reward.frame
        });
      }
    });

    socket.on("admin_set_admin_status", ({ serial, isAdmin, email, adminToken }, callback) => {
      // This is a special event to bootstrap the first admin or manage others
      // For security, it should check if the requester is already an admin OR if it's the first one
      const admin = serial ? allPlayers.get(serial) : (socket.data?.serial ? allPlayers.get(socket.data.serial) : undefined);
      
      const isValidToken = adminToken && adminTokens.has(adminToken);
      const isDefaultAdmin = email === 'adhamsabry.co@gmail.com';
      
      if (admin?.isAdmin || isValidToken || isDefaultAdmin) {
        socket.data = { ...socket.data, isAdmin: true, email: email || admin?.email, serial: serial || admin?.serial };

        if (serial) {
          const player = allPlayers.get(serial);
          if (player) {
            player.isAdmin = isAdmin;
            player.email = email;
            savePlayerData(serial);
            const players = Array.from(allPlayers.values()).map(p => ({
              ...p,
              isOnline: playerSockets.has(p.serial)
            }));
            const reports = db.prepare('SELECT * FROM reports ORDER BY timestamp DESC').all();
            if (typeof callback === 'function') callback({ success: true, players, reports });
            return;
          }
        }
        
        if (isValidToken) {
           const players = Array.from(allPlayers.values()).map(p => ({
             ...p,
             isOnline: playerSockets.has(p.serial)
           }));
           const reports = db.prepare('SELECT * FROM reports ORDER BY timestamp DESC').all();
           if (typeof callback === 'function') callback({ success: true, players, reports });
        } else {
           if (typeof callback === 'function') callback({ error: "Player not found" });
        }
      } else {
        if (typeof callback === 'function') callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_request_db_download", (callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        const downloadToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        adminTokens.add(downloadToken);
        console.log(`[DB Download] Generated token ${downloadToken} for admin ${admin?.serial || socket.data?.serial}`);
        // Token expires in 5 minutes
        setTimeout(() => adminTokens.delete(downloadToken), 1000 * 60 * 5);
        callback({ success: true, token: downloadToken });
      } else {
        console.log(`[DB Download] Unauthorized request from socket ${socket.id}`);
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("admin_request_uploads_download", (callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        const downloadToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        adminTokens.add(downloadToken);
        console.log(`[Uploads Download] Generated token ${downloadToken} for admin ${admin?.serial || socket.data?.serial}`);
        // Token expires in 5 minutes
        setTimeout(() => adminTokens.delete(downloadToken), 1000 * 60 * 5);
        callback({ success: true, token: downloadToken });
      } else {
        console.log(`[Uploads Download] Unauthorized request from socket ${socket.id}`);
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("set_player_serial_for_socket", (serial) => {
      socket.data = { ...socket.data, serial };
      if (serial) {
        const serverPlayer = allPlayers.get(serial);
        const isAdmin = (serverPlayer && serverPlayer.isAdmin === true) || !!socket.data?.isAdmin;

        if (!isAdmin) {
            // Disconnect old socket if it exists
            const oldSocketId = playerSockets.get(serial);
            if (oldSocketId && oldSocketId !== socket.id) {
                const oldSocket = io.sockets.sockets.get(oldSocketId);
                if (oldSocket) {
                    oldSocket.disconnect(true);
                }
            }
        }
        playerSockets.set(serial, socket.id);
        broadcastOnlineCount();
      }
    });

    socket.on("intentional_leave", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room) {
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player) {
          player.intentionallyLeft = true;
          // We don't disconnect here, we let the client disconnect or navigate
        }
      }
    });

    socket.on("disconnect", (reason) => {
      socket.data.isSearching = false;
      if (socket.data?.serial) {
        if (playerSockets.get(socket.data.serial) === socket.id) {
          playerSockets.delete(socket.data.serial);
        }
      }
      broadcastOnlineCount();
      // Remove from matchmaking queue
      const qIndex = matchmakingQueue.findIndex(p => p.id === socket.id);
      if (qIndex !== -1) matchmakingQueue.splice(qIndex, 1);

      for (const [matchId, match] of pendingMatches.entries()) {
        if (match.p1.socket.id === socket.id || match.p2.socket.id === socket.id) {
          const oppData = match.p1.socket.id === socket.id ? match.p2 : match.p1;
          clearTimeout(match.timeoutId);
          pendingMatches.delete(matchId);
          oppData.status = 'searching';
          oppData.socket.emit("match_rejected", { reason: 'opponent_disconnected' });
          matchmakingQueue.unshift(oppData);
          processQueue();
          break;
        }
      }

      rooms.forEach((room, roomId) => {
        const index = room.players.findIndex((p: any) => p.id === socket.id);
        if (index !== -1) {
          const leavingPlayer = room.players[index];
          const opponent = room.players.find((p: any) => p.id !== socket.id);
          
          // Logic for Token deduction:
          // 1. Game must have started (gameState is not waiting or finished)
          // 2. Disconnect is intentional (client namespace disconnect OR intentionallyLeft flag)
          const isIntentional = reason === 'client namespace disconnect' || leavingPlayer.intentionallyLeft;
          
          if (room.gameState !== "finished" && room.gameState !== "waiting") {
            if (isIntentional) {
              if (leavingPlayer.useToken && (Date.now() - room.startTime < 120000)) {
                io.to(roomId).emit("chat_bubble", { senderId: "system", text: `تم معاقبة ${leavingPlayer.name} لانسحابه المبكر!` });
              } else {
                io.to(roomId).emit("chat_bubble", { senderId: "system", text: `غادر ${leavingPlayer.name} الغرفة` });
              }
            } else {
              io.to(roomId).emit("chat_bubble", { senderId: "system", text: `انقطع اتصال ${leavingPlayer.name}` });
            }
            // Always end game with opponent as winner
            endGame(roomId, opponent ? opponent.name : "المنافس", true);
          }

          // Now remove the player and cleanup
          room.players.splice(index, 1);
          
          if (intervals.has(roomId)) {
            clearInterval(intervals.get(roomId));
            intervals.delete(roomId);
          }
          
          if (room.gameState === "waiting") {
            socket.to(roomId).emit("opponent_left_lobby");
          }
          
          if (room.gameState !== "finished") {
            rooms.delete(roomId);
          } else {
            // Emit room update so the remaining player knows the opponent left
            socket.to(roomId).emit("room_update", room);
          }
        }
      });
    });
  });

  function startWaitingInterval(roomId: string) {
    if (intervals.has(roomId)) {
      clearInterval(intervals.get(roomId));
      intervals.delete(roomId);
    }

    const room = rooms.get(roomId);
    if (room) room.timer = 60;

    const interval = setInterval(() => {
      const r = rooms.get(roomId);
      if (!r) {
        clearInterval(interval);
        return;
      }

      if (r.gameState === "waiting") {
        if (r.timer > 0) {
          r.timer--;
          io.to(roomId).emit("timer_update", r.timer);
        } else {
          clearInterval(interval);
          io.to(roomId).emit("game_stopped", { reason: "انتهى الوقت! لم يتم الاتفاق على فئة." });
          rooms.delete(roomId);
        }
      } else {
        clearInterval(interval);
      }
    }, 1000);
    
    intervals.set(roomId, interval);
  }

  function getCategoryImages(category: string) {
    try {
      const customImages = db.prepare('SELECT name, data as image, timestamp FROM custom_images WHERE category = ?').all(category);
      return customImages;
    } catch (err) {
      console.error("Error fetching custom images:", err);
      return [];
    }
  }

  function startGame(roomId: string) {
    const room = rooms.get(roomId);
    if (!room || room.gameState !== 'waiting') return;

    // Always ensure room.category matches the agreed category if players have agreed
    const p1 = room.players[0];
    const p2 = room.players[1];
    if (p1.selectedCategory && p1.selectedCategory === p2.selectedCategory) {
      room.category = p1.selectedCategory;
    }

    if (!room.category) {
      console.error(`[StartGame] No category selected for room ${roomId}`);
      io.to(roomId).emit("game_stopped", { reason: "لم يتم اختيار فئة للمباراة." });
      rooms.delete(roomId);
      return;
    }

    const categoryImages = getCategoryImages(room.category);
    console.log(`[StartGame] Room ${roomId} category: ${room.category}, Found images: ${categoryImages.length}`);
    
    // Priority logic: images from last 3 days get 3x probability
    const pool: any[] = [];
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    
    categoryImages.forEach((img: any) => {
      pool.push(img);
      if (img.timestamp && img.timestamp > threeDaysAgo) {
        pool.push(img); // Extra chance 1
        pool.push(img); // Extra chance 2
      }
    });

    const shuffled = pool.length > 0 ? [...pool].sort(() => 0.5 - Math.random()) : [];
    
    if (shuffled.length === 0) {
      io.to(roomId).emit("game_stopped", { reason: "لا توجد صور في هذه الفئة حالياً." });
      rooms.delete(roomId);
      return;
    }

    console.log(`[startGame] Starting game in room ${roomId}. Category: ${room.category}`);
    
    room.players[0].targetImage = shuffled[0];
    // Ensure different image if possible
    let secondIdx = 1 % shuffled.length;
    if (shuffled.length > 1) {
      while (shuffled[secondIdx].name === shuffled[0].name && secondIdx < shuffled.length - 1) {
        secondIdx++;
      }
    }
    room.players[1].targetImage = shuffled[secondIdx];

    room.players.forEach((p: any, idx: number) => {
      console.log(`[startGame] Player ${idx}: "${p.playerName}" (isBot: ${p.isBot}), Target Image: "${p.targetImage?.name}"`);
    });

    // Get English translations for cheating prevention (background)
    room.players.forEach(async (p: any) => {
      if (p.targetImage && p.targetImage.name) {
        try {
          const response = await genAI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Translate this Arabic word to English (one word only, lowercase): ${p.targetImage.name}`,
          });
          const translated = response.text?.trim().toLowerCase();
          if (translated && translated.length > 2) {
            p.targetImage.englishName = translated;
            console.log(`[Cheat Prevention] Translated "${p.targetImage.name}" to "${translated}"`);
          }
        } catch (e) {
          console.error("Translation error for cheat prevention:", e);
        }
      }
    });

    room.players[0].hintCount = 0;
    room.players[1].hintCount = 0;
    room.players[0].quickGuessUsed = false;
    room.players[1].quickGuessUsed = false;
    room.players[0].chatBuffer = "";
    room.players[1].chatBuffer = "";
    room.players[0].engChatBuffer = "";
    room.players[1].engChatBuffer = "";
    
    room.gameState = "discussion";
    room.timer = 600; // 10 minutes
    room.startTime = Date.now();
    room.isPaused = false;
    room.lastUpdates = null;
    room.currentTurn = room.players[0].id;
    room.waitingForAnswerFrom = null;

    io.to(roomId).emit("room_update", room);
    io.to(roomId).emit("game_started"); // Signal client to start initial cooldowns

    // Trigger bot if applicable
    const bot = room.players.find((p: any) => p.isBot);
    if (bot) {
      handleBotEvent(roomId, 'game_started', null);
    }

    if (intervals.has(roomId)) {
      clearInterval(intervals.get(roomId));
      intervals.delete(roomId);
    }
    
    const interval = setInterval(() => {
      // Handle Ad Pause (highest priority - pauses everything)
      if (room.adPausedPlayers && room.adPausedPlayers.size > 0) {
        return; // Skip all timer decrements
      }

      // Handle Ad Cooldown Pause (pauses everything)
      if (room.adCooldownTimer > 0) {
        room.adCooldownTimer--;
        io.to(roomId).emit("ad_cooldown_update", room.adCooldownTimer);
        return; // Skip all timer decrements
      }

      if (room.isPaused) {
        if (room.quickGuessTimer > 0) {
          room.quickGuessTimer--;
        }
        
        if (room.quickGuessTimer <= 0) {
          room.isPaused = false;
          const pausingPlayerId = room.pausingPlayerId;
          room.pausingPlayerId = null;
          
          // If timer runs out, the player who paused loses
          const opponent = room.players.find((p: any) => p.id !== pausingPlayerId);
          endGame(roomId, opponent ? opponent.name : "المنافس");
        } else {
          io.to(roomId).emit("quick_guess_timer_update", room.quickGuessTimer);
        }
        return;
      }

      // Handle Time Freeze
      if (room.isFrozen) {
        if (room.freezeTimer > 0) {
          room.freezeTimer--;
          io.to(roomId).emit("freeze_timer_update", room.freezeTimer);
        } else {
          room.isFrozen = false;
          room.freezeTimer = 0;
          io.to(roomId).emit("freeze_ended");
        }
        return; // Skip main timer decrement
      }

      if (room.timer > 0) {
        room.timer--;
      }

      if (room.timer <= 0) {
        if (room.gameState === "discussion") {
          room.gameState = "guessing";
          room.timer = 60;
          io.to(roomId).emit("room_update", room);
          
          // Trigger bot guessing if applicable
          const bot = room.players.find((p: any) => p.isBot);
          if (bot) {
            startBotGuessing(roomId);
          }
        } else {
          if (intervals.has(roomId)) {
            clearInterval(intervals.get(roomId));
            intervals.delete(roomId);
          }
          endGame(roomId, null);
        }
      } else {
        io.to(roomId).emit("timer_update", room.timer);
      }
    }, 1000);
    
    intervals.set(roomId, interval);
  }

  function recordCollectionWin(playerSerial: string, imageName: string) {
    try {
      const normalizedName = normalizeEgyptian(imageName).toLowerCase();
      
      // Find category and stage
      let targetCategory: any = null;
      let targetStage: any = null;
      for (const category of COLLECTION_DATA) {
        for (const stage of category.stages) {
          if (stage.images.some(img => normalizeEgyptian(img).toLowerCase() === normalizedName)) {
            targetCategory = category;
            targetStage = stage;
            break;
          }
        }
        if (targetCategory) break;
      }
      
      if (!targetCategory || !targetStage) return; // Should not happen

      // Check if stage is unlocked
      if (targetStage.stage > 1) {
        const previousStageClaimed = db.prepare(`
          SELECT 1 FROM claimed_collection_rewards 
          WHERE player_serial = ? AND category_id = ? AND stage = ?
        `).get(playerSerial, targetCategory.id, targetStage.stage - 1);
        
        if (!previousStageClaimed) {
          console.log(`[Collection] Stage ${targetStage.stage} not unlocked for ${playerSerial}`);
          return; // Stage not unlocked
        }
      }

      // 1. Increment count
      db.prepare(`
        INSERT INTO player_collections (player_serial, image_name, count)
        VALUES (?, ?, 1)
        ON CONFLICT(player_serial, image_name) DO UPDATE SET count = count + 1
      `).run(playerSerial, normalizedName);

      // 2. Check for rewards
      const collection = db.prepare(`SELECT * FROM player_collections WHERE player_serial = ?`).all(playerSerial);
      const collectionMap = new Map<string, number>(collection.map((c: any) => [c.image_name, c.count]));

      for (const category of COLLECTION_DATA) {
        for (const stage of category.stages) {
          // Check if all images in this stage have count >= 5
          const isStageComplete = stage.images.every(imgName => {
            const normImgName = normalizeEgyptian(imgName).toLowerCase();
            return (collectionMap.get(normImgName) || 0) >= 5;
          });

          if (isStageComplete) {
            console.log(`[Collection] Stage ${stage.stage} complete for ${playerSerial}`);
            // Check if already claimed
            const alreadyClaimed = db.prepare(`
              SELECT 1 FROM claimed_collection_rewards 
              WHERE player_serial = ? AND category_id = ? AND stage = ?
            `).get(playerSerial, category.id, stage.stage);

            if (!alreadyClaimed) {
              console.log(`[Collection] Reward ready to be claimed for stage ${stage.stage} by ${playerSerial}`);
            } else {
              console.log(`[Collection] Reward already claimed for stage ${stage.stage} by ${playerSerial}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error recording collection win:", error);
    }
  }

  function endGame(roomId: string, winnerName: string | null, isForced: boolean = false, isTrueWin: boolean = false) {
    const room = rooms.get(roomId);
    if (room) {
      if (room.gameState === "finished") return;
      if (intervals.has(roomId)) {
        clearInterval(intervals.get(roomId));
        intervals.delete(roomId);
      }
      room.gameState = "finished";
      const winner = room.players.find((p: any) => p.name === winnerName);
      const loser = room.players.find((p: any) => p.name !== winnerName);
      
      room.winnerId = winner ? winner.id : null;

      // Calculate updates
      const updates: any = {};
      const duration = room.startTime ? Date.now() - room.startTime : 0;
      const scale = Math.min(1, duration / 600000);
      const isEarlyForfeit = isForced && duration < 300000 && winnerName !== null;
      const shouldScale = (isForced && duration < 300000) || winnerName === null;
      let refundWinnerToken = false;
      
      if (winnerName === null) {
        // Draw
        room.players.forEach((p: any) => {
          let drawXP = (!shouldScale) ? 20 : Math.floor(20 * scale);
          if (p.level >= 50 && !p.useToken) {
            drawXP = 0;
          }
          p.xp = (p.xp || 0) + drawXP;
          p.level = getLevel(p.xp);
          p.streak = 0;
          updates[p.id] = { xp: drawXP, streak: 0, wins: p.wins || 0, won: false, level: p.level };
        });
      } else {
        if (winner) {
          let baseXP = 100 + (winner.streak || 0) * 10;
          let winnerXP = (!shouldScale) ? baseXP : Math.floor(baseXP * scale);
          
          // Level 50+ Logic:
          // If level >= 50 and NO token used -> NO XP gain
          // If level >= 50 and token used -> Normal XP + 500 Bonus
          // If level < 50 -> Normal XP (and bonus if token used)
          
          if (isEarlyForfeit && winner.level >= 50) {
             winnerXP = 0; // No XP gained on early forfeit for 50+
             if (winner.useToken) {
                 refundWinnerToken = true; // Refund token for level 50+
             }
          } else if (winner.level >= 50 && !winner.useToken) {
             winnerXP = 0; // Cap progress if no token used at level 50+
          } else if (winner.useToken) {
             let bonus = (!shouldScale) ? 500 : Math.floor(500 * scale);
             winnerXP += bonus; // Bonus XP for using token
          }

          winner.xp = (winner.xp || 0) + winnerXP;
          winner.level = getLevel(winner.xp);
          
          if (isTrueWin) {
            winner.streak = (winner.streak || 0) + 1;
            winner.wins = (winner.wins || 0) + 1;
            // Record collection win
            if (winner.serial && winner.targetImage) {
              recordCollectionWin(winner.serial, winner.targetImage.name);
            }
          }
          
          updates[winner.id] = { xp: winnerXP, streak: winner.streak, wins: winner.wins, won: true, level: winner.level, useToken: winner.useToken };
        }
        if (loser) {
          let loserXP = (!shouldScale) ? 20 : Math.floor(20 * scale);
          
          // Level 50+ Logic for loser:
          // If level >= 50 and NO token used -> NO XP gain (even the small loser XP)
          if (loser.level >= 50 && !loser.useToken) {
              loserXP = 0;
          }

          loser.xp = (loser.xp || 0) + loserXP;
          loser.level = getLevel(loser.xp);
          loser.streak = 0;
          updates[loser.id] = { xp: loserXP, streak: 0, wins: loser.wins || 0, won: false, level: loser.level, useToken: loser.useToken };
        }
      }

      room.lastUpdates = updates;
      io.to(roomId).emit("room_update", room);

      // Clear bot intervals and timeouts
      if (botIntervals.has(roomId)) {
        clearInterval(botIntervals.get(roomId));
        botIntervals.delete(roomId);
      }
      if (botTimeouts.has(roomId + '_agree_timeout')) {
        clearTimeout(botTimeouts.get(roomId + '_agree_timeout'));
        botTimeouts.delete(roomId + '_agree_timeout');
      }
      botConversations.delete(roomId);
      botConversations.delete(roomId + '_category_triggered');

      // Update allPlayers leaderboard
      room.players.forEach((p: any) => {
        if (p.isBot) return; // Skip bots
        
        const opponent = room.players.find((op: any) => op.id !== p.id);
        
        // Find player by serial if we had it
        const player = allPlayers.get(p.serial || "");
        if (player) {
          player.xp = p.xp;
          player.level = getLevel(p.xp);
          player.wins = p.wins || 0;
          player.streak = p.streak || 0;
          
          if (opponent && !opponent.isBot && opponent.serial) {
            if (!player.recentOpponents) {
              player.recentOpponents = [];
            }
            // Remove if already exists to move to top
            player.recentOpponents = player.recentOpponents.filter(op => op.serial !== opponent.serial);
            player.recentOpponents.unshift({
              serial: opponent.serial,
              name: opponent.name,
              avatar: opponent.avatar,
              selectedFrame: opponent.selectedFrame || '',
              timestamp: Date.now(),
              level: opponent.level || getLevel(opponent.xp || 0),
              xp: opponent.xp || 0
            });
            if (player.recentOpponents.length > 10) {
              player.recentOpponents = player.recentOpponents.slice(0, 10);
            }
          }
          
          savePlayerData(p.serial);
          
          // Deduct token logic:
          // Always deduct if useToken was true, regardless of win/loss/level
          if (p.useToken && (player.tokens || 0) > 0) {
            const isRefundedWinner = (p.id === winner?.id) && refundWinnerToken;
            if (!isRefundedWinner) {
              if (player.rainGiftTokens && player.rainGiftTokens > 0) {
                player.rainGiftTokens -= 1;
              }
              player.tokens = (player.tokens || 0) - 1;
            }
          }
          
          if (updates[p.id]) {
            updates[p.id].tokens = player.tokens || 0;
          }
          
          savePlayerData(player.serial);
          
          // Emit updated data to the player
          for (const [socketId, s] of io.sockets.sockets) {
            if (s.data?.serial === player.serial) {
              io.to(socketId).emit("player_data_update", { 
                serial: player.serial, 
                ownedHelpers: player.ownedHelpers,
                xp: player.xp,
                level: player.level,
                wins: player.wins,
                tokens: player.tokens,
                recentOpponents: player.recentOpponents
              });
              break;
            }
          }
        } else {
          // Fallback to name search
          for (const [serial, data] of allPlayers.entries()) {
            if (data.name === p.name) {
              data.xp = p.xp;
              data.level = getLevel(p.xp);
              data.wins = p.wins || 0;
              
              if (opponent && !opponent.isBot && opponent.serial) {
                if (!data.recentOpponents) {
                  data.recentOpponents = [];
                }
                data.recentOpponents = data.recentOpponents.filter(op => op.serial !== opponent.serial);
                data.recentOpponents.unshift({
                  serial: opponent.serial,
                  name: opponent.name,
                  avatar: opponent.avatar,
                  selectedFrame: opponent.selectedFrame || '',
                  timestamp: Date.now(),
                  level: opponent.level || getLevel(opponent.xp || 0),
                  xp: opponent.xp || 0
                });
                if (data.recentOpponents.length > 10) {
                  data.recentOpponents = data.recentOpponents.slice(0, 10);
                }
              }
              
              if (p.useToken && (data.tokens || 0) > 0) {
                data.tokens = (data.tokens || 0) - 1;
              }
              
              if (updates[p.id]) {
                updates[p.id].tokens = data.tokens || 0;
              }
              
              savePlayerData(serial);
              
              // Emit updated data to the player
              for (const [socketId, s] of io.sockets.sockets) {
                if (s.data?.serial === serial) {
                  io.to(socketId).emit("player_data_update", { 
                    serial: serial, 
                    ownedHelpers: data.ownedHelpers,
                    xp: data.xp,
                    level: data.level,
                    wins: data.wins,
                    tokens: data.tokens,
                    recentOpponents: data.recentOpponents
                  });
                  break;
                }
              }
              break;
            }
          }
        }
      });

      io.to(roomId).emit("game_finished", { 
        room, 
        winnerId: room.winnerId,
        updates
      });
    }
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist"), {
      setHeaders: (res, path) => {
        if (path.endsWith('.html') || path.endsWith('sw.js') || path.endsWith('manifest.webmanifest') || path.endsWith('manifest.json') || path.endsWith('icon-v2.svg')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get("*", (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      const indexPath = path.join(__dirname, "dist", "index.html");
      if (fs.existsSync(indexPath)) {
        let content = fs.readFileSync(indexPath, 'utf-8');
        const version = configCache.version || '1.1.1';
        const versionDash = version.replace(/\./g, '-');
        content = content.replace(/\{\{VERSION\}\}/g, version);
        content = content.replace(/\{\{VERSION_DASH\}\}/g, versionDash);
        res.send(content);
      } else {
        // Fallback for development if dist doesn't exist yet
        res.status(404).send("Application not built yet. Please wait.");
      }
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1); // Exit with a non-zero code to indicate failure
  }
}

startServer();
