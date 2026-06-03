import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
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
import { colors, radius, shadow, spacing, typography } from '@/src/constants';

const { height: screenHeight } = Dimensions.get('window');
const tagline = 'Your complete relocation platform for Latvia';

const serviceCards = [
  {
    icon: 'home-outline',
    title: 'Verified Housing',
    body: 'Browse vetted listings from trusted agents, send enquiries, and book your room before you land.'
  },
  {
    icon: 'briefcase-outline',
    title: 'Job Board',
    body: 'Find part-time and full-time jobs near your university, apply in seconds, track your applications.'
  },
  {
    icon: 'document-text-outline',
    title: 'Document Wallet',
    body: 'Securely store and share your passport, visa, and university documents - all in one place.'
  },
  {
    icon: 'restaurant-outline',
    title: 'Food Service',
    body: 'Order meals from local suppliers, delivered or ready for pickup, right from your phone.'
  },
  {
    icon: 'airplane-outline',
    title: 'Arrival Planning',
    body: 'Book your airport transfer, city transit, or intercity transport in one step before you arrive.'
  },
  {
    icon: 'people-outline',
    title: 'Community',
    body: 'Join student circles, find a study buddy from your country, attend events and make connections.'
  }
] as const;

const audiences = [
  {
    title: 'Relocating Students',
    body: 'Planning your move to Latvia',
    color: '#dcfce7'
  },
  {
    title: 'Already in Latvia',
    body: 'Students settling into daily life',
    color: '#bbf7d0'
  },
  {
    title: 'Local Residents',
    body: 'Non-students living in Latvia',
    color: '#86efac'
  }
] as const;

function AnimatedServiceCard({
  card,
  index
}: {
  card: (typeof serviceCards)[number];
  index: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(28);

  useEffect(() => {
    opacity.value = withDelay(index * 120, withTiming(1, { duration: 520 }));
    translateY.value = withDelay(
      index * 120,
      withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) })
    );
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Animated.View style={[styles.serviceCard, animatedStyle]}>
      <View style={styles.serviceAccent} />
      <View style={styles.serviceIcon}>
        <Ionicons name={card.icon} color={colors.secondary} size={22} />
      </View>
      <View style={styles.serviceCopy}>
        <Text style={styles.cardTitle}>{card.title}</Text>
        <Text style={styles.cardBody}>{card.body}</Text>
      </View>
    </Animated.View>
  );
}

export default function LandingScreen() {
  const [typedTagline, setTypedTagline] = useState('');
  const [showSubtitle, setShowSubtitle] = useState(false);
  const bounce = useRef(new RNAnimated.Value(0)).current;
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(22);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    logoTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });
    ctaOpacity.value = withDelay(1200, withTiming(1, { duration: 420 }));

    const startTimer = setTimeout(() => {
      let index = 0;
      const timer = setInterval(() => {
        index += 1;
        setTypedTagline(tagline.slice(0, index));

        if (index >= tagline.length) {
          clearInterval(timer);
          setShowSubtitle(true);
        }
      }, 40);

      return () => clearInterval(timer);
    }, 820);

    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(bounce, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true
        }),
        RNAnimated.timing(bounce, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true
        })
      ])
    ).start();

    return () => clearTimeout(startTimer);
  }, [bounce, ctaOpacity, logoOpacity, logoTranslateY]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }]
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value
  }));

  const bounceStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: bounce.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 8]
          })
        }
      ]
    }),
    [bounce]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Animated.View style={[styles.logoBlock, logoStyle]}>
            <View style={styles.logoMark}>
              <Text style={styles.logoLetter}>E</Text>
            </View>
            <Text style={styles.brand}>EBENESAID</Text>
          </Animated.View>

          <View style={styles.heroCopy}>
            <Text style={styles.tagline}>{typedTagline}</Text>
            {showSubtitle ? (
              <RNAnimated.Text style={styles.subtitle}>
                Housing | Jobs | Food | Community | Documents
              </RNAnimated.Text>
            ) : null}
          </View>

          <Animated.View style={[styles.heroActions, ctaStyle]}>
            <Button title="Get Started" onPress={() => router.push('/(auth)/register')} />
            <Button
              title="Sign In"
              variant="secondary"
              onPress={() => router.push('/(auth)/login')}
            />
          </Animated.View>

          <RNAnimated.View style={[styles.scrollHint, bounceStyle]}>
            <Ionicons name="chevron-down" color={colors.secondary} size={26} />
          </RNAnimated.View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>What we do</Text>
          <Text style={styles.sectionTitle}>Everything you need after admission.</Text>
          <View style={styles.cardStack}>
            {serviceCards.map((card, index) => (
              <AnimatedServiceCard key={card.title} card={card} index={index} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Who it is for</Text>
          <View style={styles.audienceGrid}>
            {audiences.map((audience) => (
              <View key={audience.title} style={[styles.audienceTile, { backgroundColor: audience.color }]}>
                <Text style={styles.audienceTitle}>{audience.title}</Text>
                <Text style={styles.audienceBody}>{audience.body}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to start?</Text>
          <Button title="Create your free account" onPress={() => router.push('/(auth)/register')} />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(auth)/login')}
            style={styles.signInLink}
          >
            <Text style={styles.signInText}>Already have an account? Sign in</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2026 EBENESAID. Built for international students in Latvia.
          </Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
            <Text style={styles.footerDot}>|</Text>
            <Text style={styles.footerLink}>Terms</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.primary,
    flex: 1
  },
  scroll: {
    backgroundColor: colors.primary
  },
  content: {
    paddingBottom: spacing.xxxl
  },
  hero: {
    minHeight: screenHeight - 24,
    padding: spacing.xl,
    justifyContent: 'space-between'
  },
  logoBlock: {
    alignItems: 'center',
    paddingTop: spacing.xxxl
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: radius.xl,
    height: 96,
    justifyContent: 'center',
    width: 96,
    ...shadow
  },
  logoLetter: {
    color: colors.primary,
    fontSize: 54,
    fontWeight: '800'
  },
  brand: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    marginTop: spacing.lg
  },
  heroCopy: {
    alignItems: 'center',
    gap: spacing.md
  },
  tagline: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    minHeight: 72,
    textAlign: 'center'
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center'
  },
  heroActions: {
    gap: spacing.sm
  },
  scrollHint: {
    alignItems: 'center',
    bottom: spacing.sm,
    left: 0,
    position: 'absolute',
    right: 0
  },
  section: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl
  },
  sectionEyebrow: {
    ...typography.label,
    color: '#15803d',
    fontSize: 13,
    letterSpacing: 0,
    marginBottom: spacing.xs,
    textTransform: 'uppercase'
  },
  sectionTitle: {
    ...typography.headingLarge,
    fontSize: 26,
    marginBottom: spacing.xl
  },
  cardStack: {
    gap: spacing.md
  },
  serviceCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.primary,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.md,
    ...shadow
  },
  serviceAccent: {
    backgroundColor: colors.secondary,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4
  },
  serviceIcon: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.full,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  serviceCopy: {
    flex: 1,
    gap: spacing.xs
  },
  cardTitle: {
    ...typography.headingSmall
  },
  cardBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 21
  },
  audienceGrid: {
    gap: spacing.md
  },
  audienceTile: {
    borderRadius: radius.lg,
    padding: spacing.lg
  },
  audienceTitle: {
    ...typography.headingSmall,
    color: '#14532d',
    marginBottom: spacing.xs
  },
  audienceBody: {
    ...typography.body,
    color: '#166534'
  },
  ctaSection: {
    gap: spacing.md,
    padding: spacing.xl
  },
  ctaTitle: {
    ...typography.headingLarge,
    textAlign: 'center'
  },
  signInLink: {
    alignItems: 'center',
    padding: spacing.sm
  },
  signInText: {
    color: '#15803d',
    fontWeight: '600'
  },
  footer: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    paddingTop: spacing.lg
  },
  footerText: {
    ...typography.caption,
    textAlign: 'center'
  },
  footerLinks: {
    flexDirection: 'row',
    gap: spacing.xs
  },
  footerLink: {
    ...typography.caption,
    color: '#15803d',
    fontWeight: '600'
  },
  footerDot: {
    ...typography.caption
  }
});
