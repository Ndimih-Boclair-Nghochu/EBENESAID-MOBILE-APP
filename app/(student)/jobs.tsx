import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { toast } from '@/src/components/ui/Toast';
import { colors, spacing, typography } from '@/src/constants';
import {
  FilterChip,
  IconLabel,
  PagePadding,
  ScreenSkeleton,
  SearchBar,
  SegmentedTabs
} from '@/src/features/student/components';
import type { JobApplication, JobPost, JobsResponse } from '@/src/features/student/types';
import {
  formatDate,
  normalizeSearch,
  statusTone,
  studentQueryTimes
} from '@/src/features/student/utils';
import { api } from '@/src/lib/api';

type JobsTab = 'browse' | 'applications';
type JobsListItem = JobPost | JobApplication;

const queryKey = ['jobs'] as const;
const filters = ['Full-time', 'Part-time', 'Internship', 'Remote'];

async function fetchJobs() {
  const response = await api.get<JobsResponse>('/api/jobs');
  return response.data;
}

export default function StudentJobsScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<JobsTab>('browse');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const query = useQuery<JobsResponse>({
    queryKey,
    queryFn: fetchJobs,
    staleTime: studentQueryTimes.jobs.staleTime,
    gcTime: studentQueryTimes.jobs.gcTime,
    placeholderData: keepPreviousData
  });

  const saveMutation = useMutation({
    mutationFn: ({ jobId, saved }: { jobId: number; saved: boolean }) =>
      api.post('/api/jobs', {
        action: 'save',
        jobId,
        saved
      }),
    onMutate: async ({ jobId, saved }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<JobsResponse>(queryKey);

      queryClient.setQueryData<JobsResponse>(queryKey, (current: JobsResponse | undefined) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          jobs: current.jobs.map((job: JobPost) => (job.id === jobId ? { ...job, saved } : job))
        };
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error('Unable to update saved job.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    }
  });

  const applyMutation = useMutation({
    mutationFn: (jobId: number) =>
      api.post('/api/jobs', {
        action: 'apply',
        jobId
      }),
    onSuccess: () => {
      toast.success('Application submitted.');
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to apply right now.');
    }
  });

  const filteredJobs = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);

    return (
      query.data?.jobs.filter((job: JobPost) => {
        const matchesSearch =
          !normalizedSearch ||
          normalizeSearch(`${job.title} ${job.company}`).includes(normalizedSearch);
        const matchesFilter = filter === 'All' || job.type.toLowerCase() === filter.toLowerCase();

        return matchesSearch && matchesFilter;
      }) ?? []
    );
  }, [filter, query.data?.jobs, search]);

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
          title="Unable to load jobs"
          message="Refresh the jobs board when your connection is back."
          onRetry={() => void query.refetch()}
        />
      </SafeAreaView>
    );
  }

  const data = tab === 'browse' ? filteredJobs : query.data.applications;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<JobsListItem>
        data={data as JobsListItem[]}
        keyExtractor={(item) => ('jobId' in item ? `${item.jobId}` : `${item.id}`)}
        estimatedItemSize={196}
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
              <Text style={styles.title}>Jobs</Text>
              <Text style={styles.subtitle}>Browse opportunities and track applications.</Text>
            </View>
            <SegmentedTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { label: 'Browse', value: 'browse' },
                { label: 'My Applications', value: 'applications' }
              ]}
            />
            {tab === 'browse' ? (
              <>
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search title or company"
                />
                <View style={styles.chipRow}>
                  <FilterChip label="All" selected={filter === 'All'} onPress={() => setFilter('All')} />
                  {filters.map((option) => (
                    <FilterChip
                      key={option}
                      label={option}
                      selected={filter === option}
                      onPress={() => setFilter(option)}
                    />
                  ))}
                </View>
              </>
            ) : null}
          </PagePadding>
        }
        ListEmptyComponent={
          <EmptyState
            icon="briefcase-outline"
            title={tab === 'browse' ? 'No jobs found' : 'No applications yet'}
            subtitle={
              tab === 'browse'
                ? 'Try another search or filter.'
                : 'Jobs you apply to will appear here.'
            }
          />
        }
        renderItem={({ item }) =>
          tab === 'browse' ? (
            <JobCard
              job={item as JobPost}
              onSave={() =>
                saveMutation.mutate({
                  jobId: (item as JobPost).id,
                  saved: !(item as JobPost).saved
                })
              }
              onApply={() => applyMutation.mutate((item as JobPost).id)}
              isApplying={applyMutation.isPending}
            />
          ) : (
            <ApplicationCard application={item as JobApplication} />
          )
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

function JobCard({
  job,
  onSave,
  onApply,
  isApplying
}: {
  job: JobPost;
  onSave: () => void;
  onApply: () => void;
  isApplying: boolean;
}) {
  return (
    <Card style={styles.jobCard}>
      <View style={styles.jobTitleRow}>
        <View style={styles.jobTitleText}>
          <Text style={styles.company}>{job.company}</Text>
          <Text style={styles.jobTitle}>{job.title}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={job.saved ? 'Unsave job' : 'Save job'}
          onPress={onSave}
          style={styles.saveButton}
        >
          <Ionicons
            name={job.saved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={job.saved ? colors.secondary : colors.textSecondary}
          />
        </Pressable>
      </View>
      <IconLabel icon="location-outline" title={job.location} subtitle={formatDate(job.postedAt)} />
      <View style={styles.metaRow}>
        <Badge label={job.type} tone="info" />
        {job.salary ? <Text style={styles.salary}>{job.salary}</Text> : null}
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {job.description}
      </Text>
      <Button
        title={job.applied ? 'Applied' : 'Apply'}
        disabled={job.applied}
        loading={isApplying}
        onPress={onApply}
      />
    </Card>
  );
}

function ApplicationCard({ application }: { application: JobApplication }) {
  return (
    <Card style={styles.jobCard}>
      <IconLabel
        icon="checkmark-circle-outline"
        title={application.title}
        subtitle={`${application.company} • Applied ${formatDate(application.appliedAt)}`}
        right={<Badge label={application.status} tone={statusTone(application.status)} />}
      />
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  listContent: {
    paddingBottom: spacing.xxxl
  },
  jobCard: {
    gap: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xl
  },
  jobTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm
  },
  jobTitleText: {
    flex: 1,
    gap: 4
  },
  company: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '700'
  },
  jobTitle: {
    ...typography.headingSmall
  },
  saveButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  salary: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600'
  },
  description: {
    ...typography.body,
    color: colors.textSecondary
  }
});
