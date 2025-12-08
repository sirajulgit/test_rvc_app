import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useAuthStore } from "../store/useStore";
import WebRTCService from "../services/webrtcService";

interface Props {
  visible: boolean;
}

const IncomingCallPopup: React.FC<Props> = ({ visible }) => {
  const { call, setCallState } = useAuthStore();

  if (!visible || !call.isIncoming) return null;

  const handleAccept = () => {
    if (!call.otherUserId || !call.incomingOffer) return;

    // Stop showing popup
    setCallState({ isIncoming: false });

    // Accept call
    WebRTCService.answerCall(call.otherUserId, call.incomingOffer);
  };

  const handleReject = () => {
    WebRTCService.endCall(true);
    setCallState({ isIncoming: false, incomingOffer: null });
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Incoming {call.callType} Call</Text>
          <Text style={styles.name}>{call.otherUserName}</Text>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.reject} onPress={handleReject}>
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.accept} onPress={handleAccept}>
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default IncomingCallPopup;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "80%",
    backgroundColor: "#1e272e",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    color: "#fff",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4cd137",
    marginVertical: 10,
  },
  buttons: {
    flexDirection: "row",
    marginTop: 15,
  },
  accept: {
    backgroundColor: "#4cd137",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginLeft: 10,
  },
  reject: {
    backgroundColor: "#e84118",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginRight: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
