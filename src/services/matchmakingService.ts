// =========================================================
// Serverless Matchmaking & Signaling Service (Supabase + P2P)
// =========================================================

import { getSupabaseClient } from "./supabaseClient";
import { P2PConnectionManager } from "./webrtcManager";
import botNamesData from "../data/botNames.json";

export const BOT_PERSONAS = [
  // --- مستوى القمة (36 - 40) - Avatar 40 ---
  {
    name: "العقيد",
    age: 45,
    level: 40,
    avatar: "avatar-lvl-boy-40.png",
    gender: "boy",
    personality: "أعلى لفل في اللعبة 'اتعلموا من العبد لله'",
  },
  {
    name: "لؤلؤة",
    age: 36,
    level: 41,
    avatar: "avatar-lvl-girl-40.png",
    gender: "girl",
    personality: "ذكاء حاد وهدوء قاتل 'اللعب فن مش عن عن'",
  },
  {
    name: "الكابو",
    age: 40,
    level: 45,
    avatar: "avatar-lvl-boy-40.png",
    gender: "boy",
    personality: "ملك اللعبة 'محدش بياكلها معايا بالساهل'",
  },
  {
    name: "الأسطورة",
    age: 33,
    level: 43,
    avatar: "avatar-lvl-girl-40.png",
    gender: "girl",
    personality: "برنسيسة اللعبة 'لعبكم لسه محتاج شوية مجهود'",
  },
  {
    name: "الهضبة",
    age: 38,
    level: 44,
    avatar: "avatar-lvl-boy-40.png",
    gender: "boy",
    personality: "صارم جداً 'الخطأ هنا بموت، ركز'",
  },
  {
    name: "البرنسيسة",
    age: 35,
    level: 40,
    avatar: "avatar-lvl-girl-40.png",
    gender: "girl",
    personality: "راقية جداً بس بتخلص الدور في ثانية",
  },
  {
    name: "العالمي",
    age: 42,
    level: 42,
    avatar: "avatar-lvl-boy-40.png",
    gender: "boy",
    personality: "بيحسبها بالورقة والقلم 'الاحتمالات بتقول إني هكسب'",
  },

  // --- مستوى الخبراء (30 - 35) - Avatar 30 ---
  {
    name: "الحريف",
    age: 35,
    level: 35,
    avatar: "avatar-lvl-boy-30.png",
    gender: "boy",
    personality: "حريف وقديم في اللعبة، كلامه فيه حكمة شوية",
  },
  {
    name: "كارمن",
    age: 26,
    level: 34,
    avatar: "avatar-lvl-girl-30.png",
    gender: "girl",
    personality: "جدية شوية، بس بتحب المنافسة الشريفة",
  },
  {
    name: "سلطان اللعب",
    age: 40,
    level: 33,
    avatar: "avatar-lvl-boy-30.png",
    gender: "boy",
    personality: "كبير القعدة 'نورتم التربيزة يا شباب'",
  },
  {
    name: "جيداء",
    age: 24,
    level: 32,
    avatar: "avatar-lvl-girl-30.png",
    gender: "girl",
    personality: "ذكية وبتحب التحدي، بتسأل أسئلة صعبة",
  },
  {
    name: "القاضي",
    age: 31,
    level: 31,
    avatar: "avatar-lvl-boy-30.png",
    gender: "boy",
    personality: "حكيم وهادي، كلامه موزون 'العدل أساس اللعبة'",
  },
  {
    name: "تارلا",
    age: 29,
    level: 30,
    avatar: "avatar-lvl-girl-30.png",
    gender: "girl",
    personality: "غامضة وكلامها قليل 'السكوت علامة الاحتراف'",
  },
  {
    name: "الطيار",
    age: 30,
    level: 35,
    avatar: "avatar-lvl-boy-30.png",
    gender: "boy",
    personality: "هادي جداً وبيلعب ببرود أعصاب يحرق الدم",
  },
  {
    name: "جوهرة",
    age: 32,
    level: 34,
    avatar: "avatar-lvl-girl-30.png",
    gender: "girl",
    personality: "كلامها فيه رزانة وهدوء 'كل دور وله بطل'",
  },

  // --- مستوى المحترفين (21 - 29) - Avatar 20 ---
  {
    name: "الچوكر",
    age: 22,
    level: 29,
    avatar: "avatar-lvl-boy-20.png",
    gender: "boy",
    personality: "هزار وفرفشة 'يا زميلي' و 'يا صاحبي'",
  },
  {
    name: "تالا",
    age: 20,
    level: 28,
    avatar: "avatar-lvl-girl-20.png",
    gender: "girl",
    personality: "هادية ومركزة، كلامها قليل ومحدد",
  },
  {
    name: "الذيب",
    age: 21,
    level: 27,
    avatar: "avatar-lvl-boy-20.png",
    gender: "boy",
    personality: "بيحب الرغي والكلام الجانبي وقصص اللعب",
  },
  {
    name: "نايا",
    age: 23,
    level: 26,
    avatar: "avatar-lvl-girl-20.png",
    gender: "girl",
    personality: "بتحب الضحك والهزار بس ذكية في اللعب",
  },
  {
    name: "قناص القلوب",
    age: 28,
    level: 25,
    avatar: "avatar-lvl-boy-20.png",
    gender: "boy",
    personality: "مش بيحب الخسارة أبداً 'نلعب تاني؟'",
  },
  {
    name: "ميلا",
    age: 26,
    level: 24,
    avatar: "avatar-lvl-girl-20.png",
    gender: "girl",
    personality: "بتحلل كل حركة 'الحركة دي وراها حاجة'",
  },
  {
    name: "ميكا",
    age: 25,
    level: 23,
    avatar: "avatar-lvl-boy-20.png",
    gender: "boy",
    personality: "بيحب المنافسة 'وريني هتعمل إيه في دي'",
  },
  {
    name: "بيرلا",
    age: 23,
    level: 22,
    avatar: "avatar-lvl-girl-20.png",
    gender: "girl",
    personality: "طموحة وعايزة توصل لأعلى ليفل",
  },
  {
    name: "شيكو",
    age: 19,
    level: 21,
    avatar: "avatar-lvl-boy-20.png",
    gender: "boy",
    personality: "لسه جديد وبيتعلم بس دمه خفيف",
  },
  {
    name: "أوركيد",
    age: 22,
    level: 29,
    avatar: "avatar-lvl-girl-20.png",
    gender: "girl",
    personality: "بتحب تشجع نفسها 'عاش يا أنا'",
  },

  // --- مستوى متوسط (15 - 20) - Avatar 10 أو 20 ---
  {
    name: "المقنع",
    age: 32,
    level: 20,
    avatar: "avatar-lvl-boy-20.png",
    gender: "boy",
    personality: "غامض ومركز جداً في الورق",
  },
  {
    name: "سيدرا",
    age: 25,
    level: 19,
    avatar: "avatar-lvl-girl-20.png",
    gender: "girl",
    personality: "سريعة جداً في الرد 'متحاولش تفكر كتير'",
  },
  {
    name: "الصاروخ",
    age: 25,
    level: 18,
    avatar: "avatar-lvl-boy-10.png",
    gender: "boy",
    personality: "بيحب الحماس 'الكورة في ملعبي دلوقتي'",
  },
  {
    name: "كاميليا",
    age: 27,
    level: 17,
    avatar: "avatar-lvl-girl-10.png",
    gender: "girl",
    personality: "خبرة وبتحب تدي نصايح 'لو لعبتها يمين أحلى'",
  },
  {
    name: "الونش",
    age: 25,
    level: 16,
    avatar: "avatar-lvl-boy-10.png",
    gender: "boy",
    personality: "حريف وبيلعب بدماغه 'محتاجة نفس طويل'",
  },
  {
    name: "سول",
    age: 23,
    level: 15,
    avatar: "avatar-lvl-girl-10.png",
    gender: "girl",
    personality: "واثقة في نفسها وبتحب كلمة 'تم القصف'",
  },
  {
    name: "بوجبا",
    age: 22,
    level: 20,
    avatar: "avatar-lvl-boy-20.png",
    gender: "boy",
    personality: "بتاع قفشات أفلام 'أنا بابا يلا'",
  },
  {
    name: "لورين",
    age: 24,
    level: 19,
    avatar: "avatar-lvl-girl-20.png",
    gender: "girl",
    personality: "بتحب النظام 'لو سمحت العب بالترتيب'",
  },

  // --- مستوى ناشئ (10 - 14) - Avatar 10 ---
  {
    name: "المدمر",
    age: 20,
    level: 14,
    avatar: "avatar-lvl-boy-10.png",
    gender: "boy",
    personality: "شاب طموح بيلعب بتكتيك 'واحدة واحدة وهجيبك'",
  },
  {
    name: "ريتال",
    age: 19,
    level: 13,
    avatar: "avatar-lvl-girl-10.png",
    gender: "girl",
    personality: "هادية بس ذكية 'ركز في ورقتك يا بطل'",
  },
  {
    name: "ماهي",
    age: 28,
    level: 12,
    avatar: "avatar-lvl-girl-10.png",
    gender: "girl",
    personality: "كلامها فيه رزانة وهدوء",
  },
  {
    name: "زعتر",
    age: 27,
    level: 11,
    avatar: "avatar-lvl-boy-10.png",
    gender: "boy",
    personality: "بيحب يشتت المنافس 'بص العصفورة'",
  },
  {
    name: "ناردين",
    age: 23,
    level: 10,
    avatar: "avatar-lvl-girl-10.png",
    gender: "girl",
    personality: "بتحب الضحك والهزار جداً",
  },
  {
    name: "كيمو",
    age: 22,
    level: 14,
    avatar: "avatar-lvl-boy-10.png",
    gender: "boy",
    personality: "بيلعب بسرعه وبيهزر طول الوقت",
  },
  {
    name: "سما",
    age: 28,
    level: 13,
    avatar: "avatar-lvl-girl-10.png",
    gender: "girl",
    personality: "شخصية هادية وبتحب المنافسة",
  },
];

export function createRandomBotPlayer(playerLevel: number = 1, excludedName?: string): any {
  const persona = BOT_PERSONAS[Math.floor(Math.random() * BOT_PERSONAS.length)];
  const genderNames = (botNamesData as any)[persona.gender] || [];
  let name = persona.name;
  if (genderNames.length > 0) {
    const candidate = genderNames[Math.floor(Math.random() * genderNames.length)];
    if (candidate !== excludedName) {
      name = candidate;
    }
  }
  const botLevel = Math.max(1, Math.min(50, Math.floor(persona.level + (Math.random() * 4 - 2))));
  const isPro = Math.random() < 0.25;

  return {
    id: "bot_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    playerId: "bot_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    name: name,
    playerName: name,
    personaName: persona.name,
    avatar: persona.avatar,
    gender: persona.gender,
    age: persona.age,
    xp: (botLevel - 1) * (botLevel - 1) * 50 + Math.floor(Math.random() * 50),
    level: botLevel,
    streak: Math.floor(Math.random() * 5),
    wins: Math.floor(botLevel * (Math.random() * 5 + 2)),
    busCompleteWins: Math.floor(botLevel * (Math.random() * 3 + 1)),
    xoWins: Math.floor(botLevel * (Math.random() * 3 + 1)),
    handWins: Math.floor(botLevel * (Math.random() * 3 + 1)),
    iqWins: Math.floor(botLevel * (Math.random() * 3 + 1)),
    dotsWins: Math.floor(botLevel * (Math.random() * 3 + 1)),
    speedCupsWins: Math.floor(botLevel * (Math.random() * 3 + 1)),
    bombPartyWins: Math.floor(botLevel * (Math.random() * 3 + 1)),
    wordleWins: Math.floor(botLevel * (Math.random() * 3 + 1)),
    connectFourWordsWins: Math.floor(botLevel * (Math.random() * 3 + 1)),
    spaceWarWins: Math.floor(botLevel * (Math.random() * 3 + 1)),
    serial: "bot_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    isBot: true,
    disableGuessChat: 1,
    persona: persona.personality,
    proPackageExpiry: isPro ? Date.now() + 1000 * 60 * 60 * 24 * 30 : null,
    selectedFrame: isPro ? "gold" : "",
  };
}

export interface MatchmakingPlayer {
  id: string;
  name: string;
  avatar: string;
  level: number;
  gender?: string;
  age?: number;
  xp?: number;
  serial?: string;
}

export interface MatchFoundResult {
  isP2P: boolean;
  p2pManager?: P2PConnectionManager;
  isHost: boolean;
  opponent: any;
  roomId: string;
  isBot?: boolean;
}

export class MatchmakingService {
  private static activePoolId: string | null = null;
  private static pollInterval: any = null;

  /**
   * Search for a random match via Supabase matchmaking_pool
   */
  public static async findRandomMatch(
    player: MatchmakingPlayer,
    gameType: string,
    onStatusUpdate: (msg: string) => void,
    timeoutSeconds: number = 3
  ): Promise<MatchFoundResult> {
    const supabase = getSupabaseClient();
    onStatusUpdate("جاري البحث عن خصم...");

    try {
      // 1. Check if an opponent is already waiting in matchmaking_pool
      const { data: waitingPlayers, error: fetchErr } = await supabase
        .from("matchmaking_pool")
        .select("*")
        .eq("game_type", gameType)
        .eq("status", "waiting")
        .neq("player_id", player.id)
        .order("created_at", { ascending: true })
        .limit(1);

      if (fetchErr) {
        console.warn("[Matchmaking] Fetch error, continuing:", fetchErr.message);
      }

      if (waitingPlayers && waitingPlayers.length > 0) {
        // Player B (Guest) joins Player A (Host)
        const hostRecord = waitingPlayers[0];
        onStatusUpdate("تم العثور على لاعب! جاري التوصيل المباشر (P2P)...");

        const p2p = new P2PConnectionManager(false); // Guest mode

        // If host has an offer stored
        let answerData: any = null;
        if (hostRecord.offer) {
          answerData = await p2p.handleOfferAndCreateAnswer(hostRecord.offer);
        }

        // Update record in Supabase
        await supabase
          .from("matchmaking_pool")
          .update({
            status: "matched",
            matched_with_id: player.id,
            answer: answerData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", hostRecord.id);

        return {
          isP2P: true,
          p2pManager: p2p,
          isHost: false,
          roomId: hostRecord.room_id || `room_${hostRecord.id}`,
          opponent: {
            id: hostRecord.player_id,
            name: hostRecord.player_name,
            avatar: hostRecord.player_avatar,
            level: hostRecord.player_level || 1,
          },
        };
      }

      // 2. No opponent waiting -> Try entering pool as Host
      let insertedRecord: any = null;
      let p2p: P2PConnectionManager | null = null;
      const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      try {
        p2p = new P2PConnectionManager(true);
        const offer = await p2p.createOffer();

        const { data: inserted } = await supabase
          .from("matchmaking_pool")
          .insert({
            player_id: player.id,
            player_name: player.name,
            player_avatar: player.avatar,
            player_level: player.level,
            game_type: gameType,
            status: "waiting",
            room_id: roomId,
            offer: offer,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        insertedRecord = inserted;
        if (insertedRecord) {
          this.activePoolId = insertedRecord.id;
        }
      } catch (poolErr) {
        console.warn("[Matchmaking] Pool insert error, falling back to smart bot:", poolErr);
      }

      // 3. Wait/Poll for Player B to match (up to timeoutSeconds), then fallback to realistic Bot
      const startTime = Date.now();
      return await new Promise<MatchFoundResult>((resolve) => {
        const interval = setInterval(async () => {
          const elapsed = (Date.now() - startTime) / 1000;

          if (elapsed >= timeoutSeconds) {
            clearInterval(interval);
            this.cancelActiveSearch();
            onStatusUpdate("تم العثور على منافس!");
            const botOpponent = createRandomBotPlayer(player.level, player.name);
            resolve({
              isP2P: false,
              isHost: true,
              isBot: true,
              roomId,
              opponent: botOpponent,
            });
            return;
          }

          if (insertedRecord) {
            // Check if matched in Supabase
            const { data: updatedRecord } = await supabase
              .from("matchmaking_pool")
              .select("*")
              .eq("id", insertedRecord.id)
              .single();

            if (updatedRecord && updatedRecord.status === "matched") {
              clearInterval(interval);
              if (updatedRecord.answer && p2p) {
                await p2p.handleAnswer(updatedRecord.answer);
              }
              onStatusUpdate("تم الربط بنجاح!");
              resolve({
                isP2P: true,
                p2pManager: p2p || undefined,
                isHost: true,
                roomId: updatedRecord.room_id || roomId,
                opponent: {
                  id: updatedRecord.matched_with_id,
                  name: "منافس متصل",
                  avatar: "/assets/avatar-free-boy-01.png",
                  level: player.level,
                },
              });
            }
          }
        }, 1000);
      });
    } catch (err: any) {
      console.warn("[Matchmaking] Exception, falling back to bot:", err?.message || err);
      const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const botOpponent = createRandomBotPlayer(player.level, player.name);
      return {
        isP2P: false,
        isHost: true,
        isBot: true,
        roomId,
        opponent: botOpponent,
      };
    }
  }

  /**
   * Cancel waiting in matchmaking pool
   */
  public static async cancelActiveSearch() {
    if (this.activePoolId) {
      const id = this.activePoolId;
      this.activePoolId = null;
      try {
        const supabase = getSupabaseClient();
        await supabase
          .from("matchmaking_pool")
          .update({ status: "cancelled" })
          .eq("id", id);
      } catch (e) {}
    }
  }

  // =========================================================
  // Friends & Profile Likes (Serverless REST / Supabase API)
  // =========================================================

  public static async sendFriendRequest(userId: string, friendId: string, friendName: string, friendAvatar: string) {
    const supabase = getSupabaseClient();
    return await supabase.from("friends").upsert({
      user_id: userId,
      friend_id: friendId,
      friend_name: friendName,
      friend_avatar: friendAvatar,
      status: "pending",
      updated_at: new Date().toISOString(),
    });
  }

  public static async getFriendsList(userId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "accepted");
    return { friends: data || [], error };
  }

  public static async toggleProfileLike(fromUserId: string, toUserId: string): Promise<{ liked: boolean; totalLikes: number }> {
    const supabase = getSupabaseClient();
    const { data: existing } = await supabase
      .from("profile_likes")
      .select("id")
      .eq("from_user_id", fromUserId)
      .eq("to_user_id", toUserId)
      .single();

    if (existing) {
      await supabase.from("profile_likes").delete().eq("id", existing.id);
    } else {
      await supabase.from("profile_likes").insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
      });
    }

    const { count } = await supabase
      .from("profile_likes")
      .select("id", { count: "exact", head: true })
      .eq("to_user_id", toUserId);

    return {
      liked: !existing,
      totalLikes: count || 0,
    };
  }
}
