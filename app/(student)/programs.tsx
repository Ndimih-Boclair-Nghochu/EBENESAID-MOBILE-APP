import BottomSheet from '@gorhom/bottom-sheet';
import {
  FlashList } from '@shopify/flash-list';
import { keepPreviousData,
  useMutation,
  useQuery } from '@tanstack/react-query';
import { useMemo,
  useRef,
  useState } from 'react';
import { RefreshControl,
  StyleSheet,
  View
} from 'react-native';
import { TextInput } from '@/src/components/ui/TranslatedTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { toast } from '@/src/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/src/constants';
import {
  IconLabel,
  PagePadding,
  ScreenSkeleton,
  SegmentedTabs
} from '@/src/features/student/components';
import type {
  ProgramApplication,
  ProgramsResponse,
  SchoolProgram
} from '@/src/features/student/types';
import {
  formatCurrency,
  formatDate,
  statusTone,
  studentQueryTimes
} from '@/src/features/student/utils';
import { api } from '@/src/lib/api';
import { useAuthStore } from '@/src/stores/authStore';

import { Text } from '@/src/components/ui/TranslatedText';

type ProgramsTab = 'browse' | 'applications';
type ProgramsListItem = SchoolProgram | ProgramApplication;

async function fetchPrograms() {
  const response = await api.get<ProgramsResponse>('/api/student/programs');
  return response.data;
}

export default function ProgramsScreen() {
  const sheetRef = useRef<BottomSheet>(null);
  const userType = useAuthStore((store) => store.user?.userType);
  const [tab, setTab] = useState<ProgramsTab>('browse');
  const [selectedProgram, setSelectedProgram] = useState<SchoolProgram | null>(null);
  const [note, setNote] = useState('');
  const isResident = userType === 'resident';

  const query = useQuery<ProgramsResponse>({
    queryKey: ['student', 'programs'],
    queryFn: fetchPrograms,
    staleTime: studentQueryTimes.programs.staleTime,
    gcTime: studentQueryTimes.programs.gcTime,
    placeholderData: keepPreviousData,
    enabled: !isResident
  });

  const applyMutation = useMutation({
    mutationFn: ({ programId, applicationNote }: { programId: number; applicationNote: string }) =>
      api.post('/api/student/programs', {
        programId,
        note: applicationNote
      }),
    onSuccess: () => {
      toast.success('Program application submitted.');
      setNote('');
      sheetRef.current?.close();
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to apply right now.');
    }
  });

  const appliedProgramIds = useMemo(
    () => new Set(query.data?.applications.map((application: ProgramApplication) => application.programId) ?? []),
    [query.data?.applications]
  );

  const openApplySheet = (program: SchoolProgram) => {
    setSelectedProgram(program);
    setNote('');
    sheetRef.current?.snapToIndex(0);
  };

  if (isResident) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <PagePadding>
          <Text style={styles.title}>Programs</Text>
          <EmptyState
            icon="school-outline"
            title="School programs are available to student accounts."
            subtitle="Resident profiles can continue using the service hub."
          />
        </PagePadding>
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
          title="Unable to load programs"
          message="Refresh programs when your connection is back."
          onRetry={() => void query.refetch()}
        />
      </SafeAreaView>
    );
  }

  const data = tab === 'browse' ? query.data.programs : query.data.applications;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<ProgramsListItem>
        data={data as ProgramsListItem[]}
        keyExtractor={(item) => ('programId' in item ? `${item.programId}` : `${item.id}`)}
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
              <Text style={styles.title}>Programs</Text>
              <Text style={styles.subtitle}>Browse schools and track applications.</Text>
            </View>
            <SegmentedTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { label: 'Browse Programs', value: 'browse' },
                { label: 'My Applications', value: 'applications' }
              ]}
            />
          </PagePadding>
        }
        ListEmptyComponent={
          <EmptyState
            icon="school-outline"
            title={tab === 'browse' ? 'No programs listed' : 'No program applications'}
            subtitle={
              tab === 'browse'
                ? 'Programs from partner schools will appear here.'
                : 'Programs you apply to will appear here.'
            }
          />
        }
        renderItem={({ item }) =>
          tab === 'browse' ? (
            <ProgramCard
              program={item as SchoolProgram}
              applied={appliedProgramIds.has((item as SchoolProgram).id)}
              onApply={() => openApplySheet(item as SchoolProgram)}
            />
          ) : (
            <ProgramApplicationCard application={item as ProgramApplication} />
          )
        }
        contentContainerStyle={styles.listContent}
      />

      <BottomSheet ref={sheetRef} index={-1} snapPoints={['44%']} enablePanDownToClose>
        <View style={styles.sheetContent}>
          <View>
            <Text style={styles.sheetTitle}>{selectedProgram?.title ?? 'Apply'}</Text>
            <Text style={styles.sheetSubtitle}>{selectedProgram?.schoolName}</Text>
          </View>
          <TextInput
            multiline
            value={note}
            onChangeText={setNote}
            placeholder="Add a note for the admissions team..."
            placeholderTextColor={colors.inactive}
            textAlignVertical="top"
            style={styles.noteInput}
          />
          <Button
            title="Submit application"
            loading={applyMutation.isPending}
            onPress={() => {
              if (!selectedProgram) {
                return;
              }
              applyMutation.mutate({
                programId: selectedProgram.id,
                applicationNote: note
              });
            }}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function ProgramCard({
  program,
  applied,
  onApply
}: {
  program: SchoolProgram;
  applied: boolean;
  onApply: () => void;
}) {
  return (
    <Card style={styles.programCard}>
      <View style={styles.programHeader}>
        <View style={styles.programText}>
          <Text style={styles.school}>{program.schoolName}</Text>
          <Text style={styles.programName}>{program.title}</Text>
        </View>
        <Badge label={program.applicationOpen ? 'Open' : 'Closed'} tone={program.applicationOpen ? 'success' : 'default'} />
      </View>
      <IconLabel
        icon="calendar-outline"
        title={`${program.duration} • ${program.language}`}
        subtitle={`Starts ${formatDate(program.startDate)}`}
      />
      <Text style={styles.description} numberOfLines={2}>
        {program.description}
      </Text>
      <Text style={styles.fee}>
        {program.tuitionLabel} tuition
      </Text>
      <Button
        title={applied ? 'Applied' : 'Apply'}
        disabled={!program.applicationOpen || applied}
        onPress={onApply}
      />
    </Card>
  );
}

function ProgramApplicationCard({ application }: { application: ProgramApplication }) {
  return (
    <Card style={styles.programCard}>
      <IconLabel
        icon="school-outline"
        title={application.programName}
        subtitle={`${application.schoolName} • Applied ${formatDate(application.appliedAt)}`}
        right={<Badge label={application.status} tone={statusTone(application.status)} />}
      />
      {application.note ? <Text style={styles.description}>{application.note}</Text> : null}
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
  programCard: {
    gap: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xl
  },
  programHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm
  },
  programText: {
    flex: 1,
    gap: 4
  },
  school: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '700'
  },
  programName: {
    ...typography.headingSmall
  },
  description: {
    ...typography.body,
    color: colors.textSecondary
  },
  fee: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700'
  },
  sheetContent: {
    gap: spacing.md,
    padding: spacing.xl
  },
  sheetTitle: {
    ...typography.headingMedium
  },
  sheetSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  noteInput: {
    ...typography.body,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    minHeight: 128,
    padding: spacing.md
  }
});
