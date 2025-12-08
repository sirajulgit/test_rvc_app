/* eslint-disable react-native/no-inline-styles */
import React from "react";
import { Modal, View, TouchableOpacity, Text } from "react-native";
const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏", "🔥", "🙏"];
export default function EmojiPicker({ visible, onSelect, onClose }: any) {
    if (!visible) return null;
    return (
        <Modal transparent animationType="fade">
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <View style={{ backgroundColor: "#222", padding: 12, borderRadius: 10, flexDirection: "row" }}>
                    {EMOJIS.map(e => (
                        <TouchableOpacity key={e} onPress={() => { onSelect(e); }} style={{ padding: 6 }}>
                            <Text style={{ fontSize: 24 }}>{e}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
                        <Text style={{ color: "#fff" }}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
