import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DataTable } from '@/src/components/partner/DataTable';
import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { colors, spacing } from '@/src/constants';
import { extractArray, formatDate, formatValue, getString, PartnerLoadingScreen, type PartnerRecord } from '@/src/features/partner/screens';
import { api } from '@/src/lib/api';

export default function AdminFinanceScreen() {
  const query = useQuery({
    queryKey: ['/api/admin/finance', '/api/admin/commissions', '/api/admin/payments', '/api/admin/pricing'],
    queryFn: async () => {
      const [finance, commissions, payments, pricing] = await Promise.all([
        api.get('/api/admin/finance'),
        api.get('/api/admin/commissions'),
        api.get('/api/admin/payments'),
        api.get('/api/admin/pricing')
      ]);

      return {
        finance: finance.data,
        commissions: commissions.data,
        payments: payments.data,
        pricing: pricing.data
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60
  });

  if (query.isLoading) {
    return <PartnerLoadingScreen portalName="Finance" subtitle="Loading finance records." />;
  }

  if (query.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState title="Unable to load finance" onRetry={() => void query.refetch()} />
      </SafeAreaView>
    );
  }

  const rows = [
    ...extractArray(query.data?.finance, ['revenue', 'records']).map((record) => ({ ...record, type: getString(record, 'type', 'Revenue') })),
    ...extractArray(query.data?.commissions, ['commissions']).map((record) => ({ ...record, type: getString(record, 'type', 'Commission') })),
    ...extractArray(query.data?.payments, ['payments']).map((record) => ({ ...record, type: getString(record, 'type', 'Payment') })),
    ...extractArray(query.data?.pricing, ['pricing', 'plans']).map((record) => ({ ...record, type: getString(record, 'type', 'Pricing') }))
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <PartnerHeader portalName="Finance" subtitle="Revenue, commissions, payments, and pricing records." />
        <DataTable
          headers={['Type', 'Amount', 'Date', 'Status']}
          rows={rows.map((record: PartnerRecord) => [
            getString(record, 'type', getString(record, 'name', 'Record')),
            formatValue(record.amount ?? record.revenue ?? record.price, 'currency'),
            formatDate(record.date ?? record.createdAt),
            getString(record, 'status')
          ])}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.xl }
});
