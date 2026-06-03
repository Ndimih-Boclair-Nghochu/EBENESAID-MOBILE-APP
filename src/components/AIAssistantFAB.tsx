import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/TranslatedText';
import { TextInput } from '@/src/components/ui/TranslatedTextInput';
import { toast } from '@/src/components/ui/Toast';
import { colors, radius, shadow, spacing, typography } from '@/src/constants';
import type { SupportMessage, SupportResponse } from '@/src/features/student/types';
import { formatRelativeTime } from '@/src/features/student/utils';
import { api } from '@/src/lib/api';

const quickQuestions = [
  'How do I find housing?',
  'What documents do I need?',
  'How do I book arrival transport?',
  'How do I apply for jobs?'
];

async function fetchSupport() {
  const response = await api.get<SupportResponse>('/api/student/support');
  return response.data;
}

export function AIAssistantFAB() {
  const sheetRef = useRef<BottomSheet>(null);
  const [content, setContent] = useState('');
  const [opened, setOpened] = useState(false);

  const query = useQuery<SupportResponse>({
    queryKey: ['ai-assistant', 'support'],
    queryFn: fetchSupport,
    enabled: opened,
    staleTime: 0
  });

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      api.post('/api/student/support', {
        action: 'message',
        content: message
      }),
    onSuccess: async () => {
      setContent('');

      for (let attempt = 0; attempt < 5; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await query.refetch();
      }
    },
    onError: () => {
      toast.error('Unable to reach the assistant.');
    }
  });

  const openAssistant = () => {
    setOpened(true);
    sheetRef.current?.snapToIndex(0);
  };

  const sendMessage = (message = content) => {
    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    sendMutation.mutate(trimmed);
  };

  const messages = query.data?.messages ?? [];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open EBENESAID assistant"
        onPress={openAssistant}
        style={styles.fab}
      >
        <Ionicons name="sparkles" color={colors.primary} size={24} />
      </Pressable>
      <BottomSheet ref={sheetRef} index={-1} snapPoints={['72%']} enablePanDownToClose>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>EBENESAID Assistant ✨</Text>
              <Text style={styles.subtitle}>
                Ask me about housing, jobs, documents, or anything about Latvia
              </Text>
            </View>
          </View>

          <ScrollView style={styles.messages} contentContainerStyle={styles.messageContent}>
            {messages.length === 0 ? (
              <View style={styles.quickQuestions}>
                {quickQuestions.map((question) => (
                  <Pressable
                    accessibilityRole="button"
                    key={question}
                    onPress={() => sendMessage(question)}
                    style={styles.quickChip}
                  >
                    <Text style={styles.quickChipText}>{question}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {query.isLoading ? <ActivityIndicator color={colors.secondary} /> : null}
            {messages.map((message) => (
              <AssistantBubble key={message.id} message={message} />
            ))}
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Ask the assistant..."
              placeholderTextColor={colors.inactive}
              multiline
              style={styles.input}
            />
            <Button
              title="Send"
              loading={sendMutation.isPending}
              disabled={!content.trim()}
              onPress={() => sendMessage()}
              style={styles.sendButton}
            />
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

function AssistantBubble({ message }: { message: SupportMessage }) {
  const isUser = message.senderType === 'user';
  const isAssistant = message.senderType === 'assistant' || message.senderType === 'support';

  return (
    <View style={[styles.messageRow, isUser && styles.userMessageRow]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {isAssistant && !isUser ? <Text style={styles.assistantLabel}>Assistant</Text> : null}
        <Text style={[styles.messageText, isUser && styles.userText]}>{message.content}</Text>
        <Text style={[styles.timeText, isUser && styles.userTimeText]}>
          {formatRelativeTime(message.sentAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 28,
    bottom: spacing.xl,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.xl,
    width: 56,
    zIndex: 20,
    ...shadow
  },
  sheet: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.xl
  },
  header: {
    gap: spacing.xs
  },
  title: {
    ...typography.headingMedium
  },
  subtitle: {
    ...typography.caption,
    lineHeight: 18
  },
  messages: {
    flex: 1
  },
  messageContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md
  },
  quickQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  quickChip: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  quickChipText: {
    ...typography.label,
    color: '#15803d'
  },
  messageRow: {
    alignItems: 'flex-start'
  },
  userMessageRow: {
    alignItems: 'flex-end'
  },
  bubble: {
    borderRadius: radius.lg,
    maxWidth: '86%',
    padding: spacing.md
  },
  assistantBubble: {
    backgroundColor: colors.neutralSoft
  },
  userBubble: {
    backgroundColor: colors.secondary
  },
  assistantLabel: {
    ...typography.caption,
    color: '#15803d',
    fontWeight: '700',
    marginBottom: 4
  },
  messageText: {
    ...typography.body,
    lineHeight: 20
  },
  userText: {
    color: colors.primary
  },
  timeText: {
    ...typography.caption,
    marginTop: spacing.xs
  },
  userTimeText: {
    color: colors.primary
  },
  composer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm
  },
  input: {
    ...typography.body,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flex: 1,
    maxHeight: 110,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  sendButton: {
    height: 48,
    width: 86
  }
});
