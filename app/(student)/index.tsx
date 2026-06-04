import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { AIAssistantFAB } from '@/src/components/AIAssistantFAB';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { Text } from '@/src/components/ui/TranslatedText';
import { colors, spacing, typography } from '@/src/constants';
import {
  IconLabel,
  PagePadding,
  ProgressBar,
  ScreenSkeleton,
  SectionHeader,
  StatCard,
} from '@/src/features/student/components';
import type { StudentDashboardTask, StudentOverview } from '@/src/features/student/types';
import { clampPercent, formatDate, formatRelativeTime, getGreeting, studentQueryTimes } from '@/src/features/student/utils';
import { api } from '@/src/lib/api';

async function fetchOverview() {
  const r = await api.get<StudentOverview>('/api/student/overview');
  return r.data;
}

function getSafeProfile(ov: StudentOverview): StudentOverview['profile'] {
  return {
    firstName: ov.profile?.firstName ?? 'there',
    lastName: ov.profile?.lastName ?? '',
    email: ov.profile?.email ?? '',
    phone: ov.profile?.phone ?? '',
    whatsapp: ov.profile?.whatsapp ?? '',
    nationality: ov.profile?.nationality ?? '',
    currentCountry: ov.profile?.currentCountry ?? '',
    destinationCountry: ov.profile?.destinationCountry ?? 'Latvia',
    destinationCity: ov.profile?.destinationCity ?? '',
    preferredSchool: ov.profile?.preferredSchool ?? '',
    preferredProgram: ov.profile?.preferredProgram ?? '',
    emergencyContactName: ov.profile?.emergencyContactName ?? '',
    emergencyContactPhone: ov.profile?.emergencyContactPhone ?? '',
    emergencyContactRelationship: ov.profile?.emergencyContactRelationship ?? '',
    passportNumberMasked: ov.profile?.passportNumberMasked ?? '',
    passportExpiryDate: ov.profile?.passportExpiryDate ?? '',
    profilePhotoUrl: ov.profile?.profilePhotoUrl ?? '',
    university: ov.profile?.university ?? '',
    countryOfOrigin: ov.profile?.countryOfOrigin ?? '',
    completionPercent: ov.profile?.completionPercent ?? 0
  };
}

export default function StudentDashboardScreen() {
  const query = useQuery<StudentOverview>({
    queryKey: ['student', 'overview'],
    queryFn: fetchOverview,
    staleTime: studentQueryTimes.dashboard.staleTime,
    gcTime: studentQueryTimes.dashboard.gcTime,
    placeholderData: keepPreviousData,
  });

  if (query.isLoading) {
    return <SafeAreaView style={s.safe}><ScreenSkeleton rows={5} /></SafeAreaView>;
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView style={s.safe}>
        <ErrorState
          title="Unable to load dashboard"
          message="Check your connection and tap Retry."
          onRetry={() => void query.refetch()}
        />
      </SafeAreaView>
    );
  }

  const ov = query.data;
  // The backend returns a nested StudentRelocationOverview
  const profile = getSafeProfile(ov);
  const tasks = ov.dashboard?.tasks ?? [];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <FlashList<StudentDashboardTask>
        data={tasks}
        keyExtractor={(t) => String(t.id)}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }
        ListHeaderComponent={<Header ov={ov} profile={profile} />}
        ListEmptyComponent={
          <EmptyState icon="checkmark-circle-outline" title="All tasks done!" subtitle="Your relocation checklist is complete." />
        }
        renderItem={({ item }) => <TaskRow task={item} />}
        contentContainerStyle={s.list}
      />
      <AIAssistantFAB />
    </SafeAreaView>
  );
}

function Header({ ov, profile }: { ov: StudentOverview; profile: StudentOverview['profile'] }) {
  const pct = clampPercent(profile.completionPercent ?? 0);
  const notifications = ov.notifications ?? [];

  return (
    <PagePadding style={s.headerPad}>
      {/* Greeting row */}
      <View style={s.heroRow}>
        <View style={s.heroCopy}>
          <Text style={s.title}>{getGreeting()}, {profile.firstName} 👋</Text>
          <Text style={s.subtitle}>{profile.university || profile.countryOfOrigin || 'EBENESAID'}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Messages"
          onPress={() => router.push('/(student)/messages')}
          style={s.notifBtn}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.secondary} />
        </Pressable>
      </View>

      {/* Backend notifications */}
      {notifications.slice(0, 2).map((n) => (
        <Card key={n.id} style={s.notifCard}>
          <Text style={s.notifTitle}>{n.title}</Text>
          <Text style={s.notifBody}>{n.body}</Text>
        </Card>
      ))}

      {/* Circular progress */}
      <Card style={s.progressCard}>
        <View style={s.progressTop}>
          <Ring pct={pct} />
          <View style={s.progressCopy}>
            <Text style={s.cardTitle}>Relocation progress</Text>
            <Text style={s.cardSub}>
              {profile.countryOfOrigin ? `${profile.countryOfOrigin} → Latvia` : 'Complete your profile'}
            </Text>
          </View>
        </View>
        <ProgressBar percent={pct} label="Profile completion" />
      </Card>

      {/* Quick actions 3×2 */}
      <View style={s.grid}>
        {([
          { icon: 'business-outline', label: 'Housing', path: '/(student)/housing' },
          { icon: 'briefcase-outline', label: 'Jobs', path: '/(student)/jobs' },
          { icon: 'restaurant-outline', label: 'Food', path: '/(student)/food' },
          { icon: 'document-text-outline', label: 'Docs', path: '/(student)/documents' },
          { icon: 'car-outline', label: 'Arrival', path: '/(student)/arrival' },
          { icon: 'people-outline', label: 'Community', path: '/(student)/community' },
        ] as const).map(({ icon, label, path }) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            onPress={() => router.push(path as Parameters<typeof router.push>[0])}
            style={s.qa}
          >
            <View style={s.qaIcon}>
              <Ionicons name={icon} size={22} color={colors.secondary} />
            </View>
            <Text style={s.qaLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <StatCard
          icon="business-outline"
          label="Housing"
          value={`${ov.housing?.requestCount ?? 0} requests`}
        />
        <StatCard
          icon="briefcase-outline"
          label="Applied"
          value={`${ov.applications?.jobCount ?? 0} jobs`}
        />
        <StatCard
          icon="document-text-outline"
          label="Docs"
          value={`${ov.documents?.verified ?? 0}/${ov.documents?.total ?? 0}`}
        />
      </View>

      {/* Arrival */}
      {ov.arrival ? (
        <Card style={s.arrivalCard}>
          <IconLabel
            icon="calendar-outline"
            title="Arrival date"
            subtitle={ov.arrival.travelDate ? formatDate(ov.arrival.travelDate) : 'Not planned yet'}
            right={
              <Badge
                label={ov.arrival.pickupBooked ? 'Booked' : 'Pending'}
                tone={ov.arrival.pickupBooked ? 'success' : 'warning'}
              />
            }
          />
        </Card>
      ) : null}

      <SectionHeader title="Relocation Tasks" />
    </PagePadding>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 29, sw = 7, sz = 72;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * pct) / 100;
  return (
    <View style={s.ring}>
      <Svg width={sz} height={sz}>
        <Circle cx={sz / 2} cy={sz / 2} r={r} stroke={colors.neutralSoft} strokeWidth={sw} fill="transparent" />
        <Circle
          cx={sz / 2} cy={sz / 2} r={r}
          stroke={colors.secondary} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
          fill="transparent" rotation="-90" originX={sz / 2} originY={sz / 2}
        />
      </Svg>
      <Text style={s.ringText}>{pct}%</Text>
    </View>
  );
}

function TaskRow({ task }: { task: StudentDashboardTask }) {
  return (
    <Card style={s.taskCard}>
      <View style={s.taskRow}>
        <Ionicons
          name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={task.done ? colors.secondary : colors.inactive}
        />
        <View style={s.taskBody}>
          <Text style={[s.taskTitle, task.done && s.taskDone]}>{task.title}</Text>
          {task.desc ? <Text style={s.taskDesc}>{task.desc}</Text> : null}
        </View>
        {!task.done && <Badge label="Pending" tone="warning" size="small" />}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxxl },
  headerPad: { paddingBottom: spacing.md },
  title: { ...typography.headingLarge },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroCopy: { flex: 1 },
  notifBtn: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  notifCard: { backgroundColor: '#FFFBEB', borderColor: '#FCD34D', marginBottom: spacing.sm },
  notifTitle: { ...typography.label, color: '#92400E', marginBottom: 2 },
  notifBody: { ...typography.caption, color: '#78350F' },
  progressCard: { gap: spacing.md },
  progressTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ring: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  ringText: { position: 'absolute', ...typography.headingSmall, color: colors.secondary },
  progressCopy: { flex: 1, gap: 4 },
  cardTitle: { ...typography.headingSmall },
  cardSub: { ...typography.caption },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  qa: {
    width: '31%', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: spacing.sm, minHeight: 76, gap: spacing.xs,
  },
  qaIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },
  qaLabel: { ...typography.label, fontSize: 11, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  arrivalCard: {},
  taskCard: { marginHorizontal: spacing.xl, marginBottom: spacing.sm },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  taskBody: { flex: 1 },
  taskTitle: { ...typography.body },
  taskDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  taskDone: { color: colors.textSecondary, textDecorationLine: 'line-through' },
});
