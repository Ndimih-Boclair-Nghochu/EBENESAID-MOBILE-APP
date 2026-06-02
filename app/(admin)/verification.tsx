import { FlashList } from '@shopify/flash-list';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { StatusBadge } from '@/src/components/partner/StatusBadge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { toast } from '@/src/components/ui/Toast';
import { colors, spacing, typography } from '@/src/constants';
import { extractArray, getRecordId, getString, PartnerLoadingScreen, statusTone, type PartnerRecord } from '@/src/features/partner/screens';
import { api } from '@/src/lib/api';

export default function AdminVerificationScreen() {
  const query = useQuery<unknown>({
    queryKey: ['/api/admin/verification'],
    queryFn: async () => (await api.get('/api/admin/verification')).data,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData
  });

  const mutation = useMutation({
    mutationFn: ({ record, status }: { record: PartnerRecord; status: string }) =>
      api.patch('/api/admin/verification', { id: getRecordId(record), status }),
    onSuccess: () => {
      toast.success('Verification updated.');
      void query.refetch();
    }
  });

  if (query.isLoading) {
    return <PartnerLoadingScreen portalName="Verification Queue" subtitle="Loading partner verification queue." />;
  }

  if (query.isError) {
    return <ErrorState title="Unable to load verification queue" onRetry={() => void query.refetch()} />;
  }

  const records = extractArray(query.data, ['queue', 'verifications', 'partners']);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<PartnerRecord>
        data={records}
        keyExtractor={(item) => `${getRecordId(item)}`}
        estimatedItemSize={144}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.secondary} colors={[colors.secondary]} />}
        ListHeaderComponent={<View style={styles.content}><PartnerHeader portalName="Verification Queue" subtitle="Approve or reject partner verification." /></View>}
        ListEmptyComponent={<EmptyState icon="shield-checkmark-outline" title="No pending verifications" />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.textGroup}>
                <Text style={styles.title}>{getString(item, 'name', getString(item, 'businessName', 'Partner'))}</Text>
                <Text style={styles.meta}>{getString(item, 'type', getString(item, 'partnerType'))}</Text>
                <Text style={styles.meta}>{getString(item, 'documentsUploaded', '0')} documents uploaded</Text>
              </View>
              <StatusBadge label={getString(item, 'status', 'pending')} tone={statusTone(item.status)} />
            </View>
            <View style={styles.actions}>
              <Button title="Reject" variant="danger" onPress={() => mutation.mutate({ record: item, status: 'rejected' })} style={styles.button} />
              <Button title="Approve" onPress={() => mutation.mutate({ record: item, status: 'approved' })} style={styles.button} />
            </View>
          </Card>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { padding: spacing.xl },
  listContent: { paddingBottom: spacing.xxxl },
  card: { gap: spacing.md, marginBottom: spacing.sm, marginHorizontal: spacing.xl },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  textGroup: { flex: 1, gap: 4 },
  title: { ...typography.headingSmall },
  meta: { ...typography.caption },
  actions: { flexDirection: 'row', gap: spacing.sm },
  button: { flex: 1 }
});
