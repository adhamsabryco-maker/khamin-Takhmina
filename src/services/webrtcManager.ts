// =========================================================
// WebRTC Peer-to-Peer Manager using Google Public STUN Servers
// =========================================================

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

export type MessageListener = (data: any) => void;

export class P2PConnectionManager {
  public peerConnection: RTCPeerConnection | null = null;
  public dataChannel: RTCDataChannel | null = null;
  public isHost: boolean = false;
  public isConnected: boolean = false;
  private listeners: Map<string, Set<MessageListener>> = new Map();
  public localCandidates: RTCIceCandidate[] = [];
  public onIceCandidateCallback?: (candidate: RTCIceCandidate) => void;
  public onConnectionStateChange?: (state: RTCPeerConnectionState) => void;

  constructor(isHost: boolean = false) {
    this.isHost = isHost;
    this.initPeerConnection();
  }

  private initPeerConnection() {
    try {
      this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.localCandidates.push(event.candidate);
          if (this.onIceCandidateCallback) {
            this.onIceCandidateCallback(event.candidate);
          }
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        if (!this.peerConnection) return;
        const state = this.peerConnection.connectionState;
        this.isConnected = state === "connected";
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(state);
        }
      };

      if (this.isHost) {
        // Host creates the data channel
        this.dataChannel = this.peerConnection.createDataChannel("gameChannel", {
          ordered: true,
        });
        this.setupDataChannel(this.dataChannel);
      } else {
        // Guest receives the data channel
        this.peerConnection.ondatachannel = (event) => {
          this.dataChannel = event.channel;
          this.setupDataChannel(this.dataChannel);
        };
      }
    } catch (e) {
      console.error("[WebRTC] Failed to initialize RTCPeerConnection:", e);
    }
  }

  private setupDataChannel(channel: RTCDataChannel) {
    channel.onopen = () => {
      this.isConnected = true;
      this.triggerLocalEvent("p2p_connected", { isHost: this.isHost });
    };

    channel.onclose = () => {
      this.isConnected = false;
      this.triggerLocalEvent("p2p_disconnected", {});
    };

    channel.onerror = (error) => {
      console.error("[WebRTC DataChannel Error]:", error);
    };

    channel.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload && payload.event) {
          this.triggerLocalEvent(payload.event, payload.data);
        }
      } catch (e) {
        console.error("[WebRTC] Failed to parse message:", event.data, e);
      }
    };
  }

  // Create WebRTC Offer (Host)
  public async createOffer(): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) return null;
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (e) {
      console.error("[WebRTC] Error creating offer:", e);
      return null;
    }
  }

  // Handle incoming Offer and Create Answer (Guest)
  public async handleOfferAndCreateAnswer(
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) return null;
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (e) {
      console.error("[WebRTC] Error creating answer:", e);
      return null;
    }
  }

  // Handle incoming Answer (Host)
  public async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (e) {
      console.error("[WebRTC] Error handling answer:", e);
    }
  }

  // Add ICE Candidate
  public async addIceCandidate(candidateInit: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidateInit));
    } catch (e) {
      console.warn("[WebRTC] Error adding ICE Candidate:", e);
    }
  }

  // Event bus methods (emit, on, off)
  public emit(event: string, data: any = {}): boolean {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(JSON.stringify({ event, data }));
      return true;
    }
    return false;
  }

  public on(event: string, callback: MessageListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public off(event: string, callback: MessageListener): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  private triggerLocalEvent(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[WebRTC] Error in listener for event "${event}":`, e);
        }
      });
    }
  }

  public close(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.listeners.clear();
    this.isConnected = false;
  }
}
