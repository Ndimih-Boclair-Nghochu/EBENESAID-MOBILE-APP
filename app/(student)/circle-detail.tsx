import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useIsFocused } from '@react-navigation/native';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { colors, radius, spacing, typography } from '@/src/constants';
import { ScreenSkeleton } from '@/src/features/student/components';
import {
  getInitials,
  phase3QueryTimes,
  sortMessagesNewestFirst,
  type CommunityCircle,
  type CommunityCircleMessage,
  type CommunityResponse
} from '@/src/features/student/phase3';
import { formatRelativeTime } from '@/src/features/student/utils';
import { api } from '@/src/lib/api';
import { useAuthStore } from '@/src/stores/authStore';

async function fetchCommunity() {
  const response = await api.get<CommunityResponse>('/api/student/community');
  return response.data;
}

export default function CircleDetailScreen() {
  const isFocused = useIsFocused();
  const listRef = useRef<FlashList<CommunityCircleMessage>>(null);
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    circleId?: string | string[];
    name?: string | string[];
    memberCount?: string | string[];
  }>();
  const user = useAuthStore((store) => store.user);
  const [content, setContent] = useState('');
  const circleId = Number(Array.isArray(params.circleId) ? params.circleId[0] : params.circleId);
  const queryKey = ['student', 'community'] as const;

  const query = useQuery<CommunityResponse>({
    queryKey,
    queryFn: fetchCommunity,
    staleTime: phase3QueryTimes.circle.staleTime,
    gcTime: phase3QueryTimes.circle.gcTime,
    placeholderData: keepPreviousData,
    refetchInterval: isFocused ? phase3QueryTimes.circle.refetchInterval : false
  });

  const circle = useMemo(
    () => query.data?.circles.find((item: CommunityCircle) => item.id === circleId) ?? null,
    [circleId, query.data?.circles]
  );
  const fallbackName = Array.isArray(params.name) ? params.name[0] : params.name;
  const fallbackMemberCount = Array.isArray(params.memberCount)
    ? params.memberCount[0]
    : params.memberCount;
  const displayName = circle?.name ?? fallbackName ?? 'Circle';
  const memberCount = circle?.memberCount ?? Number(fallbackMemberCount) ?? 0;
  const messages = useMemo(
    () => sortMessagesNewestFirst<CommunityCircleMessage>(circle?.messages ?? []),
    [circle?.messages]
  );
  const currentSenderName = user ? `${user.firstName} ${user.lastName}` : 'You';

  const messageMutation = useMutation({
    mutationFn: (messageContent: string) =>
      api.post('/api/student/community', {
        action: 'message',
        circleId,
        content: messageContent
      }),
    onMutate: async (messageContent) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CommunityResponse>(queryKey);
      const optimisticMessage: CommunityCircleMessage = {
        id: `pending-${Date.now()}`,
        content: messageContent,
        senderName: currentSenderName,
        sentAt: new Date().toISOString(),
        pending: true
      };

      queryClient.setQueryData<CommunityResponse>(queryKey, (current: CommunityResponse | undefined) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          circles: current.circles.map((item: CommunityCircle) =>
            item.id === circleId
              ? {
                  ...item,
                  messages: [...item.messages, optimisticMessage]
                }
              : item
          )
        };
      });

      setContent('');
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
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

  if (query.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenSkeleton rows={5} />
      </SafeAreaView>
    );
  }

  if (query.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load circle"
          message="Refresh the circle when your connection is back."
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
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.headerSubtitle}>{memberCount} members</Text>
          </View>
        </View>
        <FlashList<CommunityCircleMessage>
          ref={listRef}
          data={messages}
          inverted
          keyExtractor={(item) => `${item.id}`}
          estimatedItemSize={78}
          ListEmptyComponent={
            query.isLoading ? null : (
              <EmptyState
                icon="chatbubbles-outline"
                title="No circle messages"
                subtitle="Start the conversation below."
              />
            )
          }
          renderItem={({ item, index }) => (
            <CircleMessageBubble
              message={item}
              isMine={item.senderName === currentSenderName}
              showMeta={
                !messages[index + 1] || messages[index + 1]?.senderName !== item.senderName
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
            placeholder="Write to the circle..."
            placeholderTextColor={colors.inactive}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send circle message"
            disabled={!content.trim() || messageMutation.isPending}
            onPress={() => messageMutation.mutate(content.trim())}
            style={[styles.sendButton, !content.trim() && styles.sendButtonDisabled]}
          >
            <Ionicons name="send" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CircleMessageBubble({
  message,
  isMine,
  showMeta
}: {
  message: CommunityCircleMessage;
  isMine: boolean;
  showMeta: boolean;
}) {
  return (
    <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
      {!isMine && showMeta ? (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(message.senderName)}</Text>
        </View>
      ) : !isMine ? (
        <View style={styles.avatarSpacer} />
      ) : null}
      <View style={styles.bubbleStack}>
        {!isMine && showMeta ? <Text style={styles.senderName}>{message.senderName}</Text> : null}
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
  headerText: {
    flex: 1
  },
  headerTitle: {
    ...typography.headingSmall
  },
  headerSubtitle: {
    ...typography.caption
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
  senderName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2
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
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.neutralSoft,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32
  },
  avatarSpacer: {
    width: 32
  },
  avatarText: {
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
