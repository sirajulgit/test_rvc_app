export const API_URL = "https://free-vc-ac-chat.realtimevillage.com";
export const SOCKET_URL = "https://free-vc-ac-chat.realtimevillage.com";


export const API_ROUTES = {
    SIGNUP: `${API_URL}/auth/signup`,
    LOGIN: `${API_URL}/auth/login`,
    USERS: `${API_URL}/auth/users`,
    CHAT: `${API_URL}/chat`,
};



export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Chat: { targetUserId: number; targetUserName: string };
  VideoCall: undefined;
  AudioCall: undefined;
  Profile: undefined;
  Settings: undefined;
};