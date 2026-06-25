import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatBubble from '../../components/ChatBubble';
import Icon from '../../components/ui/Icon';
import { sendChat } from '../../services/api';
import { getUserDistrito } from '../../services/userProfile';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_REPLIES = [
  { label: '¿Dónde reciclo?', icon: 'location-outline' as const },
  { label: 'Mi impacto hoy', icon: 'leaf-outline' as const },
  { label: 'Dato climático', icon: 'cloud-outline' as const },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy Kawsaq, tu guía de reciclaje en Santa Anita. ¿En qué te ayudo hoy?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([
    '¿Dónde reciclo?', 'Mi impacto hoy', 'Dato climático',
  ]);
  const [distrito, setDistrito] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const keyboardOffset = Platform.OS === 'ios' ? insets.top + 56 : 0;

  useEffect(() => {
    getUserDistrito().then(setDistrito);
  }, []);

  async function handleSend(text?: string) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    Keyboard.dismiss();
    setInput('');
    const userMsg: Message = { role: 'user', content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const history = updated.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      const { reply, suggested_actions } = await sendChat(msg, history);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (suggested_actions?.length) setSuggested(suggested_actions);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Error de conexión.';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardOffset}
    >
      <FlatList
        ref={listRef}
        style={styles.list}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={
          distrito ? (
            <View style={styles.contextBanner}>
              <Icon name="location" size={14} color={COLORS.primary} />
              <Text style={styles.contextText}>Reciclaje en {distrito ?? 'Santa Anita'}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ChatBubble message={item.content} isBot={item.role === 'assistant'} />
        )}
        ListFooterComponent={
          loading ? (
            <View style={styles.typing}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={styles.typingText}>Kawsaq está escribiendo...</Text>
            </View>
          ) : null
        }
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.sm) }]}>
        <View style={styles.quickReplies}>
          {suggested.map(q => (
            <TouchableOpacity key={q} style={styles.chip} onPress={() => handleSend(q)}>
              <Icon name="chatbubble-outline" size={14} color={COLORS.primary} />
              <Text style={styles.chipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Pregúntale a Kawsaq..."
            placeholderTextColor={COLORS.textMuted}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            blurOnSubmit={false}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            <Icon name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { flex: 1 },
  listContent: { paddingVertical: SPACING.md, paddingBottom: SPACING.sm, flexGrow: 1 },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.overlay,
    borderRadius: RADIUS.md,
  },
  contextText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  typingText: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic' },
  footer: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.md,
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: { color: COLORS.primary, fontSize: 12, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm + 4,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm + 4 : SPACING.sm,
    fontSize: FONTS.minSize,
    maxHeight: 100,
    minHeight: 44,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 2 : 0,
  },
  sendBtnDisabled: { opacity: 0.4 },
});
