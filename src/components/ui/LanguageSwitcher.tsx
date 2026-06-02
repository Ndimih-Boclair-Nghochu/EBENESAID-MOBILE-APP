import {
  Ionicons } from '@expo/vector-icons';
import { Pressable,
  StyleSheet
} from 'react-native';

import { colors, radius, spacing, typography } from '@/src/constants';
import { useLocale, type Locale } from '@/src/lib/i18n';

import { Text } from '@/src/components/ui/TranslatedText';

const localeLabels: Record<Locale, string> = {
  en: 'EN',
  lv: 'LV'
};

export function LanguageSwitcher() {
  const { locale, toggleLocale } = useLocale();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Switch language"
      onPress={toggleLocale}
      style={styles.button}
      hitSlop={8}
    >
      <Ionicons name="language-outline" color={colors.secondary} size={18} />
      <Text style={styles.label}>{localeLabels[locale]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md
  },
  label: {
    ...typography.label,
    color: colors.secondary
  }
});
