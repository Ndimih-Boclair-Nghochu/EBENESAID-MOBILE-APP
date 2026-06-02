import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/src/constants';

interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({ label: _label }: LoadingSpinnerProps) {
  return (
    <View style={styles.wrapper}>
      <ActivityIndicator color={colors.secondary} size="small" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md
  }
});

