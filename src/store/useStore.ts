import { create } from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MediaStream } from "react-native-webrtc";

export interface CallState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  otherUserId: number | null;
  otherUserName: string | null;

  callType: "video" | "audio" | null;
  isCalling: boolean;
  isMuted: boolean;
  isIncoming: boolean;

  incomingOffer: any | null; // ⭐ NEW
}

const defaultCallState: CallState = {
  localStream: null,
  remoteStream: null,

  otherUserId: null,
  otherUserName: null,
  callType: null,

  isCalling: false,
  isMuted: false,
  isIncoming: false,

  incomingOffer: null, // ⭐ NEW
};

interface Store {
  call: CallState;
  setCallState: (data: Partial<CallState>) => void;
  resetCall: () => void;

  user: any;
  token: string | null;
  isAuthenticated: boolean;

  setAuth: (data: { user: any; token: string | null }) => void;
  logout: () => void;
}

export const useAuthStore = create<Store>()(
  persist(
    (set) => ({
      call: defaultCallState,

      setCallState: (data) =>
        set((state) => ({
          call: { ...state.call, ...data },
        })),

      resetCall: () => set({ call: defaultCallState }),

      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: ({ user, token }) =>
        set({
          user,
          token,
          isAuthenticated: !!token,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          call: defaultCallState,
        }),
    }),

    ///////////////////////////// | STORAGE | /////////////////////////////
    {
      name: "app-auth-store-final-rvac",
      storage: {
        getItem: async (name) => {
          const v = await AsyncStorage.getItem(name);
          return v ? JSON.parse(v) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);
