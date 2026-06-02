import {
  Ionicons } from '@expo/vector-icons';
import { FlashList,
  type FlashListRef } from '@shopify/flash-list';
import { keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient } from '@tanstack/react-query';
import { router,
  useLocalSearchParams } from 'expo-router';
import { useEffect,
  useMemo,
  useRef,
  useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View
} from 'react-native';
import { TextInput } from '@/src/components/ui/TranslatedTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { colors, radius, spacing, typography } from '@/src/constants';
import { ScreenSkeleton } from '@/src/features/student/components';
import {
  getInitials,
  getOtherParticipant,
  phase3QueryTimes,
  sortMessagesNewestFirst,
  type ConversationDetailResponse,
  type ConversationMessage
} from '@/src/features/student/phase3';
import { formatRelativeTime } from '@/src/features/student/utils';
import { api } from '@/src/lib/api';
import { requestOrQueue } from '@/src/lib/offlineQueue';
import { useAuthStore } from '@/src/stores/authStore';

import { Text } from '@/src/components/ui/TranslatedText';

async function fetchConversation(conversationId: number) {
  const response = await api.get<ConversationDetailResponse>('/api/student/messages', {
    params: { conversationId }
  });
  return response.data;
}

export default function ConversationScreen() {
  const listRef = useRef<FlashListRef<ConversationMessage>>(null);
  const queryClient = useQueryClient();
  const user = useAuthStore((store) => store.user);
  const params = useLocalSearchParams<{ conversationId?: string | string[] }>();
  const [content, setContent] = useState('');
  const conversationId = Number(
    Array.isArray(params.conversationId) ? params.conversationId[0] : params.conversationId
  );
  const queryKey = ['student', 'conversation', conversationId] as const;

  const query = useQuery<ConversationDetailResponse>({
    queryKey,
    queryFn: () => fetchConversation(conversationId),
    staleTime: phase3QueryTimes.conversation.staleTime,
    gcTime: phase3QueryTimes.conversation.gcTime,
    placeholderData: keepPreviousData,
    enabled: Number.isFinite(conversationId)
  });

  useEffect(() => {
    if (!Number.isFinite(conversationId)) {
      return;
    }

    void api.patch('/api/student/messages', { conversationId });
  }, [conversationId]);

  const sendMutation = useMutation({
    mutationFn: (messageContent: string) => {
      const body = {
        conversationId,
        content: messageContent
      };

      return requestOrQueue(
        {
          endpoint: '/api/student/messages',
          method: 'POST',
          body
        },
        () => api.post('/api/student/messages', body)
      );
    },
    onMutate: async (messageContent) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ConversationDetailResponse>(queryKey);
      const optimisticMessage: ConversationMessage = {
        id: `pending-${Date.now()}`,
        content: messageContent,
        sentAt: new Date().toISOString(),
        senderUserId: user?.id ?? 0,
        senderName: user ? `${user.firstName} ${user.lastName}` : 'You',
        pending: true
      };

      queryClient.setQueryData<ConversationDetailResponse>(
        queryKey,
        (current: ConversationDetailResponse | undefined) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            messages: [...current.messages, optimisticMessage]
          };
        }
      );

      setContent('');
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      void query.refetch();
    }
  });

  const messages = useMemo(
    () => [...sortMessagesNewestFirst<ConversationMessage>(query.data?.messages ?? [])].reverse(),
    [query.data?.messages]
  );
  const otherParticipant = query.data
    ? getOtherParticipant(query.data.conversation.participants, user)
    : null;

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  if (!Number.isFinite(conversationId)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState title="Conversation unavailable" message="Conversation ID is missing." />
      </SafeAreaView>
    );
  }

  if (query.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenSkeleton rows={5} />
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load conversation"
          message="Refresh this chat when your connection is back."
          onRetry={() => void query.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {getInitials(otherParticipant?.name ?? 'E')}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {otherParticipant?.name ?? 'Conversation'}
            </Text>
            <Text style={styles.headerSubtitle}>{otherParticipant?.userType ?? 'participant'}</Text>
          </View>
        </View>
        <FlashList<ConversationMessage>
          ref={listRef}
          data={messages}
          keyExtractor={(item) => `${item.id}`}
          maintainVisibleContentPosition={{
            autoscrollToBottomThreshold: 0.2,
            startRenderingFromBottom: true
          }}
          ListEmptyComponent={
            query.isLoading ? null : (
              <EmptyState
                icon="chatbubble-outline"
                title="No messages"
                subtitle="Send the first message below."
              />
            )
          }
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              isMine={item.senderUserId === user?.id}
              participantName={otherParticipant?.name ?? 'Participant'}
              showMeta={
                !messages[index + 1] || messages[index + 1]?.senderUserId !== item.senderUserId
              }
            />
          )}
          contentContainerStyle={styles.messages}
        />
        <View style={styles.composer}>
          <TextInput
            value={content}
            onChangeText={setContent}
            multiline
            placeholder="Write a message..."
            placeholderTextColor={colors.inactive}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={!content.trim() || sendMutation.isPending}
            onPress={() => sendMutation.mutate(content.trim())}
            style={[styles.sendButton, !content.trim() && styles.sendButtonDisabled]}
          >
            <Ionicons name="arrow-up" size={22} color={colors.primary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({
  message,
  isMine,
  participantName,
  showMeta
}: {
  message: ConversationMessage;
  isMine: boolean;
  participantName: string;
  showMeta: boolean;
}) {
  return (
    <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
      {!isMine && showMeta ? (
        <View style={styles.bubbleAvatar}>
          <Text style={styles.bubbleAvatarText}>{getInitials(participantName)}</Text>
        </View>
      ) : !isMine ? (
        <View style={styles.bubbleAvatarSpacer} />
      ) : null}
      <View style={styles.bubbleStack}>
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isMine && styles.myMessageText]}>{message.content}</Text>
        </View>
        {showMeta ? (
          <Text style={[styles.timestamp, isMine && styles.timestampMine]}>
            {formatRelativeTime(message.sentAt)}
            {message.pending ? ' • sending' : ''}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  keyboard: {
    flex: 1
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  headerAvatar: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  headerAvatarText: {
    color: colors.success,
    fontWeight: '700'
  },
  headerText: {
    flex: 1
  },
  headerTitle: {
    ...typography.headingSmall
  },
  headerSubtitle: {
    ...typography.caption,
    textTransform: 'capitalize'
  },
  messages: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg
  },
  messageRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs
  },
  messageRowMine: {
    justifyContent: 'flex-end'
  },
  bubbleStack: {
    maxWidth: '78%'
  },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  myBubble: {
    backgroundColor: colors.successSoft,
    borderBottomRightRadius: 4
  },
  otherBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderColor: colors.border,
    borderWidth: 1
  },
  messageText: {
    ...typography.body
  },
  myMessageText: {
    color: '#15803d'
  },
  timestamp: {
    ...typography.caption,
    marginTop: 3
  },
  timestampMine: {
    textAlign: 'right'
  },
  bubbleAvatar: {
    alignItems: 'center',
    backgroundColor: colors.neutralSoft,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32
  },
  bubbleAvatarSpacer: {
    width: 32
  },
  bubbleAvatarText: {
    ...typography.label
  },
  composer: {
    alignItems: 'flex-end',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md
  },
  input: {
    ...typography.body,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flex: 1,
    maxHeight: 96,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  sendButtonDisabled: {
    opacity: 0.45
  }
});
