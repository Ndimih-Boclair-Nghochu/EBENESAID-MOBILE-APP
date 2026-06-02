import { FlashList } from '@shopify/flash-list';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MetricCard } from '@/src/components/partner/MetricCard';
import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { colors, spacing, typography } from '@/src/constants';
import {
  extractArray,
  extractRecord,
  formatDate,
  formatValue,
  getNumber,
  getString,
  PartnerLoadingScreen,
  type PartnerRecord
} from '@/src/features/partner/screens';
import { api } from '@/src/lib/api';

export default function AdminDashboardScreen() {
  const query = useQuery<unknown>({
    queryKey: ['/api/admin/summary'],
    queryFn: async () => (await api.get('/api/admin/summary')).data,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData
  });

  if (query.isLoading) {
    return <PartnerLoadingScreen portalName="Admin Dashboard" subtitle="Loading platform control center." />;
  }

  if (query.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState title="Unable to load admin dashboard" onRetry={() => void query.refetch()} />
      </SafeAreaView>
    );
  }

  const data = extractRecord(query.data);
  const auditEvents = extractArray(query.data, ['recentAuditEvents', 'auditEvents', 'recentActivity']).slice(0, 5);
  const userBreakdown = extractArray(query.data, ['usersByType', 'userBreakdown', 'breakdown']);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<PartnerRecord>
        data={auditEvents}
        keyExtractor={(item, index) => `${getString(item, 'action', 'audit')}-${index}`}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.content}>
            <PartnerHeader portalName="Admin Dashboard" subtitle="Full platform control center." />
            <View style={styles.metricRow}>
              <MetricCard label="Total Users" value={formatValue(data.totalUsers, 'number')} />
              <MetricCard label="Total Revenue" value={formatValue(data.totalRevenue ?? data.revenue, 'currency')} />
            </View>
            <View style={styles.metricRow}>
              <MetricCard label="Active Orders" value={formatValue(data.activeOrders, 'number')} />
              <MetricCard label="Housing Listings" value={formatValue(data.housingListings, 'number')} />
            </View>
            <View style={styles.metricRow}>
              <MetricCard label="Pending Verifications" value={formatValue(data.pendingVerifications, 'number')} />
              <MetricCard label="Support Tickets" value={formatValue(data.openSupportTickets, 'number')} />
            </View>
            <Card style={styles.breakdownCard}>
              <Text style={styles.sectionTitle}>Users by Type</Text>
              {userBreakdown.length > 0 ? (
                userBreakdown.map((item) => <BreakdownBar key={getString(item, 'type')} record={item} />)
              ) : (
                <Text style={styles.emptyCopy}>No breakdown data yet.</Text>
              )}
            </Card>
            <Text style={styles.sectionTitle}>Recent Audit Events</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="shield-checkmark-outline" title="No audit events" />}
        renderItem={({ item }) => (
          <Card style={styles.auditCard}>
            <Text style={styles.auditTitle}>{getString(item, 'action', 'Audit event')}</Text>
            <Text style={styles.auditMeta}>{getString(item, 'user', getString(item, 'userEmail'))}</Text>
            <Text style={styles.auditMeta}>{formatDate(item.createdAt ?? item.timestamp)}</Text>
          </Card>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

function BreakdownBar({ record }: { record: PartnerRecord }) {
  const count = getNumber(record, 'count', getNumber(record, 'value', 0));
  const percent = Math.max(4, Math.min(100, getNumber(record, 'percent', count)));

  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownLabelRow}>
        <Text style={styles.breakdownLabel}>{getString(record, 'type', getString(record, 'label', 'User'))}</Text>
        <Text style={styles.breakdownCount}>{count}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.xl },
  listContent: { paddingBottom: spacing.xxxl },
  metricRow: { flexDirection: 'row', gap: spacing.sm },
  sectionTitle: { ...typography.headingSmall },
  breakdownCard: { gap: spacing.md },
  breakdownRow: { gap: spacing.xs },
  breakdownLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { ...typography.body, fontWeight: '600' },
  breakdownCount: { ...typography.body, color: colors.secondary, fontWeight: '700' },
  track: { backgroundColor: colors.neutralSoft, borderRadius: 9999, height: 10, overflow: 'hidden' },
  fill: { backgroundColor: colors.secondary, height: '100%' },
  auditCard: { gap: spacing.xs, marginBottom: spacing.sm, marginHorizontal: spacing.xl },
  auditTitle: { ...typography.headingSmall },
  auditMeta: { ...typography.caption },
  emptyCopy: { ...typography.body, color: colors.textSecondary }
});
