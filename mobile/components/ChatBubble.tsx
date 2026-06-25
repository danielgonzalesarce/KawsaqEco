import { View, Text, StyleSheet } from 'react-native';
import Icon from './ui/Icon';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

interface Props {
  message: string;
  isBot?: boolean;
  timestamp?: string;
}

export default function ChatBubble({ message, isBot = false, timestamp }: Props) {
  return (
    <View style={[styles.row, isBot ? styles.rowBot : styles.rowUser]}>
      {isBot && (
        <View style={styles.avatar}>
          <Icon name="leaf" size={16} color={COLORS.white} />
        </View>
      )}
      <View style={[styles.bubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
        {isBot && <Text style={styles.sender}>Kawsaq</Text>}
        <Text style={[styles.text, isBot && styles.textBot]}>{message}</Text>
        {timestamp && <Text style={styles.time}>{timestamp}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  rowBot: { alignItems: 'flex-end' },
  rowUser: { flexDirection: 'row-reverse', alignItems: 'flex-end' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: RADIUS.lg,
    padding: SPACING.sm + 4,
  },
  bubbleBot: {
    backgroundColor: COLORS.chatBot,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: COLORS.chatUser,
    borderBottomRightRadius: 4,
  },
  sender: {
    fontSize: 12,
    color: COLORS.accent,
    marginBottom: 4,
    fontWeight: '700',
  },
  text: { fontSize: FONTS.minSize, color: COLORS.text, lineHeight: 22 },
  textBot: { color: COLORS.white },
  time: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, textAlign: 'right' },
});
