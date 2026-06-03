import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { Text } from '@/src/components/ui/TranslatedText';
import { toast } from '@/src/components/ui/Toast';
import { colors, spacing, typography } from '@/src/constants';
import {
  FilterChip, PagePadding, ScreenSkeleton, SearchBar, SegmentedTabs,
} from '@/src/features/student/components';
import type { JobsResponse, StudentJobBoardItem } from '@/src/features/student/types';
import { normalizeSearch, statusTone, studentQueryTimes } from '@/src/features/student/utils';
import { api } from '@/src/lib/api';

type Tab = 'browse' | 'applied';
const FILTERS = ['All', 'Full-time', 'Part-time', 'Internship', 'Remote'] as const;
const QK = ['jobs'] as const;

async function fetchJobs() {
  const r = await api.get<JobsResponse>('/api/jobs');
  return r.data;
}

export default function JobsScreen() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('browse');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const query = useQuery<JobsResponse>({
    queryKey: QK,
    queryFn: fetchJobs,
    staleTime: studentQueryTimes.jobs.staleTime,
    gcTime: studentQueryTimes.jobs.gcTime,
    placeholderData: keepPreviousData,
  });

  const saveMut = useMutation({
    mutationFn: (v: { jobId: number; saved: boolean }) =>
      api.post('/api/jobs', { action: 'save', ...v }),
    onMutate: async ({ jobId, saved }) => {
      await qc.cancelQueries({ queryKey: QK });
      const prev = qc.getQueryData<JobsResponse>(QK);
      if (prev) {
        qc.setQueryData<JobsResponse>(QK, {
          ...prev,
          jobs: prev.jobs.map((j) => (j.id === jobId ? { ...j, saved } : j)),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK, ctx.prev);
      toast.error('Could not save job.');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QK }),
  });

  const applyMut = useMutation({
    mutationFn: (jobId: number) => api.post('/api/jobs', { action: 'apply', jobId }),
    onSuccess: () => {
      toast.success('Application submitted! You will receive a confirmation email.');
      qc.invalidateQueries({ queryKey: QK });
    },
    onError: () => toast.error('Could not apply. Please try again.'),
  });

  if (query.isLoading) return <SafeAreaView style={s.safe}><ScreenSkeleton rows={5} /></SafeAreaView>;

  if (query.isError || !query.data) {
    return (
      <SafeAreaView style={s.safe}>
        <ErrorState title="Unable to load jobs" message="Check your connection and retry." onRetry={() => void query.refetch()} />
      </SafeAreaView>
    );
  }

  // Backend: { jobs: StudentJobBoardItem[], savedCount, appliedCount }
  // Each job has: id, title, company, location, salary, type, logo, description, applied, saved, applicationStatus
  const allJobs = query.data.jobs ?? [];
  const applied = allJobs.filter((j) => j.applied);

  const browse = useMemo(() => {
    const q = normalizeSearch(search);
    return allJobs.filter((j) => {
      const ms = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
      const mf = filter === 'All' || j.type?.toLowerCase().includes(filter.toLowerCase().replace('-', ''));
      return ms && mf;
    });
  }, [allJobs, search, filter]);

  const listData = tab === 'browse' ? browse : applied;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <FlashList<StudentJobBoardItem>
        data={listData}
        keyExtractor={(j) => String(j.id)}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }
        ListHeaderComponent={
          <PagePadding>
            <View style={s.tabs}>
              {(['browse', 'applied'] as Tab[]).map((t) => (
                <Pressable
                  key={t}
                  accessibilityRole="button"
                  onPress={() => setTab(t)}
                  style={[s.tab, tab === t && s.tabActive]}
                >
                  <Text style={[s.tabLabel, tab === t && s.tabLabelActive]}>
                    {t === 'browse' ? 'Browse' : `Applied (${applied.length})`}
                  </Text>
                </Pressable>
              ))}
            </View>
            {tab === 'browse' && (
              <>
                <SearchBar value={search} onChangeText={setSearch} placeholder="Search jobs…" />
                <View style={s.chips}>
                  {FILTERS.map((f) => (
                    <FilterChip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
                  ))}
                </View>
              </>
            )}
          </PagePadding>
        }
        ListEmptyComponent={
          <EmptyState
            icon="briefcase-outline"
            title={tab === 'browse' ? 'No jobs found' : 'No applications yet'}
            subtitle={tab === 'browse' ? 'Try a different search or filter.' : 'Browse and tap Apply to get started.'}
          />
        }
        renderItem={({ item }) => (
          <View style={s.row}>
            <JobCard
              job={item}
              onSave={() => saveMut.mutate({ jobId: item.id, saved: !item.saved })}
              onApply={() => applyMut.mutate(item.id)}
              applying={applyMut.isPending}
            />
          </View>
        )}
        contentContainerStyle={s.list}
      />
    </SafeAreaView>
  );
}

function JobCard({
  job, onSave, onApply, applying,
}: {
  job: StudentJobBoardItem;
  onSave: () => void;
  onApply: () => void;
  applying: boolean;
}) {
  return (
    <Card style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(job.company ?? '?')[0]?.toUpperCase()}</Text>
        </View>
        <View style={s.meta}>
          <Text style={s.jobTitle}>{job.title}</Text>
          <Text style={s.company}>{job.company}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={job.saved ? 'Unsave' : 'Save'} onPress={onSave}>
          <Ionicons
            name={job.saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={job.saved ? colors.secondary : colors.textSecondary}
          />
        </Pressable>
      </View>

      <View style={s.tags}>
        {job.type ? <Badge label={job.type} tone="info" size="small" /> : null}
        {job.salary ? <Badge label={job.salary} tone="success" size="small" /> : null}
        {job.location ? <Badge label={job.location} tone="default" size="small" /> : null}
      </View>

      {job.description ? (
        <Text style={s.desc} numberOfLines={2}>{job.description}</Text>
      ) : null}

      <View style={s.actions}>
        {job.applied ? (
          <Badge
            label={job.applicationStatus ?? 'Applied ✓'}
            tone={statusTone(job.applicationStatus ?? 'applied')}
          />
        ) : (
          <Button
            title={applying ? 'Applying…' : 'Apply Now'}
            variant="primary"
            disabled={applying}
            onPress={onApply}
          />
        )}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxxl },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  tabLabel: { ...typography.label, color: colors.textSecondary },
  tabLabelActive: { color: '#fff' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  row: { paddingHorizontal: spacing.xl, marginBottom: spacing.sm },
  card: { gap: spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...typography.headingSmall, color: colors.secondary },
  meta: { flex: 1 },
  jobTitle: { ...typography.label, fontSize: 14 },
  company: { ...typography.caption, color: colors.textSecondary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  desc: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  actions: { alignItems: 'flex-start' },
});
