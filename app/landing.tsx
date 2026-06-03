import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/TranslatedText';
import { colors, radius, spacing } from '@/src/constants';
import { useLocale } from '@/src/lib/i18n';

const services = ['Housing', 'Jobs', 'Food', 'Transport', 'Documents', 'Community', 'Programs', 'Support'];

export default function LandingScreen() {
  const { locale, toggleLocale } = useLocale();
  const landingCopy =
    locale === 'en'
      ? 'make your stay in Latvia easy with EBENESAID'
      : 'Padariet savu uzturesanos Latvija vieglu ar EBENESAID';
  const logoScale = useSharedValue(0.92);
  const logoOpacity = useSharedValue(0);
  const serviceOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
        withTiming(0.97, { duration: 900, easing: Easing.inOut(Easing.cubic) })
      ),
      -1,
      true
    );
    logoOpacity.value = withTiming(1, { duration: 520 });
    serviceOpacity.value = withDelay(280, withTiming(1, { duration: 500 }));
  }, [logoOpacity, logoScale, serviceOpacity]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }]
  }));

  const servicesStyle = useAnimatedStyle(() => ({
    opacity: serviceOpacity.value,
    transform: [{ translateY: (1 - serviceOpacity.value) * 12 }]
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change language"
          onPress={toggleLocale}
          style={styles.languageButton}
        >
          <Ionicons name="language-outline" size={18} color={colors.secondary} />
          <Text style={styles.languageText}>{locale === 'en' ? 'LV' : 'EN'}</Text>
        </Pressable>

        <View style={styles.center}>
          <Animated.View style={[styles.logoShell, logoStyle]}>
            <View style={styles.logoGlow} />
            <Image
              source={require('../assets/ebenesaid-logo.jpeg')}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="EBENESAID logo"
            />
          </Animated.View>
          <Text style={styles.name}>EBENESAID</Text>
          <Text style={styles.copy}>{landingCopy}</Text>

          <Animated.View style={[styles.services, servicesStyle]}>
            {services.map((service) => (
              <View key={service} style={styles.servicePill}>
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        <View style={styles.actions}>
          <Button title="Get Started" onPress={() => router.push('/(auth)/register')} />
          <Button title="Sign In" variant="secondary" onPress={() => router.push('/(auth)/login')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.primary,
    flex: 1
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.xl,
    paddingBottom: spacing.xxxl
  },
  languageButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  languageText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '800'
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  logoShell: {
    alignItems: 'center',
    height: 154,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 154
  },
  logoGlow: {
    backgroundColor: colors.successSoft,
    borderRadius: 77,
    height: 154,
    opacity: 0.9,
    position: 'absolute',
    width: 154
  },
  logo: {
    borderRadius: radius.xl,
    height: 118,
    width: 118
  },
  name: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: spacing.sm,
    textAlign: 'center'
  },
  copy: {
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 300,
    textAlign: 'center'
  },
  services: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.xl,
    maxWidth: 330
  },
  servicePill: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  },
  serviceText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700'
  },
  actions: {
    gap: spacing.sm
  }
});
