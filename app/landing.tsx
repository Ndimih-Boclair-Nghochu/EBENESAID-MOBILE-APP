import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/TranslatedText';
import { colors, radius, spacing } from '@/src/constants';

export default function LandingScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.brandBlock}>
          <Image
            source={require('../assets/ebenesaid-logo.jpeg')}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="EBENESAID logo"
          />
          <Text style={styles.name}>EBENESAID</Text>
          <Text style={styles.copy}>make your stay in Latvia easy with EBENESAID</Text>
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
  brandBlock: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  logo: {
    borderRadius: radius.xl,
    height: 132,
    marginBottom: spacing.xl,
    width: 132
  },
  name: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: spacing.md,
    textAlign: 'center'
  },
  copy: {
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 300,
    textAlign: 'center'
  },
  actions: {
    gap: spacing.sm
  }
});
