/* eslint-disable react-native/no-inline-styles */
import React from "react";
import { View, TouchableOpacity, Text, Modal } from "react-native";
const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "👏"];
export default function ReactionBar({ onPick, onClose }: any) {
    return (
        <Modal transparent animationType="fade">
            <View style={{ flex: 1, justifyContent: "flex-end" }}>
                <View style={{ backgroundColor: "#111", padding: 8, borderRadius: 30, margin: 20, flexDirection: "row", justifyContent: "center" }}>
                    {REACTIONS.map(r => (
                        <TouchableOpacity key={r} onPress={() => { onPick(r); }} style={{ padding: 10 }}>
                            <Text style={{ fontSize: 22 }}>{r}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
                        <Text style={{ color: "#fff" }}>✖</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
