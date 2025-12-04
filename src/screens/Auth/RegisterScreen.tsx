import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";

import axios from "axios";
import { API_ROUTES } from "../../utils/helpers";


const RegisterScreen = ({ navigation }: any) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleRegister = async () => {
        if (!name || !email || !password) {
            setErrorMsg("All fields required");
            return;
        }

        try {
            setLoading(true);
            setErrorMsg("");

            let response = await axios.post(API_ROUTES.SIGNUP, {
                name,
                email,
                password,
            });

            console.log("/////////// signup [response]: ",response)

            if(response.status === 200) {
                navigation.navigate("Login");
            }


        } catch (err: any) {
            console.log("/////////// signup [error]: ", err);
            setErrorMsg(err?.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>

            <Text style={styles.title}>Register</Text>

            {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

            <TextInput
                placeholder="Full Name"
                placeholderTextColor="#aaa"
                style={styles.input}
                value={name}
                onChangeText={setName}
            />

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

            <TouchableOpacity style={styles.btn} onPress={handleRegister}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.btnText}>Create Account</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.link}>Already have an account? Login</Text>
            </TouchableOpacity>

        </View>
    );
};

export default RegisterScreen;

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
        backgroundColor: "#4cd137",
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
        color: "#3498db",
        textAlign: "center",
        marginTop: 20,
    },
    error: {
        color: "#e84118",
        textAlign: "center",
        marginBottom: 10,
    },
});
