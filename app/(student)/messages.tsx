import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { useIsFocused } from '@react-navigation/native';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { toast } from '@/src/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/src/constants';
import {
  PagePadding,
  ScreenSkeleton,
  SearchBar
} from '@/src/features/student/components';
import {
  extractConversationId,
  getInitials,
  getOtherParticipant,
  normalizeParticipantSearch,
  phase3QueryTimes,
  type ConversationSummary,
  type MessagesResponse
} from '@/src/features/student/phase3';
import { formatRelativeTime } from '@/src/features/student/utils';
import { api } from '@/src/lib/api';
import { requestOrQueue } from '@/src/lib/offlineQueue';
import { useAuthStore } from '@/src/stores/authStore';

async function fetchMessages() {
  const response = await api.get<MessagesResponse>('/api/student/messages');
  return response.data;
}

export default function MessagesScreen() {
  const isFocused = useIsFocused();
  const sheetRef = useRef<BottomSheet>(null);
  const user = useAuthStore((store) => store.user);
  const [search, setSearch] = useState('');
  const [recipientUserId, setRecipientUserId] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const query = useQuery<MessagesResponse>({
    queryKey: ['student', 'messages'],
    queryFn: fetchMessages,
    staleTime: phase3QueryTimes.messages.staleTime,
    gcTime: phase3QueryTimes.messages.gcTime,
    placeholderData: keepPreviousData,
    refetchInterval: isFocused ? phase3QueryTimes.messages.refetchInterval : false
  });

  const markReadMutation = useMutation({
    mutationFn: (conversationId: number) =>
      api.patch('/api/student/messages', {
        conversationId
      }),
    onSuccess: () => {
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to mark conversation read.');
    }
  });

  const newConversationMutation = useMutation({
    mutationFn: ({ content, recipientId }: { content: string; recipientId: number }) => {
      const body = {
        content,
        recipientUserId: recipientId
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
    onSuccess: (response) => {
      toast.success('Message sent.');
      setRecipientUserId('');
      setNewMessage('');
      sheetRef.current?.close();
      void query.refetch();

      if ('queued' in response) {
        return;
      }

      const conversationId = extractConversationId(response.data);

      if (conversationId) {
        router.push({
          pathname: '/(student)/conversation',
          params: { conversationId }
        });
      }
    },
    onError: () => {
      toast.error('Unable to start conversation.');
    }
  });

  const filteredConversations = useMemo(() => {
    const normalizedSearch = normalizeParticipantSearch(search);

    return (
      query.data?.conversations.filter((conversation: ConversationSummary) => {
        const otherParticipant = getOtherParticipant(conversation.participants, user);
        const haystack = normalizeParticipantSearch(
          `${otherParticipant.name} ${conversation.subject ?? ''}`
        );

        return !normalizedSearch || haystack.includes(normalizedSearch);
      }) ?? []
    );
  }, [query.data?.conversations, search, user]);

  const unreadCount = useMemo(
    () =>
      query.data?.conversations.reduce(
        (total: number, conversation: ConversationSummary) => total + conversation.unreadCount,
        0
      ) ?? 0,
    [query.data?.conversations]
  );

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
          title="Unable to load messages"
          message="Refresh conversations when your connection is back."
          onRetry={() => void query.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<ConversationSummary>
        data={filteredConversations}
        keyExtractor={(item) => `${item.id}`}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }
        ListHeaderComponent={
          <PagePadding style={styles.header}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Messages</Text>
                <Text style={styles.subtitle}>Conversations with partners and support.</Text>
              </View>
              <View style={styles.headerActions}>
                {unreadCount > 0 ? <Badge label={`${unreadCount} unread`} tone="success" /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="New conversation"
                  onPress={() => sheetRef.current?.snapToIndex(0)}
                  style={styles.newButton}
                >
                  <Ionicons name="add" size={24} color={colors.primary} />
                </Pressable>
              </View>
            </View>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search participant or subject"
            />
          </PagePadding>
        }
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No messages yet."
            subtitle="Start by sending a housing enquiry or contacting support."
          />
        }
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <Pressable
                accessibilityRole="button"
                onPress={() => markReadMutation.mutate(item.id)}
                style={styles.swipeAction}
              >
                <Text style={styles.swipeText}>Mark read</Text>
              </Pressable>
            )}
          >
            <ConversationRow
              conversation={item}
              userId={user?.id}
              participantName={getOtherParticipant(item.participants, user).name}
            />
          </Swipeable>
        )}
        contentContainerStyle={styles.listContent}
      />

      <BottomSheet ref={sheetRef} index={-1} snapPoints={['48%']} enablePanDownToClose>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>New conversation</Text>
          <TextInput
            value={recipientUserId}
            onChangeText={setRecipientUserId}
            keyboardType="number-pad"
            placeholder="Recipient user ID"
            placeholderTextColor={colors.inactive}
            style={styles.input}
          />
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            textAlignVertical="top"
            placeholder="Write your first message..."
            placeholderTextColor={colors.inactive}
            style={styles.messageInput}
          />
          <Button
            title="Send"
            loading={newConversationMutation.isPending}
            disabled={!recipientUserId.trim() || !newMessage.trim()}
            onPress={() => {
              const recipientId = Number(recipientUserId);

              if (!Number.isFinite(recipientId)) {
                toast.error('Enter a valid user ID.');
                return;
              }

              newConversationMutation.mutate({
                recipientId,
                content: newMessage.trim()
              });
            }}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function ConversationRow({
  conversation,
  userId,
  participantName
}: {
  conversation: ConversationSummary;
  userId?: number;
  participantName: string;
}) {
  const unread = conversation.unreadCount > 0;
  const senderPrefix =
    conversation.lastMessage.senderUserId === userId ? 'You: ' : '';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/(student)/conversation',
          params: { conversationId: conversation.id }
        })
      }
      style={styles.rowPressable}
    >
      <Card style={styles.conversationCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(participantName)}</Text>
        </View>
        <View style={styles.conversationText}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, unread && styles.nameUnread]} numberOfLines={1}>
              {participantName}
            </Text>
            <Text style={styles.time}>{formatRelativeTime(conversation.lastMessage.sentAt)}</Text>
          </View>
          {conversation.subject ? (
            <Text style={styles.subject} numberOfLines={1}>
              {conversation.subject}
            </Text>
          ) : null}
          <Text style={styles.preview} numberOfLines={1}>
            {senderPrefix}
            {conversation.lastMessage.content}
          </Text>
        </View>
        {unread ? <View style={styles.unreadDot} /> : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  header: {
    paddingBottom: spacing.md
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: spacing.sm
  },
  title: {
    ...typography.headingLarge
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  newButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  listContent: {
    paddingBottom: spacing.xxxl
  },
  rowPressable: {
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xl
  },
  conversationCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  avatarText: {
    color: colors.success,
    fontWeight: '700'
  },
  conversationText: {
    flex: 1,
    gap: 2
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  name: {
    ...typography.body,
    flex: 1,
    fontWeight: '600'
  },
  nameUnread: {
    ...typography.headingSmall
  },
  time: {
    ...typography.caption
  },
  subject: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '700'
  },
  preview: {
    ...typography.body,
    color: colors.textSecondary
  },
  unreadDot: {
    backgroundColor: colors.secondary,
    borderRadius: 5,
    height: 10,
    width: 10
  },
  swipeAction: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    marginRight: spacing.xl,
    paddingHorizontal: spacing.lg
  },
  swipeText: {
    ...typography.label,
    color: colors.primary
  },
  sheetContent: {
    gap: spacing.md,
    padding: spacing.xl
  },
  sheetTitle: {
    ...typography.headingMedium
  },
  input: {
    ...typography.body,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    height: 52,
    paddingHorizontal: spacing.md
  },
  messageInput: {
    ...typography.body,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    minHeight: 112,
    padding: spacing.md
  }
});
