import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/src/constants';

export type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'default';
export type BadgeSize = 'small' | 'medium';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: BadgeSize;
  style?: StyleProp<ViewStyle>;
}

const toneStyles: Record<BadgeTone, { backgroundColor: string; color: string }> = {
  success: {
    backgroundColor: colors.successSoft,
    color: colors.success
  },
  warning: {
    backgroundColor: colors.warningSoft,
    color: '#b45309'
  },
  error: {
    backgroundColor: colors.errorSoft,
    color: '#dc2626'
  },
  info: {
    backgroundColor: colors.infoSoft,
    color: '#1d4ed8'
  },
  default: {
    backgroundColor: colors.neutralSoft,
    color: colors.label
  }
};

export function Badge({ label, tone = 'default', size = 'medium', style }: BadgeProps) {
  const toneStyle = toneStyles[tone];

  return (
    <Text
      style={[
        styles.badge,
        {
          backgroundColor: toneStyle.backgroundColor,
          color: toneStyle.color,
          fontSize: size === 'small' ? 10 : 12
        },
        style
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5
  }
});

