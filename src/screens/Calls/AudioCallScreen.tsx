import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuthStore } from "../../store/useStore";
import WebRTCService from "../../services/webrtcService";

const AudioCallScreen = ({ navigation }: any) => {
  const { call } = useAuthStore();
  const { otherUserName } = call;

  const endCall = () => {
    WebRTCService.endCall(true);
    navigation.goBack();
  };

  const toggleMic = () => {
    WebRTCService.toggleMic();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.callingText}>Audio Call</Text>
      <Text style={styles.name}>{otherUserName}</Text>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={toggleMic}>
          <Text style={styles.btnText}>
            {call.isMuted ? "Unmute" : "Mute"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endBtn} onPress={endCall}>
          <Text style={styles.endText}>End</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AudioCallScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e272e",
    justifyContent: "center",
    alignItems: "center",
  },

  callingText: {
    color: "#aaa",
    fontSize: 18,
  },

  name: {
    color: "#fff",
    fontSize: 30,
    marginTop: 10,
    fontWeight: "bold",
  },

  controls: {
    flexDirection: "row",
    marginTop: 30,
  },

  button: {
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginRight: 15,
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
