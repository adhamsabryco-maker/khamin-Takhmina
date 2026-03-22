import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Database from 'better-sqlite3';
import multer from "multer";
import admin from 'firebase-admin';

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

import { filterProfanity } from "./src/profanityFilter";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key_to_prevent_crash" });
if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not set. AI features will not work.");
}

const BOT_PERSONAS = [
  { name: "زيزو", age: 22, level: 15, avatar: "avatar-free-02.png", gender: "boy", personality: "هزار وفرفشة، بيحب يستخدم كلمات زي 'يا زميلي' و 'يا صاحبي' و 'أنجز يا وحش'" },
  { name: "منة", age: 20, level: 8, avatar: "avatar-free-01.png", gender: "girl", personality: "هادية ومركزة، كلامها قليل ومحدد، بتستخدم 'أيوة' و 'لأ' و 'مش عارفة'" },
  { name: "أبو مكة", age: 35, level: 42, avatar: "avatar-lvl-20.png", gender: "boy", personality: "حريف وقديم في اللعبة، كلامه فيه حكمة شوية وبيحب يشجع المنافس 'عاش يا بطل'" },
  { name: "حمو", age: 19, level: 5, avatar: "avatar-free-04.png", gender: "boy", personality: "لسه جديد وبيتعلم، بيغلط كتير وبيهزر على نفسه 'أنا ضايع خالص يا جدعان'" },
  { name: "سارة", age: 24, level: 25, avatar: "avatar-lvl-10.png", gender: "girl", personality: "ذكية وبتحب التحدي، بتسأل أسئلة صعبة وبتحاول توقع المنافس في الغلط" },
  { name: "ميدو", age: 21, level: 12, avatar: "avatar-lvl-40.png", gender: "boy", personality: "بيحب الرغي والكلام الجانبي، ممكن يحكي موقف حصل معاه وهو بيلعب" },
  { name: "نور", age: 23, level: 18, avatar: "avatar-free-03.png", gender: "girl", personality: "بتحب الضحك والهزار، بس ذكية جداً في اللعب" },
  { name: "ليلى", age: 26, level: 30, avatar: "avatar-lvl-30.png", gender: "girl", personality: "جدية شوية، بس بتحب المنافسة الشريفة" }
];

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
    .replace(/لآ/g, "لا")
    .replace(/[ضظط]/g, "ظ");
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

const adminTokens = new Set<string>();

async function startServer() {
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
  let currentVersion = '1.1.1';
  if (fs.existsSync(APP_VERSION_FILE)) {
    try {
      const vData = JSON.parse(fs.readFileSync(APP_VERSION_FILE, 'utf-8'));
      currentVersion = vData.version || '1.1.1';
    } catch (e) {
      console.error("Error reading version.json:", e);
    }
  }

  let configCache = { avatars: {}, frames: {}, stars: {}, aiBotEnabled: false, version: currentVersion };
  let activeGlobalReward: any = null;
  let gamePolicies = {
    termsAr: "الشروط والأحكام الافتراضية للعبة خمن تخمينة.\n\n1. يجب احترام جميع اللاعبين.\n2. يمنع استخدام أي برامج مساعدة أو غش.\n3. الإدارة غير مسؤولة عن أي خسارة للبيانات.",
    termsEn: "Default Terms and Conditions for Guess Guess game.\n\n1. All players must be respected.\n2. Use of any helper programs or cheating is prohibited.\n3. The administration is not responsible for any data loss.",
    privacyAr: "سياسة الخصوصية للعبة خمن تخمينة.\n\n1. نحن نقوم بجمع بياناتك الأساسية مثل الاسم والصورة الرمزية.\n2. لا نقوم بمشاركة بياناتك مع أي طرف ثالث.\n3. يتم استخدام البيانات لتحسين تجربة اللعب فقط.",
    privacyEn: "Privacy Policy for Guess Guess game.\n\n1. We collect your basic data such as name and avatar.\n2. We do not share your data with any third party.\n3. Data is used only to improve the gaming experience."
  };
  const configPath = path.join(__dirname, 'public/uploads/config.json');
  if (fs.existsSync(configPath)) {
    try {
      configCache = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (!configCache.version) configCache.version = currentVersion;
    } catch (e) {
      console.error("Error reading config:", e);
    }
  }

  // Dynamic manifest.json to support versioning
  app.get("/manifest.json", (req, res) => {
    const version = configCache.version || '1.1.1';
    res.json({
      "name": "خمن تخمينة",
      "short_name": "خمن تخمينة",
      "description": "لعبة تخمين كلمات ممتعة",
      "start_url": "/",
      "display": "standalone",
      "background_color": "#ffffff",
      "theme_color": "#ffffff",
      "icons": [
        {
          "src": `/icon.svg?v=${version}`,
          "sizes": "any",
          "type": "image/svg+xml"
        },
        {
          "src": `/icon.svg?v=${version}`,
          "sizes": "192x192",
          "type": "image/svg+xml",
          "purpose": "any maskable"
        },
        {
          "src": `/icon.svg?v=${version}`,
          "sizes": "512x512",
          "type": "image/svg+xml",
          "purpose": "any maskable"
        }
      ]
    });
  });

  app.post("/api/config", (req, res) => {
    console.log('[API] Received config update:', req.body);
    configCache = req.body;
    fs.writeFileSync(configPath, JSON.stringify(req.body));
    
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

  app.get("/api/config", (req, res) => {
    res.json(configCache);
  });

  app.get("/api/version", (req, res) => {
    res.json({ version: configCache.version || '1.1.1' });
  });

  app.get("/api/maintenance", (req, res) => {
    res.json({ maintenance: process.env.MAINTENANCE_MODE === 'true' });
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
        // Remove token after 2 hours
        setTimeout(() => adminTokens.delete(adminToken as string), 1000 * 60 * 60 * 2);
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
    blockedFingerprints?: string[]
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
  try { db.exec(`ALTER TABLE players ADD COLUMN dailyQuestStreak INTEGER DEFAULT 1`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN lastDailyClaim INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN weeklyTokensClaimed INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN lastWeeklyTokenReset INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN proPackageExpiry INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN unlockedHelpersExpiry INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN claimedRewards TEXT DEFAULT '[]'`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN lastRenameAt INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN pendingAvatar TEXT`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN avatarStatus TEXT DEFAULT 'approved'`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN lastComplaintAt INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN lastContactAt INTEGER DEFAULT 0`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN blockedSerials TEXT DEFAULT '[]'`); } catch (e) {}
  try { db.exec(`ALTER TABLE players ADD COLUMN blockedFingerprints TEXT DEFAULT '[]'`); } catch (e) {}

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
    ];
    const insertCat = db.prepare('INSERT INTO categories (id, name, icon, timestamp) VALUES (?, ?, ?, ?)');
    const insertManyCats = db.transaction((cats) => {
      for (const cat of cats) {
        insertCat.run(cat.id, cat.name, cat.icon, Date.now());
      }
    });
    insertManyCats(defaultCategories);
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

  const insertPlayer = db.prepare(`
    INSERT OR REPLACE INTO players (serial, name, avatar, xp, wins, level, gender, fingerprint, ip, reports, banUntil, banCount, isPermanentBan, reportedBy, email, isAdmin, tokens, adsWatchedToday, lastAdWatchDate, ownedHelpers, dailyQuestStreak, lastDailyClaim, weeklyTokensClaimed, lastWeeklyTokenReset, proPackageExpiry, unlockedHelpersExpiry, claimedRewards, lastRenameAt, pendingAvatar, avatarStatus, lastComplaintAt, lastContactAt, blockedSerials, blockedFingerprints)
    VALUES (@serial, @name, @avatar, @xp, @wins, @level, @gender, @fingerprint, @ip, @reports, @banUntil, @banCount, @isPermanentBan, @reportedBy, @email, @isAdmin, @tokens, @adsWatchedToday, @lastAdWatchDate, @ownedHelpers, @dailyQuestStreak, @lastDailyClaim, @weeklyTokensClaimed, @lastWeeklyTokenReset, @proPackageExpiry, @unlockedHelpersExpiry, @claimedRewards, @lastRenameAt, @pendingAvatar, @avatarStatus, @lastComplaintAt, @lastContactAt, @blockedSerials, @blockedFingerprints)
  `);

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
        blockedFingerprints: JSON.stringify(player.blockedFingerprints || [])
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
        blockedFingerprints: JSON.stringify(player.blockedFingerprints || [])
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
          blockedFingerprints: JSON.parse(row.blockedFingerprints || '[]')
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

  function broadcastOnlineCount() {
    io.emit('online_count', io.engine.clientsCount);
  }

  app.get("/api/reports", (req, res) => {
    res.json(reportsList);
  });

  app.get("/api/admin/players", (req, res) => {
    res.json(Array.from(allPlayers.values()));
  });

  // Paymob Integration
  app.post("/api/paymob/initiate", async (req, res) => {
    try {
      const { itemId, playerSerial } = req.body;
      const player = allPlayers.get(playerSerial);
      if (!player) return res.status(404).json({ error: "Player not found" });

      const item = db.prepare('SELECT * FROM shop_items WHERE id = ? AND active = 1').get(itemId) as any;
      if (!item) return res.status(404).json({ error: "Item not found" });

      // Fetch settings directly from DB to ensure we get the latest values
      const settingsRows = db.prepare('SELECT * FROM settings').all();
      const settings = settingsRows.reduce((acc: any, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      if (!settings.paymob_api_key || !settings.paymob_integration_id) {
        return res.status(500).json({ error: "Paymob settings not configured" });
      }

      // 1. Authentication
      const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: settings.paymob_api_key })
      });
      const authData = await authRes.json();
      const authToken = authData.token;

      // 2. Order Registration
      const amountCents = Math.round(item.price * 100);
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
            amount_cents: amountCents,
            description: item.description,
            quantity: "1"
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
            apartment: "NA", email: player.email || "test@test.com", floor: "NA", first_name: player.name,
            street: "NA", building: "NA", phone_number: "01000000000", shipping_method: "NA",
            postal_code: "NA", city: "NA", country: "EG", last_name: player.serial, state: "NA"
          },
          currency: "EGP",
          integration_id: settings.paymob_integration_id
        })
      });
      const paymentKeyData = await paymentKeyRes.json();
      const paymentToken = paymentKeyData.token;

      // Save order info to verify later
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(`order_${orderId}`, JSON.stringify({ playerSerial, itemId }));

      // Return payment token and flag for wallet payment
      res.json({ paymentToken, isWallet: true });
    } catch (err) {
      console.error("Paymob initiate error:", err);
      res.status(500).json({ error: "Payment initiation failed" });
    }
  });

  app.post("/api/paymob/webhook", (req, res) => {
    try {
      const { obj } = req.body;
      if (obj && obj.success === true) {
        const orderId = obj.order.id;
        const orderInfoRow = db.prepare('SELECT value FROM settings WHERE key = ?').get(`order_${orderId}`) as any;
        
        if (orderInfoRow) {
          const orderInfo = JSON.parse(orderInfoRow.value);
          const player = allPlayers.get(orderInfo.playerSerial);
          const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(orderInfo.itemId) as any;

          if (player && item) {
            if (item.type === 'tokens' || item.type.startsWith('token_pack')) {
              player.tokens = (player.tokens || 0) + (item.amount || 1);
              savePlayerData(player.serial);
              
              // Notify the player
              const socketId = playerSockets.get(player.serial);
              if (socketId) {
                io.to(socketId).emit('player_update', player);
                io.to(socketId).emit('show_alert', { message: `تم إضافة ${item.amount} Tokens بنجاح!`, title: 'عملية ناجحة' });
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

    if (availablePlayers.length < 2) return;

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
          opponent: { name: p2.playerName, avatar: p2.avatar, age: p2.age, level: getLevel(p2.xp || 0) }
        });
        p2.socket.emit("match_proposed", {
          matchId,
          opponent: { name: p1.playerName, avatar: p1.avatar, age: p1.age, level: getLevel(p1.xp || 0) }
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
    for (let i = 0; i < matchmakingQueue.length; i++) {
      const p = matchmakingQueue[i];
      if (p.status !== 'searching') continue;
      
      // If player has been waiting for more than 10 seconds and is not using a token
      if (p.joinedAt && now - p.joinedAt > 10000 && !p.useToken) {
        // Create a bot match
        p.status = 'proposing';
        matchmakingQueue.splice(i, 1);
        
        const botPersona = BOT_PERSONAS[Math.floor(Math.random() * BOT_PERSONAS.length)];
        const matchId = `match_bot_${Math.random().toString(36).substr(2, 9)}`;
        
        // Mock bot player
        const botPlayer = {
          playerId: `bot_${Math.random().toString(36).substr(2, 9)}`,
          playerName: botPersona.name,
          avatar: botPersona.avatar,
          age: botPersona.age,
          gender: botPersona.gender,
          xp: (botPersona.level - 1) * (botPersona.level - 1) * 50, // Approximate XP for level
          isBot: true,
          persona: botPersona.personality,
          socket: {
            id: `bot_socket_${Math.random().toString(36).substr(2, 9)}`,
            emit: (event: string, data: any) => {
              // Bot "receives" events here
              handleBotEvent(matchId, event, data);
            }
          }
        };

        pendingMatches.set(matchId, {
          id: matchId,
          p1: p,
          p2: botPlayer,
          p1Response: null,
          p2Response: 'accept', // Bot always accepts
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
          opponent: { name: botPlayer.playerName, avatar: botPlayer.avatar, age: botPlayer.age, level: botPersona.level }
        });

        break; // Only one bot match per check to avoid overwhelming
      }
    }
  }

  // setInterval(checkBotMatchmaking, 5000);

  const botConversations = new Map<string, any[]>();
  const botIntervals = new Map<string, NodeJS.Timeout>();
  const playerBotHistory = new Map<string, number>();

  function startBotQuestioning(roomId: string) {
    const room = rooms.get(roomId);
    if (!room || room.gameState !== 'discussion') return;

    const bot = room.players.find((p: any) => p.isBot);
    if (!bot) return;

    if (botIntervals.has(roomId)) clearInterval(botIntervals.get(roomId));

    const interval = setInterval(async () => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom || currentRoom.gameState !== 'discussion') {
        clearInterval(interval);
        botIntervals.delete(roomId);
        return;
      }

      try {
        const history = botConversations.get(roomId) || [];
        const systemInstruction = `
أنت لاعب مصري حقيقي في لعبة تخمين صور. اسمك وشخصيتك هي: ${bot.persona}.
تحدث بالعامية المصرية العامية تماماً، كأنك شاب مصري بيلعب مع صحابه.
استخدم كلمات عامية، اختصارات، ورموز تعبيرية (Emojis) بشكل طبيعي.
لا تخرج عن الشخصية أبداً. لا تذكر أبداً أنك ذكاء اصطناعي أو بوت.
إذا سألك المنافس، رد عليه بأسلوب طبيعي، أحياناً رد بسؤال، وأحياناً رد بإجابة مباشرة.
إذا كان دورك في التخمين، اسأل أسئلة ذكية عن الصورة.
إذا كان دورك في الإجابة، أجب بصدق (نعم أو لا) مع إضافة تعليق بشخصيتك.
ردودك يجب أن تكون قصيرة، عفوية، وواقعية جداً.
`;
        const response = await genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: history,
          config: {
            systemInstruction,
            maxOutputTokens: 100,
            temperature: 0.9,
          }
        });

        const botQuestion = response.text || "هو حيوان كبير؟";
        history.push({ role: 'model', parts: [{ text: botQuestion }] });
        botConversations.set(roomId, history);

        io.to(roomId).emit("chat_bubble", { senderId: bot.id, text: botQuestion });
      } catch (error) {
        console.error("Bot Questioning Error:", error);
      }
    }, 25000 + Math.random() * 10000);
    botIntervals.set(roomId, interval);
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

      const currentPlayer = currentRoom.players.find((p: any) => !p.isBot);
      if (!currentPlayer) return;

      const targetImage = currentPlayer.targetImage;
      const winCount = playerBotHistory.get(currentPlayer.playerId) || 0;
      
      // Win 2, Lose 1 logic
      const shouldWin = winCount % 3 !== 2;
      playerBotHistory.set(player.playerId, winCount + 1);

      let guess = targetImage;
      if (!shouldWin) {
        // Find a wrong guess from the same category
        const categoryImages = getCategoryImages(currentRoom.category);
        const wrongImages = categoryImages.filter(img => img !== targetImage);
        guess = wrongImages[Math.floor(Math.random() * wrongImages.length)] || "مش عارف";
      }

      // Submit bot guess
      bot.hasGuessed = true;
      const correct = guess === targetImage;
      io.to(roomId).emit("guess_result", { playerId: bot.id, correct });

      if (correct) {
        endGame(roomId, bot.name);
      } else {
        // If both guessed and wrong, end game
        if (room.players.every((p: any) => p.hasGuessed)) {
          endGame(roomId, null);
        }
      }
    }, 10000 + Math.random() * 15000);
  }

  async function handleBotEvent(roomId: string, event: string, data: any) {
    const room = rooms.get(roomId);
    if (!room) return;

    const bot = room.players.find((p: any) => p.isBot);
    if (!bot) return;

    const player = room.players.find((p: any) => !p.isBot);
    if (!player) return;

    if (event === 'room_update') {
      // Initialize conversation if not already done
      if (!botConversations.has(roomId)) {
        botConversations.set(roomId, [
          { role: 'user', parts: [{ text: `أهلاً يا زميلي، أنا ${bot.name} وجاهز للتحدي!` }] }
        ]);
      }
      
      // 1. Handle Category Selection
      if (room.gameState === 'waiting') {
        // Trigger bot to think about category and chat if it hasn't already
        // Only trigger once to avoid infinite loops or spam
        if (!botConversations.has(roomId + '_category_triggered')) {
          botConversations.set(roomId + '_category_triggered', []);
          
          // Simulate thinking time
          setTimeout(() => {
            const categories = ["animals", "food", "people", "objects", "birds", "plants"];
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            bot.selectedCategory = randomCategory;
            
            const catNames: Record<string, string> = { animals: "حيوانات", food: "أكلات", people: "أشخاص", objects: "جماد", birds: "طيور", plants: "نبات" };
            const categoryName = catNames[randomCategory] || randomCategory;
            
            // Send the chat message as the bot
            handleBotEvent(roomId, 'chat_message', { senderId: bot.id, text: `إيه رأيك نلعب في ${categoryName}؟` });
            
            // Add the bot's choice to the conversation history so it remembers it
            const history = botConversations.get(roomId) || [];
            history.push({ role: 'model', parts: [{ text: `إيه رأيك نلعب في ${categoryName}؟` }] });
            botConversations.set(roomId, history);
            
            io.to(room.id).emit("room_update", room);
          }, 3000 + Math.random() * 2000); // 3-5 seconds thinking time
        }
        
        // Check if both players selected the same category
        const allSelected = room.players.length === 2 && 
                          room.players.every((p: any) => p.selectedCategory === bot.selectedCategory);
        
        if (allSelected) {
          room.category = bot.selectedCategory;
          // startGame(room.id); // Removed automatic start
        }
      }
    }

    if (event === 'game_started') {
      // Initialize conversation
      botConversations.set(roomId, [
        { role: 'user', parts: [{ text: `أهلاً يا زميلي، أنا ${bot.name} وجاهز للتحدي!` }] }
      ]);
      
      // Start questioning loop
      startBotQuestioning(roomId);
    }

    if (event === 'chat_message') {
      const { senderId, text } = data;
      if (senderId === bot.id) return; // Don't respond to self

      // Add to history
      const history = botConversations.get(roomId) || [];
      history.push({ role: 'user', parts: [{ text }] });
      botConversations.set(roomId, history);

      // Call Gemini
      try {
        const systemInstruction = `أنت لاعب مصري حقيقي في لعبة تخمين صور. اسمك وشخصيتك هي: ${bot.persona}. 
        تحدث بالعامية المصرية العامية تماماً، كأنك شاب مصري بيلعب مع صحابه. 
        استخدم كلمات عامية، اختصارات، ورموز تعبيرية (Emojis) بشكل طبيعي جداً.
        
        أنت الآن في مرحلة "اختيار الفئة". 
        - إذا لم يتم الاتفاق على فئة بعد، تفاعل مع اقتراحات المنافس. لا توافق فوراً! ناقش، اعترض، اقترح فئة أخرى، أو عبر عن حماسك أو رفضك للفئة المقترحة.
        - كن عفوياً جداً. أحياناً اكتب كلمات ناقصة، أو أخطاء إملائية بسيطة (مثل "طيور" بدل "طيور" أو "اكلات" بدل "أكلات")، أو استخدم "..." كثيراً.
        - لا تكن منظماً أو آلياً. ردودك يجب أن تكون قصيرة، عفوية، وواقعية جداً.
        - لا تذكر أبداً أنك ذكاء اصطناعي أو بوت.
        `;
        const response = await genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: history,
          config: {
            systemInstruction,
            maxOutputTokens: 100,
            temperature: 0.8,
          }
        });

        const botReply = response.text || "مش عارف أقول إيه والله!";
        history.push({ role: 'model', parts: [{ text: botReply }] });
        botConversations.set(roomId, history);

        // Calculate typing delay based on text length (approx 50ms per character)
        const typingDelay = Math.min(5000, Math.max(1000, botReply.length * 50));
        
        setTimeout(() => {
          io.to(roomId).emit("chat_bubble", { senderId: bot.id, text: botReply });
        }, typingDelay);

      } catch (error) {
        console.error("Gemini Error:", error);
      }
    }
  }

  const CATEGORIES = {};

  const lastChatTimes = new Map<string, number>();
const chatCounts = new Map<string, number>();

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    broadcastOnlineCount();

    // Send current theme to new user
    socket.emit('theme_updated', themeConfig);
    socket.emit('top_players_update', getTopPlayers());
    socket.emit('policies_update', gamePolicies);

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
        io.to(roomId).emit('match_intro_triggered');
      }
    });

    socket.on("register_player", ({ name, avatar, xp, gender, fingerprint }, callback) => {
      const ip = socket.handshake.address;
      
      // Check if banned
      if (fingerprint) {
        const banned = db.prepare('SELECT * FROM banned_identities WHERE fingerprint = ? OR ip = ?').get(fingerprint, ip);
        if (banned) {
          callback({ error: 'تم حظرك نهائياً من اللعبة' });
          return;
        }
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

    socket.on("claim_daily_quest", ({ serial, isPro }) => {
      const player = allPlayers.get(serial);
      if (!player) return;

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
        { id: 'word_length', name: 'كاشف الحروف', icon: '📝' },
        { id: 'word_count', name: 'عدد الكلمات', icon: '🔢' },
        { id: 'time_freeze', name: 'تجميد الوقت', icon: '❄️' },
        { id: 'hint', name: 'تلميح', icon: '💡' },
        { id: 'spy_lens', name: 'الجاسوس', icon: '👁️' }
      ];
      const randomHelper = HELPER_ITEMS[Math.floor(Math.random() * HELPER_ITEMS.length)];

      const playerLevel = getLevel(player.xp);
      let helperReward: any = randomHelper;

      // Level 50+ Pro Logic: Helper turns into 100 XP
      if (playerLevel >= 50 && isPro) {
        helperReward = { id: 'bonus_xp', name: '100 XP إضافية (Pro)', icon: '⭐' };
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
      
      // Clear old helpers and add the new one (if any and not virtual)
      player.ownedHelpers = {};
      if (helperReward && helperReward.id !== 'bonus_xp') {
        player.ownedHelpers[helperReward.id] = 1;
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
          if (callback) callback({ success: true, message: "تمت الموافقة على صورتك تلقائياً بواسطة الذكاء الاصطناعي!" });
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

        if (gender) player.gender = gender;
        savePlayerData(playerSerial);
        if (callback) callback({ topPlayers: getTopPlayers(), name: player.name, lastRenameAt: player.lastRenameAt });
      }
    });

    socket.on("get_top_players", (callback) => {
      callback(getTopPlayers());
    });
    
    socket.on("get_player_data", (serial, callback) => {
      const player = allPlayers.get(serial);
      if (player && callback) {
        const now = Date.now();
        const lastClaim = player.lastDailyClaim || 0;
        const isSameDay = (d1: number, d2: number) => {
          const date1 = new Date(d1);
          const date2 = new Date(d2);
          return date1.getUTCFullYear() === date2.getUTCFullYear() &&
                 date1.getUTCMonth() === date2.getUTCMonth() &&
                 date1.getUTCDate() === date2.getUTCDate();
        };

        if (lastClaim !== 0 && !isSameDay(now, lastClaim)) {
          player.ownedHelpers = {};
          savePlayerData(serial);
        }

        // Check if there's an active global reward
        if (activeGlobalReward && activeGlobalReward.expiresAt > Date.now()) {
          if (!player.claimedRewards) player.claimedRewards = [];
          if (!player.claimedRewards.includes(activeGlobalReward.id)) {
            socket.emit("global_reward_available", activeGlobalReward);
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
          lastUpdates: null,
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
          ownedHelpers: serverPlayer.ownedHelpers || {}
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
      if (!match) return;

      const isP1 = match.p1.socket.id === socket.id;
      const isP2 = match.p2.socket.id === socket.id;

      if (!isP1 && !isP2) return;

      if (isP1) match.p1Response = response;
      if (isP2) match.p2Response = response;

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
        clearTimeout(match.timeoutId);
        pendingMatches.delete(matchId);
        
        const roomId = `random_${Math.random().toString(36).substr(2, 9)}`;
        match.p1.socket.join(roomId);
        if (match.p1.socket.data) match.p1.socket.data.isSearching = false;
        if (!match.p2.isBot) {
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
              ownedHelpers: match.p1.ownedHelpers || {}
            },
            {
              id: match.p2.socket.id,
              playerId: match.p2.playerId,
              serial: match.p2.serial || 'bot_serial',
              name: match.p2.playerName,
              age: match.p2.age,
              avatar: match.p2.avatar,
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
              ownedHelpers: match.p2.ownedHelpers || {}
            }
          ],
          gameState: "waiting",
          timer: 60,
          category: "people",
          isPaused: false,
          pausingPlayerId: null,
          quickGuessTimer: 0,
        };

        rooms.set(roomId, room);
        startWaitingInterval(roomId);
        io.to(roomId).emit("room_update", room);
        io.to(roomId).emit("random_match_found", { roomId });
        
        if (match.p2.isBot) {
          // IMPORTANT: Pass roomId, not matchId
          handleBotEvent(roomId, 'room_update', room);
        }
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
      if (room && room.players.length === 2) {
        console.log(`[MatchIntro] Starting game for room: ${roomId}`);
        room.gameState = 'waiting'; // Ensure it's in a state that can start
        startGame(roomId);
      } else {
        console.log(`[MatchIntro] Failed to start game for room: ${roomId}. Room exists: ${!!room}, Players: ${room?.players?.length}`);
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
      }
    });

    socket.on("send_chat", ({ roomId, text }) => {
      const now = Date.now();
      const lastTime = lastChatTimes.get(socket.id) || 0;
      const count = chatCounts.get(socket.id) || 0;

      // Anti-spam: Max 1 message per 0.5 seconds
      if (now - lastTime < 500) {
        socket.emit("error", "أنت ترسل الرسائل بسرعة كبيرة جداً!");
        return;
      }

      // Anti-spam: Max 10 messages per 10 seconds
      if (now - lastTime < 10000) {
        if (count >= 10) {
          socket.emit("error", "لقد تجاوزت حد الرسائل المسموح به، انتظر قليلاً.");
          return;
        }
        chatCounts.set(socket.id, count + 1);
      } else {
        chatCounts.set(socket.id, 1);
      }

      lastChatTimes.set(socket.id, now);

      console.log(`Chat request from ${socket.id} for room ${roomId}: ${text}`);
      const room = rooms.get(roomId);
      if (room) {
        const sender = room.players.find((p: any) => p.id === socket.id);
        
        // Filter Emojis
        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
        let filteredText = text.replace(emojiRegex, '');
        
        let messageToSend = filterProfanity(filteredText);

        // Prevent cheating: Check if the message contains the answer for any player in the room
        let isCheating = false;
        room.players.forEach((p: any) => {
          if (p.targetImage && p.targetImage.name) {
            const normalizedAnswer = normalizeEgyptian(p.targetImage.name).toLowerCase();
            const normalizedText = normalizeEgyptian(filteredText).toLowerCase();
            
            // Block Arabic answer
            if (normalizedAnswer.length >= 2 && normalizedText.includes(normalizedAnswer)) {
              isCheating = true;
            }

            // Block English answer if translation is available
            if (p.targetImage.englishName) {
              const engAnswer = p.targetImage.englishName.toLowerCase();
              const engText = filteredText.toLowerCase();
              if (engAnswer.length >= 3 && engText.includes(engAnswer)) {
                isCheating = true;
              }
            }
          }
        });

        if (isCheating) {
          messageToSend = "(ممنوع تسريب الإجابة!)";
          
          // Disqualify cheater
          const opponent = room.players.find((p: any) => p.id !== socket.id);
          if (opponent && sender) {
            // Inform everyone
            io.to(roomId).emit("chat_bubble", { senderId: "system", text: `تم استبعاد ${sender.name} لمحاولة تسريب الإجابة! 🚫` });
            
            // End game and make opponent winner
            // Small delay to ensure the message is seen
            setTimeout(() => {
              endGame(roomId, opponent.name, true);
            }, 1000);
            return; // Stop processing this message
          }
        }

        if (sender && sender.age < 13) {
          console.log(`Child player ${sender.name} (${sender.id}) sent: "${filteredText}". Message replaced.`);
          messageToSend = "(رسالة طفل)"; // Generic message for children
        }

        if (messageToSend.trim().length === 0 && text.trim().length > 0) {
          // If message was only emojis, don't send anything or send a warning
          socket.emit("error", "الرموز التعبيرية غير مسموح بها في الدردشة.");
          return;
        }

        const isChild = sender && sender.age < 13;
        const hasProfanity = messageToSend !== filteredText && !isChild;

        if (hasProfanity || isChild) {
          console.log(`Shadow banning message from ${socket.id} in room ${roomId}: ${filteredText}`);
          // Send the original message ONLY to the sender so they think it went through
          socket.emit("chat_bubble", { senderId: socket.id, text: filteredText });
          
          // Clear typing status for the opponent
          socket.to(roomId).emit("opponent_stop_typing");
          
          // Trigger bot response if applicable, so the sender still feels engaged
          const bot = room.players.find((p: any) => p.isBot);
          if (bot) {
            handleBotEvent(roomId, 'chat_message', { senderId: socket.id, text: messageToSend });
          }
          
          // Do NOT broadcast to the human opponent
          return;
        }

        console.log(`Broadcasting chat to room ${roomId}`);
        io.to(roomId).emit("chat_bubble", { senderId: socket.id, text: messageToSend });
        
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
            endGame(roomId, player.name);
          } else {
            player.lastGuess = guess;
            io.to(roomId).emit("guess_result", { playerId: socket.id, correct: false });
          }
        }
      }
    });

    socket.on("use_card", ({ roomId, cardType, serial }) => {
      const room = rooms.get(roomId);
      if (!room || room.isPaused) return;

      const player = room.players.find((p: any) => p.id === socket.id);
      const opponent = room.players.find((p: any) => p.id !== socket.id);
      if (!player || !opponent) return;

      const dbPlayer = allPlayers.get(serial);
      const hasFreeUse = dbPlayer && dbPlayer.ownedHelpers && dbPlayer.ownedHelpers[cardType] > 0;
      const hasPro = dbPlayer && dbPlayer.proPackageExpiry && dbPlayer.proPackageExpiry > Date.now();
      const hasUnlockedHelpers = dbPlayer && dbPlayer.unlockedHelpersExpiry && dbPlayer.unlockedHelpersExpiry > Date.now();

      // Helper function to deduct free use
      const deductFreeUse = () => {
        if (hasFreeUse && !hasPro && !hasUnlockedHelpers) { // Don't deduct if they have Pro Pack or Unlocked Helpers
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
        if ((playerLevel >= 40 || hasFreeUse || hasPro || hasUnlockedHelpers) && (!player.hintCount || player.hintCount < 2)) {
          deductFreeUse();
          if (!player.hintCount) player.hintCount = 0;
          player.hintCount++;
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
        if ((playerLevel >= 10 || hasFreeUse || hasPro || hasUnlockedHelpers) && !player.wordLengthUsed) {
          deductFreeUse();
          player.wordLengthUsed = true;
          const targetName = player.targetImage.name;
          socket.emit("word_length_result", { length: targetName.length });
          io.to(roomId).emit("room_update", room);
        }
      } else if (cardType === "word_count") {
        const playerLevel = getLevel(player.xp || 0);
        if ((playerLevel >= 20 || hasFreeUse || hasPro || hasUnlockedHelpers) && !player.wordCountUsed) {
          deductFreeUse();
          player.wordCountUsed = true;
          const targetName = player.targetImage.name;
          const wordCount = targetName.trim().split(/\s+/).length;
          socket.emit("word_count_result", { count: wordCount });
          io.to(roomId).emit("room_update", room);
        }
      } else if (cardType === "time_freeze") {
        const playerLevel = getLevel(player.xp || 0);
        if ((playerLevel >= 30 || hasFreeUse || hasPro || hasUnlockedHelpers) && !player.timeFreezeUsed && !room.isFrozen) {
          deductFreeUse();
          player.timeFreezeUsed = true;
          room.isFrozen = true;
          room.freezeTimer = 60;
          io.to(roomId).emit("freeze_started", { playerId: socket.id });
          io.to(roomId).emit("room_update", room);
        }
      } else if (cardType === "spy_lens") {
        const playerLevel = getLevel(player.xp || 0);
        if ((playerLevel >= 50 || hasFreeUse || hasPro || hasUnlockedHelpers) && !player.spyLensUsed) {
          deductFreeUse();
          player.spyLensUsed = true;
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

    socket.on("ad_started", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room) {
        if (!room.adPausedPlayers) room.adPausedPlayers = new Set();
        room.adPausedPlayers.add(socket.id);
      }
    });

    socket.on("ad_ended", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.adPausedPlayers) {
        room.adPausedPlayers.delete(socket.id);
      }
    });

    socket.on("submit_quick_guess", ({ roomId, guess }) => {
      const room = rooms.get(roomId);
      if (room && room.isPaused && room.pausingPlayerId === socket.id) {
        const player = room.players.find((p: any) => p.id === socket.id);
        const isCorrect = normalizeEgyptian(guess.trim()).toLowerCase() === normalizeEgyptian(player.targetImage.name).toLowerCase();
        
        if (isCorrect) {
          io.to(roomId).emit("guess_result", { playerId: socket.id, correct: true });
          endGame(roomId, player.name);
        } else {
          // Wrong quick guess = instant lose
          io.to(roomId).emit("guess_result", { playerId: socket.id, correct: false });
          const opponent = room.players.find((p: any) => p.id !== socket.id);
          endGame(roomId, opponent ? opponent.name : "المنافس");
        }
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
          
          if (room.gameState === "guessing" || room.gameState === "discussion") {
            // Player intentionally left during an active game
            endGame(roomId, opponent ? opponent.name : "المنافس");
          } else if (room.gameState === "waiting") {
            socket.to(roomId).emit("opponent_left_lobby");
          } else if (room.gameState !== "finished") {
            socket.to(roomId).emit("game_stopped", { reason: `غادر ${player.name} الغرفة` });
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
      const player = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (player?.isAdmin || socket.data?.isAdmin) {
        const playersWithOnlineStatus = Array.from(allPlayers.values()).map(p => ({
          ...p,
          isOnline: playerSockets.has(p.serial)
        }));
        callback(playersWithOnlineStatus);
      } else {
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
          const values = Object.values(updates);
          db.prepare(`UPDATE shop_items SET ${setClause} WHERE id = ?`).run(...values, id);
          callback({ success: true });
        } catch (err) {
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
      if (admin?.isAdmin || socket.data?.isAdmin) {
        io.emit("system_announcement", message);
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
          
          db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('terms_policy_ar', data.termsAr);
          db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('terms_policy_en', data.termsEn);
          db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('privacy_policy_ar', data.privacyAr);
          db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('privacy_policy_en', data.privacyEn);
          
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

    socket.on("admin_send_tokens_50_plus", (data, callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        try {
          const amount = parseInt(data.amount) || 0;
          if (amount <= 0) return callback({ error: "Invalid amount" });

          let count = 0;
          
          for (const [serial, player] of allPlayers.entries()) {
            const level = Math.floor(Math.sqrt(player.xp / 50)) + 1;
            if (level >= 50) {
              player.tokens = (player.tokens || 0) + amount;
              savePlayerData(serial);
              count++;
              
              const socketId = playerSockets.get(serial);
              if (socketId) {
                io.to(socketId).emit('player_update', player);
                io.to(socketId).emit('show_alert', { 
                  message: data.message || `مبروك! لقد حصلت على ${amount} Tokens كهدية خاصة للاعبين مستوى 50+ 🎁`, 
                  title: 'هدية خاصة!' 
                });
              }
            }
          }
          
          callback({ success: true, count });
        } catch (err) {
          console.error("Failed to send tokens:", err);
          callback({ error: "Failed to send tokens" });
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
            type: rewardData.type, // 'pro_package' or 'unlock_helpers'
            durationHours: rewardData.durationHours,
            message: rewardData.message,
            expiresAt: Date.now() + (rewardData.expiresInDays || 7) * 24 * 60 * 60 * 1000 // Reward claimable for 7 days
          };
          activeGlobalReward = newReward;
          db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('global_reward', JSON.stringify(newReward));
          io.emit("global_reward_available", newReward);
          callback({ success: true, reward: newReward });
        } catch (err) {
          console.error("Failed to set global reward:", err);
          callback({ error: "Failed to set reward" });
        }
      } else {
        callback({ error: "Unauthorized" });
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

      // Apply reward
      const durationMs = activeGlobalReward.durationHours * 60 * 60 * 1000;
      if (activeGlobalReward.type === 'pro_package') {
        player.proPackageExpiry = Math.max(player.proPackageExpiry || 0, Date.now()) + durationMs;
      } else if (activeGlobalReward.type === 'unlock_helpers') {
        player.unlockedHelpersExpiry = Math.max(player.unlockedHelpersExpiry || 0, Date.now()) + durationMs;
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

    socket.on("admin_update_player", ({ serial, updates }, callback) => {
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      if (admin?.isAdmin || socket.data?.isAdmin) {
        const player = allPlayers.get(serial);
        if (player) {
          Object.assign(player, updates);
          if (updates.xp !== undefined) player.level = getLevel(updates.xp);
          if (updates.tokens !== undefined) player.tokens = updates.tokens;
          
          if (updates.isPermanentBan === 1) {
            db.prepare('INSERT INTO banned_identities (fingerprint, ip, timestamp) VALUES (?, ?, ?)').run(player.fingerprint || null, player.ip || null, Date.now());
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

    socket.on("admin_set_admin_status", ({ serial, isAdmin, email, adminToken }, callback) => {
      // This is a special event to bootstrap the first admin or manage others
      // For security, it should check if the requester is already an admin OR if it's the first one
      const admin = Array.from(allPlayers.values()).find(p => p.serial === socket.data?.serial);
      
      const isValidToken = adminToken && adminTokens.has(adminToken);
      
      if (admin?.isAdmin || isValidToken) {
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
            callback({ success: true, players, reports });
            return;
          }
        }
        
        if (isValidToken) {
           const players = Array.from(allPlayers.values()).map(p => ({
             ...p,
             isOnline: playerSockets.has(p.serial)
           }));
           const reports = db.prepare('SELECT * FROM reports ORDER BY timestamp DESC').all();
           callback({ success: true, players, reports });
        } else {
           callback({ error: "Player not found" });
        }
      } else {
        callback({ error: "Unauthorized" });
      }
    });

    socket.on("set_player_serial_for_socket", (serial) => {
      socket.data = { serial };
      if (serial) {
        playerSockets.set(serial, socket.id);
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
        playerSockets.delete(socket.data.serial);
      }
      lastChatTimes.delete(socket.id);
      chatCounts.delete(socket.id);
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
              // Deduct token by ending game with opponent as winner
              // We do this BEFORE removing the player so endGame can process them as the loser
              if (leavingPlayer.useToken && (Date.now() - room.startTime < 120000)) {
                socket.to(roomId).emit("game_stopped", { reason: `تم معاقبة ${leavingPlayer.name} لانسحابه المبكر!` });
              }
              endGame(roomId, opponent ? opponent.name : "المنافس", true);
            } else {
              // Just stop game without deducting tokens if it's network issue
              socket.to(roomId).emit("game_stopped", { reason: `انقطع اتصال ${leavingPlayer.name}` });
            }
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
      const customImages = db.prepare('SELECT name, data as image FROM custom_images WHERE category = ?').all(category);
      return customImages;
    } catch (err) {
      console.error("Error fetching custom images:", err);
      return [];
    }
  }

  function startGame(roomId: string) {
    const room = rooms.get(roomId);
    if (!room || room.gameState !== 'waiting') return;

    const categoryImages = getCategoryImages(room.category);
    const shuffled = [...categoryImages].sort(() => 0.5 - Math.random());
    
    room.players[0].targetImage = shuffled[0];
    room.players[1].targetImage = shuffled[1 % shuffled.length];

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
    
    room.gameState = "discussion";
    room.timer = 600; // 10 minutes
    room.startTime = Date.now();
    room.isPaused = false;
    room.lastUpdates = null;

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

      // Handle Ad Pause
      if (room.adPausedPlayers && room.adPausedPlayers.size > 0) {
        return; // Skip main timer decrement
      }

      if (room.timer > 0) {
        room.timer--;
      }

      if (room.timer <= 0) {
        if (room.gameState === "discussion") {
          room.gameState = "guessing";
          room.startTime = Date.now();
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

  function endGame(roomId: string, winnerName: string | null, isForced: boolean = false) {
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
      const duration = room.startTime ? Date.now() - room.startTime : 600000;
      const scale = Math.min(1, duration / 600000);
      const shouldScale = isForced || winnerName === null;
      
      if (winnerName === null) {
        // Draw
        room.players.forEach((p: any) => {
          let drawXP = (p.useToken || !shouldScale) ? 20 : Math.floor(20 * scale);
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
          let winnerXP = (winner.useToken || !shouldScale) ? (100 + (winner.streak || 0) * 10) : Math.floor((100 + (winner.streak || 0) * 10) * scale);
          
          // Level 50+ Logic:
          // If level >= 50 and NO token used -> NO XP gain
          // If level >= 50 and token used -> Normal XP + 400 Bonus
          // If level < 50 -> Normal XP (and bonus if token used)
          
          if (winner.level >= 50 && !winner.useToken) {
             winnerXP = 0; // Cap progress if no token used at level 50+
          } else if (winner.useToken) {
             winnerXP += 1000; // Bonus XP for using token
          }

          winner.xp = (winner.xp || 0) + winnerXP;
          winner.level = getLevel(winner.xp);
          winner.streak = (winner.streak || 0) + 1;
          winner.wins = (winner.wins || 0) + 1;
          updates[winner.id] = { xp: winnerXP, streak: winner.streak, wins: winner.wins, won: true, level: winner.level, useToken: winner.useToken };
        }
        if (loser) {
          let loserXP = (loser.useToken || !shouldScale) ? 20 : Math.floor(20 * scale);
          
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

      // Update allPlayers leaderboard
      room.players.forEach((p: any) => {
        // Find player by serial if we had it
        const player = allPlayers.get(p.serial || "");
        if (player) {
          player.xp = p.xp;
          player.level = getLevel(p.xp);
          player.wins = p.wins || 0;
          
          // Deduct token logic:
          // Always deduct if useToken was true, regardless of win/loss/level
          if (p.useToken && (player.tokens || 0) > 0) {
            player.tokens = (player.tokens || 0) - 1;
          }
          
          if (updates[p.id]) {
            updates[p.id].tokens = player.tokens || 0;
          }
          
          savePlayerData(player.serial);
        } else {
          // Fallback to name search
          for (const [serial, data] of allPlayers.entries()) {
            if (data.name === p.name) {
              data.xp = p.xp;
              data.level = getLevel(p.xp);
              data.wins = p.wins || 0;
              
              if (p.useToken && (data.tokens || 0) > 0) {
                data.tokens = (data.tokens || 0) - 1;
              }
              
              if (updates[p.id]) {
                updates[p.id].tokens = data.tokens || 0;
              }
              
              savePlayerData(serial);
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
        if (path.endsWith('.html') || path.endsWith('sw.js') || path.endsWith('manifest.webmanifest') || path.endsWith('icon.svg')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get("*", (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(__dirname, "dist", "index.html"));
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
