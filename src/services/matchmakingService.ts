// =========================================================
// Serverless Matchmaking & Signaling Service (Supabase + P2P)
// =========================================================

import { getSupabaseClient } from "./supabaseClient";
import { P2PConnectionManager } from "./webrtcManager";

export interface MatchmakingPlayer {
  id: string;
  name: string;
  avatar: string;
  level: number;
}

export interface MatchFoundResult {
  isP2P: boolean;
  p2pManager?: P2PConnectionManager;
  isHost: boolean;
  opponent: MatchmakingPlayer;
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
    timeoutSeconds: number = 8
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

      // 2. No opponent waiting -> Become Player A (Host)
      const p2p = new P2PConnectionManager(true); // Host mode
      const offer = await p2p.createOffer();
      const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const { data: inserted, error: insertErr } = await supabase
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

      if (insertErr || !inserted) {
        throw new Error(insertErr?.message || "Failed to enter matchmaking pool");
      }

      this.activePoolId = inserted.id;

      // 3. Wait/Poll for Player B to match (up to timeoutSeconds)
      const startTime = Date.now();
      return await new Promise<MatchFoundResult>((resolve) => {
        const interval = setInterval(async () => {
          const elapsed = (Date.now() - startTime) / 1000;

          if (elapsed >= timeoutSeconds) {
            clearInterval(interval);
            // Cancel waiting in pool
            this.cancelActiveSearch();
            // Fallback to Smart Bot
            onStatusUpdate("جاري بدء المباراة...");
            resolve({
              isP2P: false,
              isHost: true,
              isBot: true,
              roomId,
              opponent: {
                id: `bot_${Date.now()}`,
                name: "منافس ذكي",
                avatar: "/assets/avatar-free-boy-01.png",
                level: Math.max(1, player.level),
              },
            });
            return;
          }

          // Check if matched
          const { data: updatedRecord } = await supabase
            .from("matchmaking_pool")
            .select("*")
            .eq("id", inserted.id)
            .single();

          if (updatedRecord && updatedRecord.status === "matched") {
            clearInterval(interval);
            if (updatedRecord.answer) {
              await p2p.handleAnswer(updatedRecord.answer);
            }
            onStatusUpdate("تم الربط بنجاح!");
            resolve({
              isP2P: true,
              p2pManager: p2p,
              isHost: true,
              roomId: updatedRecord.room_id || roomId,
              opponent: {
                id: updatedRecord.matched_with_id,
                name: "خصم متصل",
                avatar: "/assets/avatar-free-boy-02.png",
                level: player.level,
              },
            });
          }
        }, 800);
      });
    } catch (e: any) {
      console.warn("[Matchmaking] Fallback due to error:", e);
      // Clean fallback to Bot
      return {
        isP2P: false,
        isHost: true,
        isBot: true,
        roomId: `room_${Date.now()}`,
        opponent: {
          id: `bot_${Date.now()}`,
          name: "منافس ذكي",
          avatar: "/assets/avatar-free-boy-01.png",
          level: Math.max(1, player.level),
        },
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
