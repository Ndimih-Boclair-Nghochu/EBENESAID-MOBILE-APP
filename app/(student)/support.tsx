import {
  Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData,
  useMutation,
  useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable,
  RefreshControl,
  StyleSheet,
  View
} from 'react-native';
import { TextInput } from '@/src/components/ui/TranslatedTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { toast } from '@/src/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/src/constants';
import { PagePadding, ScreenSkeleton } from '@/src/features/student/components';
import type { SupportMessage, SupportResponse } from '@/src/features/student/types';
import { formatRelativeTime, statusTone, studentQueryTimes } from '@/src/features/student/utils';
import { api } from '@/src/lib/api';

import { Text } from '@/src/components/ui/TranslatedText';

async function fetchSupport() {
  const response = await api.get<SupportResponse>('/api/student/support');
  return response.data;
}

export default function SupportScreen() {
  const [content, setContent] = useState('');

  const query = useQuery<SupportResponse>({
    queryKey: ['student', 'support'],
    queryFn: fetchSupport,
    staleTime: studentQueryTimes.support.staleTime,
    gcTime: studentQueryTimes.support.gcTime,
    placeholderData: keepPreviousData
  });

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      api.post('/api/student/support', {
        action: 'message',
        content: message
      }),
    onSuccess: () => {
      setContent('');
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to send message.');
    }
  });

  const closeMutation = useMutation({
    mutationFn: () =>
      api.post('/api/student/support', {
        action: 'close'
      }),
    onSuccess: () => {
      toast.success('Ticket closed.');
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to close ticket.');
    }
  });

  const sendMessage = () => {
    const trimmed = content.trim();

    if (!trimmed) {
      return;
    }

    sendMutation.mutate(trimmed);
  };

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
          title="Unable to load support"
          message="Refresh messages when your connection is back."
          onRetry={() => void query.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <FlashList<SupportMessage>
          data={query.data.messages}
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
                  <Text style={styles.title}>Support</Text>
                  <Text style={styles.subtitle}>Message the EBENESAID team.</Text>
                </View>
                <Badge label={query.data.status} tone={statusTone(query.data.status)} />
              </View>
              {query.data.status === 'closed' ? (
                <View style={styles.closedBanner}>
                  <Text style={styles.closedText}>Ticket closed</Text>
                  <Button
                    title="Reopen"
                    variant="secondary"
                    loading={sendMutation.isPending}
                    onPress={() => sendMutation.mutate('Reopen ticket')}
                    style={styles.reopenButton}
                  />
                </View>
              ) : (
                <Button
                  title="Close ticket"
                  variant="ghost"
                  loading={closeMutation.isPending}
                  onPress={() => closeMutation.mutate()}
                />
              )}
            </PagePadding>
          }
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No messages yet"
              subtitle="Send a message to open a support conversation."
            />
          }
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messages}
        />
        <View style={styles.composer}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Write a message..."
            placeholderTextColor={colors.inactive}
            multiline
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={sendMessage}
            disabled={sendMutation.isPending}
            style={styles.sendButton}
          >
            <Ionicons name="send" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function MessageBubble({ message }: { message: SupportMessage }) {
  const isUser = message.senderType === 'user';

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.supportBubble]}>
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>{message.content}</Text>
        <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
          {formatRelativeTime(message.sentAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  container: {
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
  title: {
    ...typography.headingLarge
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  closedBanner: {
    alignItems: 'center',
    backgroundColor: colors.errorSoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md
  },
  closedText: {
    ...typography.body,
    color: '#dc2626',
    fontWeight: '700'
  },
  reopenButton: {
    height: 40,
    width: 112
  },
  messages: {
    paddingBottom: spacing.xl
  },
  messageRow: {
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xl
  },
  messageRowUser: {
    alignItems: 'flex-end'
  },
  bubble: {
    borderRadius: radius.lg,
    maxWidth: '82%',
    padding: spacing.md
  },
  userBubble: {
    backgroundColor: colors.secondary
  },
  supportBubble: {
    backgroundColor: colors.neutralSoft
  },
  messageText: {
    ...typography.body
  },
  userMessageText: {
    color: colors.primary
  },
  messageTime: {
    ...typography.caption,
    marginTop: spacing.xs
  },
  userMessageTime: {
    color: colors.primary
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
    maxHeight: 112,
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
  }
});
