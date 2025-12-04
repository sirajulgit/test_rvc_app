import { create } from "zustand";
import type { MediaStream } from "react-native-webrtc";


export interface CallState {
  localStream: MediaStream | null;     // Your camera/mic stream
  remoteStream: MediaStream | null;    // Opponent stream

  otherUserId: number | null;          // Who you are calling / who is calling you
  otherUserName: string | null;        // For UI display

  callType: "video" | "audio" | null;  // Video or Audio call
  isCalling: boolean;                  // During a call
  isMuted: boolean;                    // Microphone muted
  isIncoming: boolean;                 // True when receiving a call
}

/* Default initial state */
const defaultCallState: CallState = {
  localStream: null,
  remoteStream: null,

  otherUserId: null,
  otherUserName: null,
  callType: null,

  isCalling: false,
  isMuted: false,
  isIncoming: false,
};

/* ------------------------------------------------------------
 * 2) Global App Store Type
 * ------------------------------------------------------------ */
interface Store {
  // ---------- Call State ----------
  call: CallState;
  setCallState: (data: Partial<CallState>) => void;
  resetCall: () => void;

  // ---------- Auth State ----------
  user: any;
  token: string | null;
  isAuthenticated: boolean;

  setAuth: (data: { user: any; token: string | null }) => void;
  logout: () => void;
}

/* ------------------------------------------------------------
 * 3) Create Zustand Store
 * ------------------------------------------------------------ */
export const useAuthStore = create<Store>((set) => ({
  /* CALL DATA */
  call: defaultCallState,

  // Update only specific fields
  setCallState: (data) =>
    set((state) => ({
      call: { ...state.call, ...data },
    })),

  // Reset call state fully
  resetCall: () => set({ call: defaultCallState }),

  /* AUTH DATA */
  user: null,
  token: null,
  isAuthenticated: false,

  // Save user details + token
  setAuth: ({ user, token }) =>
    set({
      user,
      token,
      isAuthenticated: !!token,
    }),

  // Logout fully
  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      call: defaultCallState,
    }),
}));

/**
 * ======================
 *  HOW TO USE (Example)
 * ======================
 *
 * const { user, token, call, setCallState } = useAuthStore();
 *
 * setCallState({ isCalling: true });
 * useAuthStore.getState().resetCall();
 *
 */
