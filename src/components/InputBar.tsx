import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

import { Ionicons } from '@react-native-vector-icons/ionicons';

interface Props {
    onSend: (msg: string) => void;
}

const InputBar: React.FC<Props> = ({ onSend }) => {
    const [text, setText] = useState('');

    const handleSend = () => {
        if (!text.trim()) return;
        onSend(text.trim());
        setText('');
    };

    return (
        <View style={styles.container}>
            <TextInput
                placeholder="Type a message..."
                placeholderTextColor="#999"
                value={text}
                onChangeText={setText}
                style={styles.input}
            />

            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                <Ionicons name="send" size={22} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

export default InputBar;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#f1f2f6',
        padding: 12,
        borderRadius: 20,
        fontSize: 15,
    },
    sendBtn: {
        marginLeft: 10,
        backgroundColor: '#3498db',
        padding: 12,
        borderRadius: 50,
    },
});
