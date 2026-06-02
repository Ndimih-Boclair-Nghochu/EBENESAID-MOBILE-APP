import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/src/constants';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  actionIcon,
  onAction
}: ScreenHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        ) : null}
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {actionIcon && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Screen action"
            hitSlop={10}
            onPress={onAction}
            style={styles.iconButton}
          >
            <Ionicons name={actionIcon} size={22} color={colors.text} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: spacing.lg
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  titleGroup: {
    flex: 1,
    gap: 4
  },
  title: {
    ...typography.headingLarge
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary
  },
  iconButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40
  }
});

