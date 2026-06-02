import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { StatusBadge } from '@/src/components/partner/StatusBadge';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { colors, radius, spacing, typography } from '@/src/constants';
import { api } from '@/src/lib/api';
import { extractArray, getString, PartnerLoadingScreen, statusTone, type PartnerRecord } from '@/src/features/partner/screens';

export default function StaffUsersScreen() {
  const [search, setSearch] = useState('');
  const query = useQuery<unknown>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => (await api.get('/api/admin/users')).data,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60
  });

  const users = useMemo(() => {
    const all = extractArray(query.data, ['users']);
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter((user: PartnerRecord) =>
      `${getString(user, 'firstName')} ${getString(user, 'lastName')} ${getString(user, 'email')} ${getString(user, 'userType')} ${getString(user, 'status')}`
        .toLowerCase()
        .includes(term)
    );
  }, [query.data, search]);

  if (query.isLoading) {
    return <PartnerLoadingScreen portalName="Users" subtitle="Loading user directory." />;
  }

  if (query.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState title="Unable to load users" onRetry={() => void query.refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<PartnerRecord>
        data={users}
        keyExtractor={(item) => `${item.id ?? item.email}`}
        estimatedItemSize={96}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.secondary} colors={[colors.secondary]} />
        }
        ListHeaderComponent={
          <View style={styles.content}>
            <PartnerHeader portalName="Users" subtitle="Read-only user details for staff." />
            <TextInput value={search} onChangeText={setSearch} placeholder="Search by name, type, status, or email" placeholderTextColor={colors.inactive} style={styles.input} />
          </View>
        }
        ListEmptyComponent={<EmptyState icon="people-outline" title="No users found" />}
        renderItem={({ item }) => (
          <Card style={styles.userCard}>
            <View style={styles.userText}>
              <Text style={styles.userName}>{getString(item, 'firstName')} {getString(item, 'lastName')}</Text>
              <Text style={styles.userMeta}>{getString(item, 'email')}</Text>
              <Text style={styles.userMeta}>{getString(item, 'userType')}</Text>
            </View>
            <StatusBadge label={getString(item, 'status', getString(item, 'isActive', 'active'))} tone={statusTone(item.status ?? item.isActive)} />
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
  input: { ...typography.body, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1.5, height: 52, paddingHorizontal: spacing.md },
  userCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm, marginHorizontal: spacing.xl },
  userText: { flex: 1, gap: 3 },
  userName: { ...typography.headingSmall },
  userMeta: { ...typography.caption }
});
