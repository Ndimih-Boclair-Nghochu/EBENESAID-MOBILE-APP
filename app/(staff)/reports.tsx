import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { colors, spacing, typography } from '@/src/constants';

import { Text } from '@/src/components/ui/TranslatedText';

export default function StaffReportsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <PartnerHeader portalName="Reports" subtitle="Admin report access." />
        <Text style={styles.caption}>Reports coming soon</Text>
        <EmptyState icon="document-text-outline" title="Reports coming soon" subtitle="Staff reporting access will be added in a later release." />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.xl },
  caption: { ...typography.body, color: colors.textSecondary }
});

