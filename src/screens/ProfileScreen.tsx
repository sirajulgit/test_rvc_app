import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { useAuthStore } from "../store/useStore";
import axios from "axios";
import { API_ROUTES } from "../utils/helpers";




// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ProfileScreen = ({ navigation }: any) => {
    const { user, token, setAuth } = useAuthStore();
    const [name, setName] = useState(user?.name || "");

    const updateProfile = async () => {
        try {
            const res = await axios.put(`${API_ROUTES.USERS}`, { name }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log(`////////////////////// PROFILE UPDATE [RES]:`, res?.data);

            // Update store
            setAuth({ user: res.data.user, token: useAuthStore.getState().token });

            Alert.alert('Success', 'Profile updated');

        } catch (e: any) {
            console.log(`////////////////////// PROFILE UPDATE [ERROR]:`, e?.message);
        }
    };

    const logout = () => {
        setAuth({ user: null, token: null });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            <TextInput
                style={styles.input}
                placeholder="Your Name"
                placeholderTextColor="#aaa"
                value={name}
                onChangeText={setName}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={updateProfile}>
                <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1e272e",
        padding: 20,
        paddingTop: 60,
    },
    title: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 25,
    },
    input: {
        backgroundColor: "#2f3640",
        padding: 15,
        color: "#fff",
        borderRadius: 10,
        marginBottom: 15,
    },
    saveBtn: {
        backgroundColor: "#4cd137",
        padding: 15,
        borderRadius: 10,
    },
    saveText: {
        textAlign: "center",
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    logoutBtn: {
        backgroundColor: "#e84118",
        padding: 15,
        borderRadius: 10,
        marginTop: 20,
    },
    logoutText: {
        textAlign: "center",
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
});
