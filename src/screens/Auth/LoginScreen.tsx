import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";

import { useAuthStore } from "../../store/useStore";
import axios from "axios";
import { API_ROUTES } from "../../utils/helpers";


const LoginScreen = ({ navigation }: any) => {
    const { setAuth } = useAuthStore();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleLogin = async () => {
        if (!email || !password) {
            setErrorMsg("Please enter email & password");
            return;
        }

        try {
            setLoading(true);
            setErrorMsg("");

            const res = await axios.post(API_ROUTES.LOGIN, {
                email,
                password,
            });

            console.log("///////////////////// login [res]: ", res);

            if(res.status !== 200) throw new Error("Login failed");

            setAuth({
                user: res.data.user,
                token: res.data.token,
            });

        } catch (err: any) {
            console.log("///////////////////// login [err]: ", err?.message);
            setErrorMsg(err?.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };



    return (
        <View style={styles.container}>

            <Text style={styles.title}>Login</Text>

            {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

            <TextInput
                placeholder="Email"
                placeholderTextColor="#aaa"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />

            <TextInput
                placeholder="Password"
                placeholderTextColor="#aaa"
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.btn} onPress={handleLogin}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.btnText}>Login</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.link}>Create an account</Text>
            </TouchableOpacity>

        </View>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1e272e",
        justifyContent: "center",
        padding: 25,
    },
    title: {
        fontSize: 28,
        color: "#fff",
        textAlign: "center",
        marginBottom: 30,
        fontWeight: "bold",
    },
    input: {
        backgroundColor: "#2f3640",
        color: "#fff",
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
    },
    btn: {
        backgroundColor: "#3498db",
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
    },
    btnText: {
        textAlign: "center",
        color: "#fff",
        fontSize: 17,
        fontWeight: "bold",
    },
    link: {
        color: "#4cd137",
        textAlign: "center",
        marginTop: 20,
    },
    error: {
        color: "#e84118",
        textAlign: "center",
        marginBottom: 10,
    },
});
