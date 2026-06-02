import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
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
  SegmentedTabs
} from '@/src/features/student/components';
import {
  extractConversationId,
  getInitials,
  phase3QueryTimes,
  type BuddyMatch,
  type CommunityCircle,
  type CommunityEvent,
  type CommunityResponse
} from '@/src/features/student/phase3';
import { formatDate } from '@/src/features/student/utils';
import { api } from '@/src/lib/api';

type CommunityTab = 'circles' | 'events' | 'buddies';
type CommunityListItem = CommunityCircle | CommunityEvent | BuddyMatch;

async function fetchCommunity() {
  const response = await api.get<CommunityResponse>('/api/student/community');
  return response.data;
}

export default function CommunityScreen() {
  const sheetRef = useRef<BottomSheet>(null);
  const [tab, setTab] = useState<CommunityTab>('circles');
  const [circleName, setCircleName] = useState('');
  const [circleDescription, setCircleDescription] = useState('');

  const query = useQuery<CommunityResponse>({
    queryKey: ['student', 'community'],
    queryFn: fetchCommunity,
    staleTime: phase3QueryTimes.community.staleTime,
    gcTime: phase3QueryTimes.community.gcTime,
    placeholderData: keepPreviousData
  });

  const joinMutation = useMutation({
    mutationFn: (circleId: number) =>
      api.post('/api/student/community', {
        action: 'join',
        circleId
      }),
    onSuccess: () => {
      toast.success('Circle joined.');
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to join circle.');
    }
  });

  const requestCircleMutation = useMutation({
    mutationFn: () =>
      api.post('/api/student/community', {
        action: 'request-circle',
        name: circleName.trim(),
        description: circleDescription.trim()
      }),
    onSuccess: () => {
      toast.success('Circle request sent.');
      setCircleName('');
      setCircleDescription('');
      sheetRef.current?.close();
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to request circle.');
    }
  });

  const messageBuddyMutation = useMutation({
    mutationFn: (buddy: BuddyMatch) =>
      api.post('/api/student/messages', {
        content: 'Hi! I saw we matched on EBENESAID.',
        recipientUserId: buddy.userId
      }),
    onSuccess: (response) => {
      const conversationId = extractConversationId(response.data);
      toast.success('Message sent.');

      if (conversationId) {
        router.push({
          pathname: '/(student)/conversation',
          params: { conversationId }
        });
      }
    },
    onError: () => {
      toast.error('Unable to message buddy.');
    }
  });

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
          title="Unable to load community"
          message="Refresh community when your connection is back."
          onRetry={() => void query.refetch()}
        />
      </SafeAreaView>
    );
  }

  const data =
    tab === 'circles'
      ? query.data.circles
      : tab === 'events'
        ? query.data.events
        : query.data.buddyMatches;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<CommunityListItem>
        data={data as CommunityListItem[]}
        key={tab}
        numColumns={tab === 'buddies' ? 2 : 1}
        keyExtractor={(item) =>
          'userId' in item ? `buddy-${item.userId}` : `${tab}-${item.id}`
        }
        estimatedItemSize={tab === 'buddies' ? 220 : 156}
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
            <View>
              <Text style={styles.title}>Community</Text>
              <Text style={styles.subtitle}>Find circles, events, and student buddies.</Text>
            </View>
            <SegmentedTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { label: 'Circles', value: 'circles' },
                { label: 'Events', value: 'events' },
                { label: 'Buddies', value: 'buddies' }
              ]}
            />
          </PagePadding>
        }
        ListEmptyComponent={
          <EmptyState
            icon={tab === 'events' ? 'calendar-outline' : tab === 'buddies' ? 'people-outline' : 'chatbubbles-outline'}
            title={
              tab === 'events'
                ? 'No events yet'
                : tab === 'buddies'
                  ? 'No buddy matches yet'
                  : 'No circles yet'
            }
            subtitle="Community updates will appear here."
          />
        }
        renderItem={({ item }) => {
          if (tab === 'circles') {
            return (
              <CircleCard
                circle={item as CommunityCircle}
                onJoin={() => joinMutation.mutate((item as CommunityCircle).id)}
                isJoining={joinMutation.isPending}
              />
            );
          }

          if (tab === 'events') {
            return <EventCard event={item as CommunityEvent} />;
          }

          return (
            <BuddyCard
              buddy={item as BuddyMatch}
              onMessage={() => messageBuddyMutation.mutate(item as BuddyMatch)}
              isMessaging={messageBuddyMutation.isPending}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
      />
      {tab === 'circles' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Request new circle"
          onPress={() => sheetRef.current?.snapToIndex(0)}
          style={styles.fab}
        >
          <Ionicons name="add" size={26} color={colors.primary} />
        </Pressable>
      ) : null}

      <BottomSheet ref={sheetRef} index={-1} snapPoints={['48%']} enablePanDownToClose>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Request new circle</Text>
          <TextInput
            value={circleName}
            onChangeText={setCircleName}
            placeholder="Circle name"
            placeholderTextColor={colors.inactive}
            style={styles.input}
          />
          <TextInput
            value={circleDescription}
            onChangeText={setCircleDescription}
            multiline
            textAlignVertical="top"
            placeholder="Describe the circle..."
            placeholderTextColor={colors.inactive}
            style={styles.textArea}
          />
          <Button
            title="Send request"
            loading={requestCircleMutation.isPending}
            disabled={!circleName.trim() || !circleDescription.trim()}
            onPress={() => requestCircleMutation.mutate()}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function CircleCard({
  circle,
  onJoin,
  isJoining
}: {
  circle: CommunityCircle;
  onJoin: () => void;
  isJoining: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (!circle.joined) {
          return;
        }

        router.push({
          pathname: '/(student)/circle-detail',
          params: {
            circleId: circle.id,
            name: circle.name,
            memberCount: circle.memberCount
          }
        });
      }}
      style={styles.fullRow}
    >
      <Card style={styles.circleCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleText}>
            <Text style={styles.cardTitle}>{circle.name}</Text>
            <Text style={styles.cardSubtitle}>{circle.memberCount} members</Text>
          </View>
          {circle.joined ? <Badge label="Joined" tone="success" /> : null}
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {circle.description}
        </Text>
        {circle.joined ? (
          <Text style={styles.openHint}>Open circle</Text>
        ) : (
          <Button title="Join" loading={isJoining} onPress={onJoin} />
        )}
      </Card>
    </Pressable>
  );
}

function EventCard({ event }: { event: CommunityEvent }) {
  return (
    <Card style={styles.eventCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleText}>
          <Text style={styles.cardTitle}>{event.title}</Text>
          <Text style={styles.cardSubtitle}>{formatDate(event.date)}</Text>
        </View>
        <Badge label={event.location} tone="info" />
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {event.description}
      </Text>
      <Button
        title="Add to Calendar"
        variant="secondary"
        onPress={() => {
          // TODO Phase 3: replace this stub with expo-calendar event creation.
          toast.info('Calendar integration coming soon.');
        }}
      />
    </Card>
  );
}

function BuddyCard({
  buddy,
  onMessage,
  isMessaging
}: {
  buddy: BuddyMatch;
  onMessage: () => void;
  isMessaging: boolean;
}) {
  const interests = Array.isArray(buddy.interests) ? buddy.interests.join(', ') : buddy.interests;

  return (
    <Card style={styles.buddyCard}>
      <View style={styles.buddyAvatar}>
        <Text style={styles.buddyAvatarText}>{getInitials(buddy.name)}</Text>
      </View>
      <Text style={styles.buddyName} numberOfLines={1}>
        {buddy.name}
      </Text>
      <Text style={styles.buddyMeta} numberOfLines={2}>
        {buddy.university}
      </Text>
      <Text style={styles.buddyMeta} numberOfLines={1}>
        {buddy.countryOfOrigin}
      </Text>
      {interests ? (
        <Text style={styles.interests} numberOfLines={2}>
          {interests}
        </Text>
      ) : null}
      <Button title="Message" loading={isMessaging} onPress={onMessage} />
    </Card>
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
  title: {
    ...typography.headingLarge
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  listContent: {
    paddingBottom: spacing.xxxl
  },
  fullRow: {
    marginBottom: spacing.md,
    marginHorizontal: spacing.xl
  },
  circleCard: {
    gap: spacing.md
  },
  eventCard: {
    gap: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xl
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between'
  },
  cardTitleText: {
    flex: 1,
    gap: 4
  },
  cardTitle: {
    ...typography.headingSmall
  },
  cardSubtitle: {
    ...typography.caption
  },
  description: {
    ...typography.body,
    color: colors.textSecondary
  },
  openHint: {
    ...typography.label,
    color: colors.secondary
  },
  buddyCard: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs
  },
  buddyAvatar: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56
  },
  buddyAvatarText: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '700'
  },
  buddyName: {
    ...typography.headingSmall,
    textAlign: 'center'
  },
  buddyMeta: {
    ...typography.caption,
    textAlign: 'center'
  },
  interests: {
    ...typography.caption,
    color: colors.secondary,
    minHeight: 32,
    textAlign: 'center'
  },
  fab: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 28,
    bottom: spacing.xl,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.xl,
    width: 56
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
  textArea: {
    ...typography.body,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    minHeight: 112,
    padding: spacing.md
  }
});

