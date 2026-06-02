import { FlashList } from '@shopify/flash-list';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { StatusBadge } from '@/src/components/partner/StatusBadge';
import { Avatar } from '@/src/components/ui/Avatar';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { toast } from '@/src/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/src/constants';
import {
  extractArray,
  getBoolean,
  getRecordId,
  getString,
  PartnerLoadingScreen,
  statusTone,
  type PartnerRecord
} from '@/src/features/partner/screens';
import { api } from '@/src/lib/api';

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Students', value: 'student' },
  { label: 'Residents', value: 'resident' },
  { label: 'Agents', value: 'agent' },
  { label: 'Suppliers', value: 'supplier' },
  { label: 'Partners', value: 'partner' },
  { label: 'Admin', value: 'admin' }
];

export default function AdminUsersScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const query = useQuery<unknown>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => (await api.get('/api/admin/users')).data,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData
  });

  const toggleMutation = useMutation({
    mutationFn: (user: PartnerRecord) =>
      api.patch(`/api/admin/users/${getRecordId(user)}`, {
        isActive: !getBoolean(user, 'isActive')
      }),
    onSuccess: () => {
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to update user status.');
    }
  });

  const users = useMemo(() => {
    const allUsers = extractArray(query.data, ['users']);
    const term = search.trim().toLowerCase();

    return allUsers.filter((user) => {
      const haystack = `${getString(user, 'firstName')} ${getString(user, 'lastName')} ${getString(user, 'email')}`.toLowerCase();
      const userType = getString(user, 'userType').toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const matchesFilter =
        filter === 'all' ||
        userType === filter ||
        (filter === 'partner' && ['job_partner', 'transport', 'university', 'investor'].includes(userType));

      return matchesSearch && matchesFilter;
    });
  }, [filter, query.data, search]);

  if (query.isLoading) {
    return <PartnerLoadingScreen portalName="Users" subtitle="Loading account directory." />;
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
        keyExtractor={(item) => `${getRecordId(item)}`}
        estimatedItemSize={104}
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
            <PartnerHeader portalName="Users" subtitle="Search, filter, and manage all accounts." />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or email"
              placeholderTextColor={colors.inactive}
              style={styles.input}
            />
            <View style={styles.chips}>
              {filters.map((item) => (
                <Pressable
                  accessibilityRole="button"
                  key={item.value}
                  onPress={() => setFilter(item.value)}
                  style={[styles.chip, filter === item.value && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, filter === item.value && styles.chipTextSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="people-outline" title="No users found" />}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/(admin)/user-detail',
                params: { userId: getRecordId(item) }
              })
            }
            style={styles.rowPressable}
          >
            <Card style={styles.userCard}>
              <Avatar
                firstName={getString(item, 'firstName')}
                lastName={getString(item, 'lastName')}
                uri={getString(item, 'avatar') || null}
                size={44}
              />
              <View style={styles.userText}>
                <Text style={styles.userName}>
                  {getString(item, 'firstName')} {getString(item, 'lastName')}
                </Text>
                <Text style={styles.userEmail}>{getString(item, 'email')}</Text>
                <StatusBadge label={getString(item, 'userType', 'user')} tone="info" size="small" />
              </View>
              <Switch
                value={getBoolean(item, 'isActive')}
                onValueChange={() => toggleMutation.mutate(item)}
                thumbColor={colors.primary}
                trackColor={{ false: colors.border, true: colors.secondary }}
              />
            </Card>
          </Pressable>
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderColor: colors.border, borderRadius: radius.full, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chipSelected: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  chipText: { ...typography.label, color: colors.textSecondary },
  chipTextSelected: { color: colors.primary },
  rowPressable: { marginBottom: spacing.sm, marginHorizontal: spacing.xl },
  userCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  userText: { flex: 1, gap: 4 },
  userName: { ...typography.headingSmall },
  userEmail: { ...typography.caption }
});
