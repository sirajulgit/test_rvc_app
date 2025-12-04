import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import WebRTCService from "../services/webrtcService";
import { useAuthStore } from "../store/useStore";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../utils/helpers";



type ChatScreenRouteProp = RouteProp<RootStackParamList, "Chat">;
type ChatScreenNavProp = StackNavigationProp<RootStackParamList, "Chat">;

interface Props {
  route: ChatScreenRouteProp;
  navigation: ChatScreenNavProp;
}



const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { targetUserId, targetUserName } = route.params;

  const { user } = useAuthStore();

  const [messages, setMessages] = useState<
    { id: string; from: number; content: string; self: boolean }[]
  >([]);

  const [text, setText] = useState("");

  const flatListRef = useRef<FlatList>(null);

  // Chat room ID based on users
  const roomId = [user?.id, targetUserId].sort().join("_");

  // -----------------------------
  // JOIN ROOM + LISTEN MESSAGES
  // -----------------------------
  useEffect(() => {
    WebRTCService.joinRoom(roomId);

    const socket = WebRTCService.getSocket();
    if (!socket) return;

    const onReceive = (msg: any) => {
      if (msg.roomId !== roomId) return;

      const item = {
        id: Date.now().toString(),
        from: msg.senderId,
        content: msg.content,
        self: msg.senderId === user?.id,
      };

      setMessages((prev) => [...prev, item]);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    socket.on("receive_message", onReceive);

    return () => {
      socket.off("receive_message", onReceive);
    };
  }, [roomId, user?.id]);

  // -----------------------------
  // SEND MESSAGE
  // -----------------------------
  const handleSend = () => {
    if (text.trim().length === 0) return;

    const msgObj = {
      id: Date.now().toString(),
      from: user?.id,
      content: text,
      self: true,
    };

    // Add locally
    setMessages((prev) => [...prev, msgObj]);

    // Send to socket server
    WebRTCService.sendMessage(roomId, text, targetUserId);
    setText("");

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // -----------------------------
  // MESSAGE UI
  // -----------------------------
  const renderItem = ({ item }: any) => (
    <View
      style={[
        styles.msgBubble,
        item.self ? styles.myMsg : styles.theirMsg,
      ]}
    >
      <Text style={styles.msgText}>{item.content}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{targetUserName}</Text>

        <View style={{ width: 30 as number }} />
      </View>

      {/* CHAT LIST */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 15 as number, paddingBottom: 80 as number }}
      />

      {/* INPUT FIELD */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
        />

        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1e272e" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#2c3e50",
  },

  headerTitle: {
    flex: 1,
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },

  msgBubble: {
    maxWidth: "80%",
    padding: 12,
    marginVertical: 5,
    borderRadius: 15,
  },

  myMsg: {
    backgroundColor: "#4cd137",
    alignSelf: "flex-end",
  },

  theirMsg: {
    backgroundColor: "#576574",
    alignSelf: "flex-start",
  },

  msgText: { color: "#fff", fontSize: 15 },

  inputRow: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#2f3640",
    alignItems: "center",
  },

  input: {
    flex: 1,
    backgroundColor: "#3d3d3d",
    height: 45,
    borderRadius: 20,
    paddingHorizontal: 15,
    color: "#fff",
  },

  sendBtn: {
    marginLeft: 10,
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 25,
  },
});
