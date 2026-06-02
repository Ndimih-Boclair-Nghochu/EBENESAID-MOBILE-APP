import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '@/src/constants';
import { storage } from '@/src/lib/storage';

type Locale = 'en' | 'lv';

const LOCALE_STORAGE_KEY = 'eb_locale';
const localeLabels: Record<Locale, string> = {
  en: 'EN',
  lv: 'LV'
};

function isLocale(value: string | null): value is Locale {
  return value === 'en' || value === 'lv';
}

export function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    let isMounted = true;

    void storage.getString(LOCALE_STORAGE_KEY).then((savedLocale) => {
      if (isMounted && isLocale(savedLocale)) {
        setLocale(savedLocale);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleLocale = () => {
    const nextLocale = locale === 'en' ? 'lv' : 'en';
    setLocale(nextLocale);
    void storage.set(LOCALE_STORAGE_KEY, nextLocale);
  };

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
