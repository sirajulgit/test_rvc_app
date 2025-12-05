import React, { useEffect } from "react";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { PermissionsAndroid, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import WebRTCService from "./src/services/webrtcService";
import { useAuthStore } from "./src/store/useStore";

// Screens
import LoginScreen from "./src/screens/Auth/LoginScreen";
import RegisterScreen from "./src/screens/Auth/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import ChatScreen from "./src/screens/ChatScreen";
// import AudioCallScreen from "./src/screens/Calls/AudioCallScreen";
// import VideoCallScreen from "./src/screens/Calls/VideoCallScreen";

export const navigationRef = createNavigationContainerRef() as any;
const Stack = createStackNavigator();



const ChatScreenWrapper = (props: any) => <ChatScreen {...props} />;


// ───────────────────────────────────────────────────────────────
// MAIN APP
// ───────────────────────────────────────────────────────────────
const App = () => {
  const { isAuthenticated, token, user } = useAuthStore();



  // ───────────────────────────────────────────────────────────────
  // PERMISSIONS 
  // ───────────────────────────────────────────────────────────────
  const requestPermissions = async () => {
    if (Platform.OS !== "android") return;

    try {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

      // Check if ALL results are 'granted'
      const allGranted = Object.values(results).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );

      if (allGranted) {
        console.log('All permissions granted');
      } else {
        console.log('One or more permissions denied');
      }
    } catch (err) {
      console.error('Permission Request Error:', err);
    }
  };

  // ───────────────────────────────────────────────────────────────
  // ANDROID PERMISSIONS
  // ───────────────────────────────────────────────────────────────
  useEffect(() => {
    requestPermissions();
  }, []);

  // ───────────────────────────────────────────────────────────────
  // CONNECT SOCKET AFTER LOGIN
  // ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && token && user) {
      WebRTCService.initSocket(token, user.id);
    }
  }, [isAuthenticated, token, user]);

  // ───────────────────────────────────────────────────────────────
  // NAVIGATE TO CALL SCREEN WHEN INCOMING CALL
  // ───────────────────────────────────────────────────────────────
  useEffect(() => {
    WebRTCService.setCallNavigationHandler((type) => {
      if (!navigationRef.isReady()) return;

      if (type === "video") navigationRef.navigate("VideoCall");
      else navigationRef.navigate("AudioCall");
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 as number }}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: true }}>
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            </>
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Chat" component={ChatScreenWrapper} options={{ headerShown: false }} />
              {/* <Stack.Screen name="AudioCall" component={AudioCallScreen} options={{ headerShown: false }} /> */}
              {/* <Stack.Screen name="VideoCall" component={VideoCallScreen} options={{ headerShown: false }} /> */}
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;


