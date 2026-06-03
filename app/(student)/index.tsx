import {
  Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData,
  useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { RefreshControl,
  Pressable,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { AIAssistantFAB } from '@/src/components/AIAssistantFAB';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { colors, spacing, typography } from '@/src/constants';
import {
  IconLabel,
  PagePadding,
  ProgressBar,
  ScreenSkeleton,
  SectionHeader,
  StatCard
} from '@/src/features/student/components';
import type { StudentOverview } from '@/src/features/student/types';
import {
  formatDate,
  formatRelativeTime,
  clampPercent,
  getGreeting,
  studentQueryTimes
} from '@/src/features/student/utils';
import { api } from '@/src/lib/api';

import { Text } from '@/src/components/ui/TranslatedText';

type Activity = StudentOverview['recentActivity'][number];

async function fetchOverview() {
  const response = await api.get<StudentOverview>('/api/student/overview');
  return response.data;
}

export default function StudentDashboardScreen() {
  const query = useQuery<StudentOverview>({
    queryKey: ['student', 'overview'],
    queryFn: fetchOverview,
    staleTime: studentQueryTimes.dashboard.staleTime,
    gcTime: studentQueryTimes.dashboard.gcTime,
    placeholderData: keepPreviousData
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
          title="Unable to load dashboard"
          message="Refresh the overview when your connection is back."
          onRetry={() => void query.refetch()}
        />
      </SafeAreaView>
    );
  }

  const overview = query.data;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<Activity>
        data={overview.recentActivity}
        keyExtractor={(item, index) => `${item.type}-${item.createdAt}-${index}`}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }
        ListHeaderComponent={<DashboardHeader overview={overview} />}
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="No recent activity"
            subtitle="Your latest relocation updates will appear here."
          />
        }
        renderItem={({ item }) => <ActivityRow activity={item} />}
        contentContainerStyle={styles.listContent}
      />
      {query.isStale ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh dashboard"
          onPress={() => void query.refetch()}
          style={styles.fab}
        >
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </Pressable>
      ) : null}
      <AIAssistantFAB />
    </SafeAreaView>
  );
}

function DashboardHeader({ overview }: { overview: StudentOverview }) {
  return (
    <PagePadding style={styles.headerPadding}>
      <View style={styles.heroRow}>
        <View style={styles.heroCopy}>
          <Text style={styles.title}>
            {getGreeting()}, {overview.firstName}
          </Text>
          <Text style={styles.subtitle}>{overview.university}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open messages"
          onPress={() => router.push('/(student)/messages')}
          style={styles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.secondary} />
        </Pressable>
      </View>

      <Card style={styles.progressCard}>
        <View style={styles.progressTop}>
          <CircularProgressRing percent={overview.completionPercent} />
          <View style={styles.progressCopy}>
            <Text style={styles.cardTitle}>Relocation progress</Text>
            <Text style={styles.cardSubtitle}>
              {overview.countryOfOrigin} to {overview.university}
            </Text>
          </View>
        </View>
        <ProgressBar percent={overview.completionPercent} label="Profile completion" />
      </Card>

      <View style={styles.quickActions}>
        <QuickAction
          icon="business-outline"
          label="Housing"
          onPress={() => router.push('/(student)/housing')}
        />
        <QuickAction
          icon="briefcase-outline"
          label="Jobs"
          onPress={() => router.push('/(student)/jobs')}
        />
        <QuickAction
          icon="restaurant-outline"
          label="Food"
          onPress={() => router.push('/(student)/food')}
        />
        <QuickAction
          icon="document-text-outline"
          label="Docs"
          onPress={() => router.push('/(student)/documents')}
        />
        <QuickAction
          icon="car-outline"
          label="Arrival"
          onPress={() => router.push('/(student)/arrival')}
        />
        <QuickAction
          icon="people-outline"
          label="Community"
          onPress={() => router.push('/(student)/community')}
        />
      </View>

      <Card style={styles.nextStepsCard}>
        <SectionHeader title="Next Steps" />
        <View style={styles.nextSteps}>
          {overview.nextSteps.map((step) => (
            <View key={step.title} style={styles.stepRow}>
              <Ionicons
                name={step.done ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={step.done ? colors.secondary : colors.inactive}
              />
              <Text style={[styles.stepText, step.done && styles.stepDone]}>{step.title}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.statsRow}>
        <StatCard
          icon="business-outline"
          label="Housing"
          value={overview.housingStatus ?? 'Not started'}
        />
        <StatCard icon="briefcase-outline" label="Saved jobs" value={`${overview.jobsCount}`} />
        <StatCard
          icon="people-outline"
          label="Circles"
          value={`${overview.communityCirclesCount}`}
        />
      </View>

      <Card style={styles.detailsCard}>
        <IconLabel
          icon="calendar-outline"
          title="Arrival date"
          subtitle={formatDate(overview.arrivalDate)}
          right={<Badge label={overview.arrivalDate ? 'Planned' : 'Pending'} tone="info" />}
        />
      </Card>

      <SectionHeader title="Recent Activity" />
    </PagePadding>
  );
}

function QuickAction({
  icon,
  label,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.quickAction}>
      <Ionicons name={icon} size={22} color={colors.secondary} />
      <Text style={styles.quickActionText}>{label}</Text>
    </Pressable>
  );
}

function CircularProgressRing({ percent }: { percent: number }) {
  const clampedPercent = clampPercent(percent);
  const radius = 29;
  const strokeWidth = 7;
  const size = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * clampedPercent) / 100;

  return (
    <View style={styles.circleProgress}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.neutralSoft}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.secondary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          fill="transparent"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <Text style={styles.circleText}>{clampedPercent}%</Text>
    </View>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <Card style={styles.activityCard}>
      <IconLabel
        icon="notifications-outline"
        title={activity.description}
        subtitle={formatRelativeTime(activity.createdAt)}
        color={colors.info}
        right={<Badge label={activity.type} tone="default" size="small" />}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  listContent: {
    paddingBottom: spacing.xxxl
  },
  headerPadding: {
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
  heroRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md
  },
  heroCopy: {
    flex: 1
  },
  notificationButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  progressCard: {
    gap: spacing.md
  },
  progressTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md
  },
  circleProgress: {
    alignItems: 'center',
    height: 72,
    justifyContent: 'center',
    width: 72
  },
  circleText: {
    position: 'absolute',
    ...typography.headingSmall,
    color: colors.secondary
  },
  progressCopy: {
    flex: 1,
    gap: 4
  },
  cardTitle: {
    ...typography.headingSmall
  },
  cardSubtitle: {
    ...typography.caption
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  quickAction: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    minHeight: 76,
    justifyContent: 'center',
    padding: spacing.sm,
    width: '31%'
  },
  quickActionText: {
    ...typography.label,
    textAlign: 'center'
  },
  nextStepsCard: {
    gap: spacing.md
  },
  nextSteps: {
    gap: spacing.sm
  },
  stepRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  stepText: {
    ...typography.body,
    flex: 1
  },
  stepDone: {
    color: colors.textSecondary
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  detailsCard: {
    gap: spacing.md
  },
  activityCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm
  },
  fab: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 28,
    bottom: spacing.xl,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 92,
    width: 56
  }
});
