export const API_URL = "https://free-vc-ac-chat.realtimevillage.com";
export const SOCKET_URL = "https://free-vc-ac-chat.realtimevillage.com";


export const API_ROUTES = {
    SIGNUP: `${API_URL}/auth/signup`,
    LOGIN: `${API_URL}/auth/login`,
    USERS: `${API_URL}/auth/users`,
    CHAT: `${API_URL}/chat`,
    UPLOAD: `${API_URL}/upload`,
};


// Define the chunk size (1MB)
export const FILE_UPLOAD_CHUNK_SIZE = 1024 * 1024;


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