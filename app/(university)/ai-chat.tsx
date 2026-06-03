import {
  Ionicons } from '@expo/vector-icons';
import { FlashList,
  type FlashListRef } from '@shopify/flash-list';
import { useMutation } from '@tanstack/react-query';
import { useRef,
  useState } from 'react';
import { KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View
} from 'react-native';
import { TextInput } from '@/src/components/ui/TranslatedTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { colors, radius, spacing, typography } from '@/src/constants';
import { api } from '@/src/lib/api';

import { Text } from '@/src/components/ui/TranslatedText';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function UniversityAIChatScreen() {
  const listRef = useRef<FlashListRef<ChatMessage>>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');

  const mutation = useMutation({
    mutationFn: (content: string) =>
      api.post('/api/university/chat', {
        message: content,
        history
      }),
    onSuccess: (response) => {
      const answer =
        typeof response.data?.content === 'string'
          ? response.data.content
          : typeof response.data?.message === 'string'
            ? response.data.message
            : 'I reviewed the latest university context and can help refine the next step.';
      setHistory((current) => [...current, { role: 'assistant', content: answer }]);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  });

  const send = () => {
    const content = message.trim();

    if (!content) {
      return;
    }

    setMessage('');
    setHistory((current) => [...current, { role: 'user', content }]);
    mutation.mutate(content);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.keyboard}>
        <View style={styles.content}>
          <PartnerHeader portalName="Student Messages" subtitle="Message your enrolled students" />
          <View style={styles.chat}>
            <FlashList<ChatMessage>
              ref={listRef}
              data={history}
              keyExtractor={(item, index) => `${item.role}-${index}`}
              renderItem={({ item }) => <Bubble message={item} />}
            />
          </View>
          <View style={styles.composer}>
            <TextInput value={message} onChangeText={setMessage} multiline placeholder="Ask the assistant..." placeholderTextColor={colors.inactive} style={styles.input} />
            <Pressable accessibilityRole="button" onPress={send} disabled={!message.trim() || mutation.isPending} style={[styles.sendButton, !message.trim() && styles.disabled]}>
              <Ionicons name="send" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, mine ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.bubbleText, mine && styles.userBubbleText]}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  keyboard: { flex: 1 },
  content: { flex: 1, gap: spacing.lg, padding: spacing.xl },
  chat: { flex: 1 },
  bubbleRow: { alignItems: 'flex-start', marginBottom: spacing.sm },
  bubbleRowMine: { alignItems: 'flex-end' },
  bubble: { borderRadius: radius.lg, maxWidth: '82%', padding: spacing.md },
  userBubble: { backgroundColor: colors.successSoft },
  assistantBubble: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  bubbleText: { ...typography.body },
  userBubbleText: { color: '#15803d' },
  composer: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.sm },
  input: { ...typography.body, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1.5, flex: 1, maxHeight: 96, minHeight: 48, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  sendButton: { alignItems: 'center', backgroundColor: colors.secondary, borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  disabled: { opacity: 0.45 }
});

