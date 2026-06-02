import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { StatusBadge } from '@/src/components/partner/StatusBadge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { colors, spacing, typography } from '@/src/constants';
import { extractArray, extractRecord, getRecordId, getString, PartnerLoadingScreen, type PartnerRecord } from '@/src/features/partner/screens';
import { useAuth } from '@/src/hooks/useAuth';
import { api } from '@/src/lib/api';

type SettingsItem = PartnerRecord & { section: 'institution' | 'employer' };

export default function AdminSettingsScreen() {
  const { logout, isLoading } = useAuth();
  const query = useQuery({
    queryKey: ['/api/admin/profile', '/api/admin/institutions', '/api/admin/employers'],
    queryFn: async () => {
      const [profile, institutions, employers] = await Promise.all([
        api.get('/api/admin/profile').catch(() => ({ data: {} })),
        api.get('/api/admin/institutions'),
        api.get('/api/admin/employers')
      ]);

      return {
        profile: profile.data,
        institutions: institutions.data,
        employers: employers.data
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60
  });

  if (query.isLoading) {
    return <PartnerLoadingScreen portalName="Settings" subtitle="Loading admin settings." />;
  }

  if (query.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState title="Unable to load settings" onRetry={() => void query.refetch()} />
      </SafeAreaView>
    );
  }

  const profile = extractRecord(query.data?.profile);
  const profileRecord = extractRecord(profile.user ?? profile.profile ?? profile);
  const institutions = extractArray(query.data?.institutions, ['institutions']).map((item) => ({
    ...item,
    section: 'institution' as const
  }));
  const employers = extractArray(query.data?.employers, ['employers']).map((item) => ({
    ...item,
    section: 'employer' as const
  }));
  const rows: SettingsItem[] = [...institutions, ...employers];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<SettingsItem>
        data={rows}
        keyExtractor={(item) => `${item.section}-${getRecordId(item)}`}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.content}>
            <PartnerHeader portalName="Settings" subtitle="Admin profile and reference lists." />
            <Card style={styles.profileCard}>
              <Text style={styles.profileTitle}>Admin Profile</Text>
              <Text style={styles.meta}>{getString(profileRecord, 'firstName')} {getString(profileRecord, 'lastName')}</Text>
              <Text style={styles.meta}>{getString(profileRecord, 'email')}</Text>
              <Button title="Logout" variant="danger" loading={isLoading} onPress={logout} />
            </Card>
            <Text style={styles.sectionTitle}>Institutions and Employers</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="business-outline" title="No institutions or employers" />}
        renderItem={({ item }) => (
          <Card style={styles.rowCard}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{getString(item, 'name', getString(item, 'schoolName', getString(item, 'company', 'Record')))}</Text>
              <Text style={styles.meta}>{getString(item, 'email', getString(item, 'website'))}</Text>
            </View>
            <StatusBadge label={item.section} tone="info" />
          </Card>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.xl },
  listContent: { paddingBottom: spacing.xxxl },
  profileCard: { gap: spacing.sm },
  profileTitle: { ...typography.headingSmall },
  sectionTitle: { ...typography.headingSmall },
  rowCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm, marginHorizontal: spacing.xl },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { ...typography.headingSmall },
  meta: { ...typography.body, color: colors.textSecondary }
});
