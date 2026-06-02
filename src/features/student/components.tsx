import {
  Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle
} from 'react-native';
import { TextInput } from '@/src/components/ui/TranslatedTextInput';

import { Card } from '@/src/components/ui/Card';
import { SkeletonLoader } from '@/src/components/ui/SkeletonLoader';
import { colors, radius, spacing, typography } from '@/src/constants';

import { clampPercent } from './utils';

import { Text } from '@/src/components/ui/TranslatedText';

type IconName = keyof typeof Ionicons.glyphMap;

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={10}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

interface ProgressBarProps {
  percent: number;
  label?: string;
}

export function ProgressBar({ percent, label }: ProgressBarProps) {
  const clampedPercent = clampPercent(percent);

  return (
    <View style={styles.progressWrapper}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>{label ?? 'Progress'}</Text>
        <Text style={styles.progressValue}>{clampedPercent}% complete</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${clampedPercent}%` }]} />
      </View>
    </View>
  );
}

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}

export function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  return (
    <View style={styles.searchShell}>
      <Ionicons name="search-outline" color={colors.textSecondary} size={20} />
      <TextInput
        autoCapitalize="none"
        placeholder={placeholder}
        placeholderTextColor={colors.inactive}
        value={value}
        onChangeText={onChangeText}
        style={styles.searchInput}
      />
    </View>
  );
}

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected = false, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

interface SegmentedTabsProps<T extends string> {
  tabs: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedTabs<T extends string>({ tabs, value, onChange }: SegmentedTabsProps<T>) {
  return (
    <View style={styles.segmentShell}>
      {tabs.map((tab) => {
        const selected = tab.value === value;

        return (
          <Pressable
            accessibilityRole="button"
            key={tab.value}
            onPress={() => onChange(tab.value)}
            style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: IconName;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card style={styles.statCard}>
      <Ionicons name={icon} color={colors.secondary} size={20} />
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </Card>
  );
}

interface IconLabelProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  color?: string;
  right?: ReactNode;
}

export function IconLabel({ icon, title, subtitle, color = colors.secondary, right }: IconLabelProps) {
  return (
    <View style={styles.iconLabel}>
      <View style={[styles.iconShell, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.iconText}>
        <Text style={styles.iconTitle}>{title}</Text>
        {subtitle ? <Text style={styles.iconSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

interface ScreenSkeletonProps {
  rows?: number;
}

export function ScreenSkeleton({ rows = 4 }: ScreenSkeletonProps) {
  return (
    <View style={styles.skeletonWrapper}>
      <SkeletonLoader width="60%" height={28} />
      <SkeletonLoader width="86%" height={16} />
      {Array.from({ length: rows }).map((_, index) => (
        <Card key={index} style={styles.skeletonCard}>
          <SkeletonLoader width="50%" height={18} />
          <SkeletonLoader width="100%" height={14} />
          <SkeletonLoader width="78%" height={14} />
        </Card>
      ))}
    </View>
  );
}

interface PagePaddingProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function PagePadding({ children, style }: PagePaddingProps) {
  return <View style={[styles.pagePadding, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  pagePadding: {
    gap: spacing.lg,
    padding: spacing.xl
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    ...typography.headingSmall
  },
  sectionAction: {
    ...typography.label,
    color: colors.secondary
  },
  progressWrapper: {
    gap: spacing.xs
  },
  progressLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  progressLabel: {
    ...typography.label
  },
  progressValue: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '600'
  },
  progressTrack: {
    backgroundColor: colors.neutralSoft,
    borderRadius: radius.full,
    height: 10,
    overflow: 'hidden'
  },
  progressFill: {
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    height: '100%'
  },
  searchShell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 52,
    paddingHorizontal: spacing.md
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    padding: 0
  },
  chip: {
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  chipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary
  },
  chipText: {
    ...typography.label,
    color: colors.textSecondary
  },
  chipTextSelected: {
    color: colors.primary
  },
  segmentShell: {
    backgroundColor: colors.neutralSoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs
  },
  segmentButtonSelected: {
    backgroundColor: colors.secondary
  },
  segmentText: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  segmentTextSelected: {
    color: colors.primary
  },
  statCard: {
    flex: 1,
    gap: spacing.xs,
    minHeight: 116
  },
  statValue: {
    ...typography.headingSmall
  },
  statLabel: {
    ...typography.caption
  },
  iconLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  iconShell: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  iconText: {
    flex: 1,
    gap: 2
  },
  iconTitle: {
    ...typography.body,
    fontWeight: '600'
  },
  iconSubtitle: {
    ...typography.caption
  },
  skeletonWrapper: {
    gap: spacing.md,
    padding: spacing.xl
  },
  skeletonCard: {
    gap: spacing.sm
  }
});

