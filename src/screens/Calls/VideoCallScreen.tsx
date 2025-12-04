import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { RTCView } from "react-native-webrtc";
import { useAuthStore } from "../../store/useStore";
import WebRTCService from "../../services/webrtcService";

const VideoCallScreen = ({ navigation }: any) => {
  const { call } = useAuthStore();
  const { localStream, remoteStream, otherUserName } = call;

  useEffect(() => {
    // Cleanup on leaving screen
    return () => {};
  }, []);

  const endCall = () => {
    WebRTCService.endCall(true);
    navigation.goBack();
  };

  const toggleMic = () => {
    WebRTCService.toggleMic();
  };

  const switchCamera = () => {
    WebRTCService.switchCamera();
  };

  return (
    <View style={styles.container}>
      {/* REMOTE VIDEO */}
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      ) : (
        <View style={styles.waitingBox}>
          <Text style={styles.waitingText}>Connecting to {otherUserName}...</Text>
        </View>
      )}

      {/* LOCAL CAMERA PREVIEW */}
      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localVideo}
          objectFit="cover"
        />
      )}

      {/* CONTROLS */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={toggleMic}>
          <Text style={styles.btnText}>
            {call.isMuted ? "Unmute" : "Mute"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={switchCamera}>
          <Text style={styles.btnText}>Switch</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endBtn} onPress={endCall}>
          <Text style={styles.endText}>End</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VideoCallScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  remoteVideo: {
    width: "100%",
    height: "100%",
  },

  localVideo: {
    width: 120,
    height: 160,
    position: "absolute",
    top: 40,
    right: 20,
    borderRadius: 10,
    backgroundColor: "#222",
  },

  waitingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  waitingText: {
    color: "#fff",
    fontSize: 18,
  },

  controls: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },

  button: {
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },

  btnText: { color: "#fff", fontWeight: "bold" },

  endBtn: {
    backgroundColor: "#e84118",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },

  endText: { color: "#fff", fontWeight: "bold" },
});
