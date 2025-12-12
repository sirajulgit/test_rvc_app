import { io, Socket } from "socket.io-client";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  type MediaStream,
} from "react-native-webrtc";

import InCallManager from "react-native-incall-manager";
import { Vibration } from "react-native";
import Sound from "react-native-sound";
import { useAuthStore } from "../store/useStore";
import { SOCKET_URL } from "../utils/helpers";

// Fix missing TS handlers in react-native-webrtc
type AnyHandler = ((e?: any) => void) | null;

interface FixedPeer extends RTCPeerConnection {
  onicecandidate?: AnyHandler;
  ontrack?: AnyHandler;
  onconnectionstatechange?: AnyHandler;
}

const ICE_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// =======================================================
// 🔔 RINGTONE SYSTEM
// =======================================================
let ringtone: Sound | null = null;

const loadRingtone = () => {
  ringtone = new Sound("ringtone.mp3", Sound.MAIN_BUNDLE, (err) => {
    if (err) console.log("Ringtone load error:", err);
  });
};
loadRingtone();

const playRingtone = () => {
  try {
    ringtone?.setNumberOfLoops(-1);
    ringtone?.play();
    Vibration.vibrate([400, 400], true);
  } catch { }
};

const stopRingtone = () => {
  try {
    ringtone?.stop();
    Vibration.cancel();
  } catch { }
};

// =======================================================
// MAIN SERVICE
// =======================================================
class WebRTCService {
  private socket: Socket | null = null;
  private peerConnection: FixedPeer | null = null;
  private localStream: MediaStream | null = null;

  private serverUrl = SOCKET_URL;
  private navHandler: ((type: "video" | "audio") => void) | null = null;

  // -------------------------------------------------------
  // INIT SOCKET
  // -------------------------------------------------------
  initSocket = (token: string, userId: number) => {
    if (this.socket) return;

    this.socket = io(this.serverUrl, {
      auth: { token },
      query: { token },
      transports: ["websocket"],
    });

    console.log("Socket connected:", userId, token);
    this.attachListeners();
  };

  // -------------------------------------------------------
  // SOCKET EVENTS
  // -------------------------------------------------------
  private attachListeners() {
    if (!this.socket) return;
    const s = this.socket;

    s.on("connect", () => console.log("Socket OK:", s.id));
    s.on("disconnect", () => console.log("Socket disconnected"));

    // -------------------------------------------------------
    // 📞 Incoming Call (NO CHANGES)
    // -------------------------------------------------------
    s.on("call_incoming", (data) => {
      const { from, name, offerType, signal } = data;

      useAuthStore.getState().setCallState({
        otherUserId: from,
        otherUserName: name,
        callType: offerType,
        isIncoming: true,
        incomingOffer: signal,
      });

      playRingtone();
      if (this.navHandler) this.navHandler(offerType);
    });

    s.on("call_accepted", async ({ signal }) => {
      if (!this.peerConnection) return;
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
    });

    s.on("ice_candidate", async ({ candidate }) => {
      if (this.peerConnection && candidate) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    s.on("call_ended", () => this.endCall(false));

    // -------------------------------------------------------
    // 💬 CHAT EVENTS (NEW — safe, no conflict)
    // -------------------------------------------------------

    // Incoming message
    s.on("receive_message", (msg) => {
      console.log("CHAT MESSAGE:", msg);
    });

    // Reaction update from backend
    s.on("message_reaction", (payload) => {
      console.log("REACTION UPDATE:", payload);
    });

    // Typing indicator
    s.on("typing", (data) => {
      console.log("TYPING:", data);
    });

    // Read receipt
    s.on("message_seen", (data) => {
      console.log("MESSAGE SEEN:", data);
    });
  }

  // -------------------------------------------------------
  // SET NAV HANDLER
  // -------------------------------------------------------
  setCallNavigationHandler(cb:any) {
    this.navHandler = cb;
  }

  // -------------------------------------------------------
  // CREATE PEER CONNECTION (unchanged)
  // -------------------------------------------------------
  private createPeerConnection(targetUserId: number) {
    this.peerConnection = new RTCPeerConnection(ICE_CONFIG) as FixedPeer;

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }

    this.peerConnection.onicecandidate = (event: any) => {
      if (event.candidate) {
        this.socket?.emit("ice_candidate", {
          to: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    this.peerConnection.ontrack = (event: any) => {
      useAuthStore.getState().setCallState({
        remoteStream: event.streams[0],
      });
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      if (state === "failed" || state === "disconnected" || state === "closed") {
        this.endCall(false);
      }
    };
  }

  // -------------------------------------------------------
  // START STREAM (unchanged)
  // -------------------------------------------------------
  startLocalStream = async (isVideo: boolean) => {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: isVideo ? { width: 640, height: 480, frameRate: 30, facingMode: "user" } : false,
    });

    this.localStream = stream;
    useAuthStore.getState().setCallState({ localStream: stream });

    return stream;
  };

  // -------------------------------------------------------
  // START CALL (unchanged)
  // -------------------------------------------------------
  startCall = async (targetUserId: number, type: "video" | "audio") => {
    useAuthStore.getState().setCallState({
      otherUserId: targetUserId,
      callType: type,
      isCalling: true,
      isIncoming: false,
      incomingOffer: null,
    });

    InCallManager.start({ media: type });

    await this.startLocalStream(type === "video");
    this.createPeerConnection(targetUserId);

    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);

    this.socket?.emit("call_user", {
      userToCall: targetUserId,
      signalData: offer,
      offerType: type,
    });
  };

  // -------------------------------------------------------
  // ANSWER CALL (unchanged)
  // -------------------------------------------------------
  answerCall = async (callerId: number, offerSignal: any) => {
    stopRingtone();

    const callType = useAuthStore.getState().call.callType || "video";

    useAuthStore.getState().setCallState({
      isCalling: true,
      isIncoming: false,
    });

    InCallManager.start({ media: callType });

    await this.startLocalStream(callType === "video");
    this.createPeerConnection(callerId);

    await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(offerSignal));

    const answer = await this.peerConnection?.createAnswer();
    await this.peerConnection?.setLocalDescription(answer!);

    this.socket?.emit("answer_call", { to: callerId, signal: answer });
  };

  // -------------------------------------------------------
  // EXTRA CHAT FEATURES (NEW SAFE ADDITIONS)
  // -------------------------------------------------------

  joinRoom = (roomId: string) => {
    this.socket?.emit("join_room", roomId);
  };

  sendMessage = (roomId: string, content: string, receiverId: number) => {
    this.socket?.emit("send_message", { roomId, content, receiverId });
  };

  sendTyping = (roomId: string, isTyping: boolean) => {
    this.socket?.emit("typing", { roomId, isTyping });
  };

  sendReaction = (messageId: number | string, emoji: string, roomId: string) => {
    this.socket?.emit("react_message", { messageId, emoji, roomId });
  };

  sendSeen = (messageId: number, roomId: string) => {
    this.socket?.emit("message_seen", { messageId, roomId });
  };

  // -------------------------------------------------------
  // END CALL (unchanged)
  // -------------------------------------------------------
  endCall = (emit = true) => {
    stopRingtone();

    const store = useAuthStore.getState();
    const otherId = store.call.otherUserId;

    try {
      this.peerConnection?.close();
      this.peerConnection = null;

      this.localStream?.getTracks().forEach((t) => t.stop());
      this.localStream = null;

      if (emit && otherId) {
        this.socket?.emit("end_call", { to: otherId });
      }

      InCallManager.stop();
      store.resetCall();
    } catch (e) {
      console.error("End call error:", e);
    }
  };

  getSocket() {
    return this.socket;
  }
}

export default new WebRTCService();
