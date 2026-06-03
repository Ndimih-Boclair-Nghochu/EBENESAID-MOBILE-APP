import {
  FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { RefreshControl,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MetricCard } from '@/src/components/partner/MetricCard';
import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { colors, spacing, typography } from '@/src/constants';
import { api } from '@/src/lib/api';
import { extractArray, extractRecord, formatValue, getNumber, getString, PartnerLoadingScreen, type PartnerRecord } from '@/src/features/partner/screens';

import { Text } from '@/src/components/ui/TranslatedText';

export default function InvestorSummaryScreen() {
  const query = useQuery<unknown>({
    queryKey: ['/api/investor/summary'],
    queryFn: async () => (await api.get('/api/investor/summary')).data,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60
  });

  if (query.isLoading) {
    return <PartnerLoadingScreen portalName="Investor Dashboard" subtitle="Loading platform performance." />;
  }

  if (query.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState title="Unable to load investor summary" onRetry={() => void query.refetch()} />
      </SafeAreaView>
    );
  }

  const data = extractRecord(query.data);
  const growth = extractArray(query.data, ['growthMetrics', 'growth', 'metrics']);
  const totalUsers =
    getNumber(data, 'totalUsers') ||
    getNumber(data, 'students') + getNumber(data, 'partners') + getNumber(data, 'investors');
  const revenue =
    getNumber(data, 'revenue') ||
    getNumber(data, 'studentRevenueEur') + getNumber(data, 'partnerNetEur');
  const serviceRecords =
    getNumber(data, 'housingListings') ||
    getNumber(data, 'listings') + getNumber(data, 'jobs') + getNumber(data, 'foodItems') + getNumber(data, 'transportBookings');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<PartnerRecord>
        data={growth}
        keyExtractor={(item, index) => `${getString(item, 'label', 'growth')}-${index}`}
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
            <PartnerHeader portalName="Investor Dashboard" subtitle="Read-only platform performance." />
            <Button title="Profile" variant="secondary" onPress={() => router.push('/(investor)/profile')} />
            <View style={styles.metricRow}>
              <MetricCard label="Total Users" value={formatValue(totalUsers, 'number')} />
              <MetricCard label="Revenue" value={formatValue(revenue, 'currency')} />
            </View>
            <View style={styles.metricRow}>
              <MetricCard label="Partners" value={formatValue(data.partners, 'number')} />
              <MetricCard label="Service Records" value={formatValue(serviceRecords, 'number')} />
            </View>
            <Text style={styles.sectionTitle}>Growth Metrics</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="bar-chart-outline" title="No growth metrics yet" />}
        renderItem={({ item }) => <GrowthBar record={item} />}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

function GrowthBar({ record }: { record: PartnerRecord }) {
  const value = Math.max(0, Math.min(100, getNumber(record, 'value', getNumber(record, 'percent', 0))));
  return (
    <Card style={styles.growthCard}>
      <View style={styles.growthHeader}>
        <Text style={styles.growthLabel}>{getString(record, 'label', getString(record, 'period', 'Growth'))}</Text>
        <Text style={styles.growthValue}>{value}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value}%` }]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.xl },
  listContent: { paddingBottom: spacing.xxxl },
  metricRow: { flexDirection: 'row', gap: spacing.sm },
  sectionTitle: { ...typography.headingSmall },
  growthCard: { gap: spacing.sm, marginBottom: spacing.sm, marginHorizontal: spacing.xl },
  growthHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  growthLabel: { ...typography.body, fontWeight: '600' },
  growthValue: { ...typography.body, color: colors.secondary, fontWeight: '700' },
  track: { backgroundColor: colors.neutralSoft, borderRadius: 9999, height: 10, overflow: 'hidden' },
  fill: { backgroundColor: colors.secondary, height: '100%' }
});
