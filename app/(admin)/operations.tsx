import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { Card } from '@/src/components/ui/Card';
import { colors, spacing, typography } from '@/src/constants';

const sections = [
  { title: 'Housing Admin', route: '/(admin)/housing-admin', icon: 'business-outline' },
  { title: 'Food Admin', route: '/(admin)/food-admin', icon: 'restaurant-outline' },
  { title: 'Transport Admin', route: '/(admin)/transport-admin', icon: 'car-outline' },
  { title: 'Verification Queue', route: '/(admin)/verification', icon: 'shield-checkmark-outline' },
  { title: 'Support Queue', route: '/(admin)/support', icon: 'chatbubbles-outline' },
  { title: 'Finance', route: '/(admin)/finance', icon: 'wallet-outline' },
  { title: 'Schools', route: '/(admin)/schools', icon: 'school-outline' },
  { title: 'Audit Logs', route: '/(admin)/audit-logs', icon: 'receipt-outline' }
] as const;

export default function AdminOperationsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <PartnerHeader portalName="Operations" subtitle="Admin queues and operational control." />
        {sections.map((section) => (
          <Pressable
            accessibilityRole="button"
            key={section.route}
            onPress={() => router.push(section.route)}
          >
            <Card style={styles.sectionCard}>
              <View style={styles.iconShell}>
                <Ionicons name={section.icon} size={22} color={colors.secondary} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Card>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.md, padding: spacing.xl },
  sectionCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  iconShell: { alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  sectionTitle: { ...typography.headingSmall, flex: 1 }
});
