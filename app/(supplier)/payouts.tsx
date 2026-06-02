import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DataTable } from '@/src/components/partner/DataTable';
import { MetricCard } from '@/src/components/partner/MetricCard';
import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { colors, spacing, typography } from '@/src/constants';
import { api } from '@/src/lib/api';
import { extractArray, extractRecord, formatDate, formatValue, getString, PartnerLoadingScreen, type PartnerRecord } from '@/src/features/partner/screens';

export default function SupplierPayoutsScreen() {
  const query = useQuery<unknown>({
    queryKey: ['/api/supplier/payouts'],
    queryFn: async () => (await api.get('/api/supplier/payouts')).data,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60
  });

  if (query.isLoading) {
    return <PartnerLoadingScreen portalName="Payouts" subtitle="Loading payout records." />;
  }

  if (query.isError) {
    return <ErrorState title="Unable to load payouts" onRetry={() => void query.refetch()} />;
  }

  const data = extractRecord(query.data);
  const payouts = extractArray(query.data, ['payouts', 'records']);
  const pending = data.pendingTotal ?? data.totalPendingPayout ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <PartnerHeader portalName="Payouts" subtitle="Track payout history and pending balance." />
        <View style={styles.highlight}>
          <MetricCard label="Total Pending Payout" value={formatValue(pending, 'currency')} trend="up" trendValue="pending" />
        </View>
        <Text style={styles.sectionTitle}>Payout Records</Text>
        <DataTable
          headers={['Amount', 'Date', 'Status', 'Reference']}
          rows={payouts.map((record: PartnerRecord) => [
            formatValue(record.amount, 'currency'),
            formatDate(record.date),
            getString(record, 'status'),
            getString(record, 'reference')
          ])}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.xl },
  highlight: { backgroundColor: colors.successSoft, borderRadius: 16, padding: spacing.xs },
  sectionTitle: { ...typography.headingSmall }
});
