import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/src/constants';

import { Button } from './Button';

type IconName = keyof typeof Ionicons.glyphMap;

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'ellipse-outline',
  title,
  subtitle,
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconShell}>
        <Ionicons name={icon} size={28} color={colors.secondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} variant="secondary" onPress={onAction} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  title: {
    ...typography.headingSmall,
    textAlign: 'center'
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: 280,
    textAlign: 'center'
  },
  button: {
    marginTop: spacing.xs,
    minWidth: 180
  }
});

