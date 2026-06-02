import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { colors, spacing, typography } from '@/src/constants';

type Trend = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: Trend;
  trendValue?: string;
}

const trendColor: Record<Trend, string> = {
  up: colors.success,
  down: colors.error,
  neutral: colors.textSecondary
};

const trendIcon: Record<Trend, keyof typeof Ionicons.glyphMap> = {
  up: 'trending-up-outline',
  down: 'trending-down-outline',
  neutral: 'remove-outline'
};

export function MetricCard({ label, value, trend, trendValue }: MetricCardProps) {
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      {trend ? (
        <View style={[styles.trend, { backgroundColor: `${trendColor[trend]}18` }]}>
          <Ionicons name={trendIcon[trend]} size={14} color={trendColor[trend]} />
          <Text style={[styles.trendText, { color: trendColor[trend] }]}>
            {trendValue ?? trend}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.xs,
    minHeight: 116
  },
  label: {
    ...typography.label,
    color: colors.textSecondary
  },
  value: {
    ...typography.headingLarge
  },
  trend: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 9999,
    flexDirection: 'row',
    gap: 4,
    marginTop: 'auto',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4
  },
  trendText: {
    ...typography.caption,
    fontWeight: '700'
  }
});

