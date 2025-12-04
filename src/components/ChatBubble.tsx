import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  isMine: boolean;
  message: string;
  time: Date;
}

const ChatBubble: React.FC<Props> = ({ isMine, message, time }) => {
  return (
    <View style={[styles.container, isMine ? styles.mine : styles.theirs]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={styles.text}>{message}</Text>
        <Text style={styles.time}>
          {time.getHours()}:{String(time.getMinutes()).padStart(2, '0')}
        </Text>
      </View>
    </View>
  );
};

export default ChatBubble;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    marginVertical: 4,
    flexDirection: 'row',
  },
  mine: {
    justifyContent: 'flex-end',
  },
  theirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 12,
  },
  bubbleMine: {
    backgroundColor: '#3498db',
    borderBottomRightRadius: 0,
  },
  bubbleTheirs: {
    backgroundColor: '#dfe6e9',
    borderBottomLeftRadius: 0,
  },
  text: {
    color: '#2c3e50',
    fontSize: 15,
  },
  time: {
    fontSize: 10,
    color: '#636e72',
    marginTop: 4,
    textAlign: 'right',
  },
});
