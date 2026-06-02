import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadow, spacing } from '@/src/constants';

interface CardProps extends PropsWithChildren {
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, elevated = false, style }: CardProps) {
  return <View style={[styles.card, elevated && shadow, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md
  }
});

