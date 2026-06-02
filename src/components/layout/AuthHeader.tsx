import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/src/constants';

import { LanguageSwitcher } from '../ui/LanguageSwitcher';

const brandLogo = require('../../../assets/ebenesaid-logo.jpeg');

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Image source={brandLogo} style={styles.logo} resizeMode="cover" />
        <LanguageSwitcher />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.lg,
    paddingTop: spacing.xl
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  logo: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 72,
    width: 72
  },
  copy: {
    gap: spacing.xs
  },
  title: {
    ...typography.headingLarge
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary
  }
});
