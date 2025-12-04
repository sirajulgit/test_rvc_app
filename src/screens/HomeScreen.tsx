import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from "react-native";
import axios from "axios";
import { useAuthStore } from "../store/useStore";
import WebRTCService from "../services/webrtcService";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { API_ROUTES } from "../utils/helpers";



const HomeScreen = ({ navigation }: any) => {
    const { user , token} = useAuthStore();
    const [users, setUsers] = useState<any[]>([]);

    const fetchUsers = async () => {
        if (!user) return;

        try {
            const res = await axios.get(`${API_ROUTES.USERS}`,{
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log(`////////////////////// USER LIST [RES]: `, res?.data?.user);
            setUsers(res.data.user || []);
        } catch (e: any) {
            console.error("////////////// USER LIST [ERROR]:", e?.message);
        }
    };

    const startChat = (u: any) => {
        navigation.navigate("Chat", {
            targetUserId: u.id,
            targetUserName: u.name,
        });
    };


    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome {user?.name}</Text>


            <FlatList
                data={users}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: 10 as number }}
                renderItem={({ item }) => (
                    <View style={styles.userRow}>
                        <View>
                            <Text style={styles.userName}>{item.name}</Text>
                            <Text style={styles.userEmail}>{item.email}</Text>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={() => startChat(item)}
                            >
                                <Ionicons name="chatbubble-outline" size={24} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={() => WebRTCService.startCall(item.id, "audio")}
                            >
                                <Ionicons name="call-outline" size={24} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={() => WebRTCService.startCall(item.id, "video")}
                            >
                                <Ionicons name="videocam-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            <TouchableOpacity
                style={styles.profileBtn}
                onPress={() => navigation.navigate("Profile")}
            >
                <Ionicons name="person-circle-outline" size={32} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1e272e",
        paddingTop: 50,
    },
    title: {
        fontSize: 22,
        color: "#fff",
        textAlign: "center",
        marginBottom: 20,
        fontWeight: "bold",
    },
    userRow: {
        backgroundColor: "#2f3640",
        padding: 15,
        marginVertical: 6,
        borderRadius: 10,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    userName: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    userEmail: {
        color: "#aaa",
        fontSize: 13,
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconBtn: {
        marginLeft: 12,
    },
    profileBtn: {
        position: "absolute",
        right: 20,
        top: 45,
    },
});
