import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  KeyboardAvoidingView, Platform, RefreshControl, Alert
} from "react-native";
import { pick } from "@react-native-documents/picker";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import WebRTCService from "../services/webrtcService";
import { useAuthStore } from "../store/useStore";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { API_ROUTES, RootStackParamList } from "../utils/helpers";
import axios from "axios";
import UploadService from "../services/UploadService";
import EmojiPicker from "../components/EmojiPicker";
import ReactionBar from "../components/ReactionBar";

type ChatScreenRouteProp = RouteProp<RootStackParamList, "Chat">;
type ChatScreenNavProp = StackNavigationProp<RootStackParamList, "Chat">;

interface Props {
  route: ChatScreenRouteProp;
  navigation: ChatScreenNavProp;
}

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { targetUserId, targetUserName } = route.params;
  const { user, token } = useAuthStore();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [reactionTarget, setReactionTarget] = useState<any | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const roomId = [user?.id, targetUserId].sort().join("_chat_");

  // -------------------------
  // Fetch previous messages
  // -------------------------
  const fetchPreviousChatMessages = async (before?: string) => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_ROUTES.CHAT}/${roomId}${before ? `?before=${before}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        const pre = res.data.messages || [];
        const transformed = pre.map((item: any) => ({
          id: item.id.toString(),
          content: item.content,
          from: item.senderId,
          self: item.senderId === user?.id,
          file: item.fileUrl ? { url: item.fileUrl, name: item.fileName, mime: item.fileMime } : null,
          replyTo: item.replyToId ? { id: item.replyToId } : null,
          reactions: item.reactions || {},
          createdAt: item.createdAt
        }));
        setMessages(transformed);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e: any) {
      console.error("PREV MSGS ERR", e?.message);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { fetchPreviousChatMessages(); }, []));

  // -------------------------
  // Socket listeners
  // -------------------------
  useEffect(() => {
    WebRTCService.joinRoom(roomId);
    const socket = WebRTCService.getSocket();
    if (!socket) return;

    const onReceive = (msg: any) => {
      if (msg.roomId !== roomId) return;

      if (msg.tempId) {
        // replace optimistic message
        setMessages(prev => prev.map(m => m.id === msg.tempId ? {
          id: msg.id,
          content: msg.content,
          from: msg.senderId,
          self: msg.senderId === user?.id,
          file: msg.file || null,
          replyTo: msg.replyTo || null,
          reactions: msg.reactions || {},
          createdAt: msg.createdAt
        } : m));
      } else {
        setMessages(prev => [...prev, {
          id: msg.id,
          content: msg.content,
          from: msg.senderId,
          self: msg.senderId === user?.id,
          file: msg.file || null,
          replyTo: msg.replyTo || null,
          reactions: msg.reactions || {},
          createdAt: msg.createdAt
        }]);
      }

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const onReactionUpdate = ({ messageId, reactions }: any) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
    };

    socket.on("receive_message", onReceive);
    socket.on("reaction_update", onReactionUpdate);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("reaction_update", onReactionUpdate);
    };
  }, [roomId, user?.id]);


  // -------------------------
  // Send text (optimistic)
  // -------------------------
  const sendText = () => {
    if (!text.trim()) return;
    const tempId = `t-${Date.now()}-${user.id}`;
    const now = new Date().toISOString();
    const msg = {
      id: tempId,
      tempId,
      roomId,
      content: text,
      from: user.id,
      self: true,
      status: "sending",
      createdAt: now,
      reactions: {}
    };
    setMessages(prev => [...prev, msg]);

    WebRTCService.getSocket()?.volatile.emit("send_message", {
      tempId,
      roomId,
      type: "text",
      content: text,
      receiverId: targetUserId
    });
    

    setText("");
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };


  // -------------------------
  // Pick file using @react-native-documents/picker
  // and upload in chunks via UploadService
  // -------------------------
  const pickAndSendFile = async () => {
    try {
      const res = await pick({ allowMultiSelection: false });
      if (!res || res.length === 0) return;
      const file = res[0];

      const fileUri = file.uri;
      const tempId = `t-${Date.now()}-${user.id}`;
      const now = new Date().toISOString();

      const placeholder = {
        id: tempId,
        tempId,
        roomId,
        content: text || null,
        from: user.id,
        self: true,
        file: { name: file.name, url: null, mime: file.type, size: file.size },
        status: "uploading",
        progress: 0,
        reactions: {},
        createdAt: now
      };

      setMessages(prev => [...prev, placeholder]);
      setText("");

      const uploadRes: any = await UploadService.uploadFileInChunks(
        fileUri,
        file.name as string,
        file.size || 0,
        file.type || "application/octet-stream",
        token as string,
        (uploaded, total) => {
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, progress: Math.round((uploaded / total) * 100) } : m));
        }
      );

      WebRTCService.getSocket()?.volatile.emit("send_message", {
        tempId,
        roomId,
        type: file.type?.startsWith("image") ? "image" : (file.type?.startsWith("video") ? "video" : "file"),
        content: placeholder.content,
        file: { url: uploadRes.fileUrl, name: uploadRes.name, mime: uploadRes.mime },
        receiverId: targetUserId
      });

    } catch (e: any) {
      console.log("Picker error:", e);
      Alert.alert("File selection cancelled or failed.");
    }
  };


  // -------------------------
  // Handle reaction (optimistic)
  // -------------------------
  const handlePickReaction = (emoji: string, message: any) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== message.id) return m;
      const cur = { ...(m.reactions || {}) };
      const users = new Set(cur[emoji] || []);
      if (users.has(user.id)) users.delete(user.id); else users.add(user.id);
      cur[emoji] = Array.from(users);
      return { ...m, reactions: cur };
    }));

    WebRTCService.getSocket()?.emit("add_reaction", { messageId: message.id, emoji });
    setReactionTarget(null);
  };



  const renderItem = ({ item }: any) => {
    const isSelf = item.self;
    return (
      <View style={[styles.messageRow, isSelf ? styles.rowSelf : styles.rowOther]}>
        <View style={[styles.msgBubble, isSelf ? styles.myMsg : styles.theirMsg]}>
          {item.file && item.file.url && (
            <Text style={{ color: "#fff", fontSize: 13 }}>{item.file.name || "Attachment"}</Text>
          )}
          <Text style={styles.msgText}>{item.content}</Text>
          <Text style={styles.timeText}>
            {new Date(item.createdAt ? item.createdAt : Number(item.id.replace(/^t-/, ""))).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>

          {item.reactions && Object.keys(item.reactions).length > 0 && (
            <View style={{ flexDirection: "row", marginTop: 6 }}>
              {Object.entries(item.reactions).map(([emo, arr]: any) => (
                <View key={emo} style={{ paddingHorizontal: 6, paddingVertical: 4, backgroundColor: "#222", borderRadius: 12, marginRight: 6 }}>
                  <Text style={{ color: "#fff" }}>{emo} {arr.length}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onLongPress={() => setReactionTarget(item)} />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={28} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{targetUserName}</Text>
        <View style={{ width: 30 as number }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPreviousChatMessages().finally(() => setRefreshing(false)); }} />}
        contentContainerStyle={{ padding: 15 as number, paddingBottom: 120 as number }}
        onEndReachedThreshold={0.2}
        onEndReached={() => {
          if (messages.length > 0) {
            const first = messages[0];
            fetchPreviousChatMessages(first.createdAt || first.id);
          }
        }}
      />

      <View style={styles.inputRow}>
        <TouchableOpacity onPress={pickAndSendFile} style={{ marginRight: 10 }}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>

        <TextInput style={styles.input} placeholder="Type a message..." placeholderTextColor="#999" value={text} onChangeText={setText} />

        <TouchableOpacity onPress={() => setEmojiOpen(true)} style={{ marginLeft: 8 }}>
          <Text style={{ fontSize: 20 as number }}>🙂</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sendBtn} onPress={sendText}><Ionicons name="send" size={20} color="#fff" /></TouchableOpacity>
      </View>

      <EmojiPicker visible={emojiOpen} onSelect={(e: any) => { setText(t => t + e); setEmojiOpen(false); }} onClose={() => setEmojiOpen(false)} />
      {reactionTarget && <ReactionBar onPick={(emoji: any) => handlePickReaction(emoji, reactionTarget)} onClose={() => setReactionTarget(null)} />}
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1e272e" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 12, backgroundColor: "#2c3e50", marginTop: 50 },
  headerTitle: { flex: 1, color: "#fff", textAlign: "center", fontSize: 18, fontWeight: "bold" },
  messageRow: { width: "100%", marginVertical: 5 },
  rowSelf: { alignItems: "flex-end" },
  rowOther: { alignItems: "flex-start" },
  msgBubble: { maxWidth: "78%", padding: 12, borderRadius: 16 },
  myMsg: { backgroundColor: "#4cd137", borderTopRightRadius: 4 },
  theirMsg: { backgroundColor: "#576574", borderTopLeftRadius: 4 },
  msgText: { color: "#fff", fontSize: 15 },
  timeText: { color: "#e1e1e1", fontSize: 11, marginTop: 4, textAlign: "right", opacity: 0.7 },
  inputRow: { position: "absolute", bottom: 0, width: "100%", flexDirection: "row", padding: 10, backgroundColor: "#2f3640", alignItems: "center" },
  input: { flex: 1, backgroundColor: "#3d3d3d", height: 45, borderRadius: 20, paddingHorizontal: 15, color: "#fff" },
  sendBtn: { marginLeft: 10, backgroundColor: "#3498db", padding: 12, borderRadius: 25 },
});
