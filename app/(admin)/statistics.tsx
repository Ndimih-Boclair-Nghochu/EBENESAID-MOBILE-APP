import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';

import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { Text } from '@/src/components/ui/TranslatedText';
import { colors, spacing, typography } from '@/src/constants';
import { extractRecord, PartnerLoadingScreen } from '@/src/features/partner/screens';
import { api } from '@/src/lib/api';

type BarDatum = { label: string; value: number };

export default function AdminStatisticsScreen() {
  const query = useQuery({
    queryKey: ['/api/admin/summary', 'statistics'],
    queryFn: async () => (await api.get('/api/admin/summary')).data,
    staleTime: 1000 * 60 * 3
  });

  if (query.isLoading) {
    return <PartnerLoadingScreen portalName="Statistics" subtitle="Loading platform statistics." />;
  }

  if (query.isError) {
    return <ErrorState title="Unable to load statistics" onRetry={() => void query.refetch()} />;
  }

  const data = extractRecord(query.data);
  const usersByType = extractBars(data.usersByType ?? data.userTypes);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<BarDatum>
        data={usersByType}
        keyExtractor={(item) => item.label}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.secondary} colors={[colors.secondary]} />}
        ListHeaderComponent={<View style={styles.content}><PartnerHeader portalName="Statistics" subtitle="Growth and account mix." /></View>}
        ListEmptyComponent={<EmptyState icon="bar-chart-outline" title="No statistics available" />}
        renderItem={() => null}
        ListFooterComponent={usersByType.length ? <BarChart title="Users by Type" data={usersByType} /> : null}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

function extractBars(value: unknown): BarDatum[] {
  if (Array.isArray(value)) {
    return value.map((item) => {
      const record = extractRecord(item);
      return { label: String(record.type ?? record.label ?? 'Other'), value: Number(record.count ?? record.value ?? 0) };
    });
  }

  const record = extractRecord(value);
  return Object.entries(record).map(([label, count]) => ({ label, value: Number(count) || 0 }));
}

function BarChart({ title, data }: { title: string; data: BarDatum[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <Card style={styles.chartCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Svg width="100%" height={220}>
        {data.map((item, index) => {
          const barWidth = 34;
          const gap = 18;
          const height = Math.max((item.value / max) * 140, 4);
          const x = 18 + index * (barWidth + gap);
          const y = 168 - height;
          return (
            <G key={item.label}>
              <Rect x={x} y={y} width={barWidth} height={height} rx={8} fill={colors.secondary} />
              <SvgText x={x + barWidth / 2} y={190} textAnchor="middle" fontSize="10" fill={colors.textSecondary}>{item.label.slice(0, 8)}</SvgText>
              <SvgText x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill={colors.text}>{item.value}</SvgText>
            </G>
          );
        })}
      </Svg>
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { padding: spacing.xl },
  listContent: { paddingBottom: spacing.xxxl },
  chartCard: { gap: spacing.md, marginHorizontal: spacing.xl },
  sectionTitle: { ...typography.headingSmall }
});
