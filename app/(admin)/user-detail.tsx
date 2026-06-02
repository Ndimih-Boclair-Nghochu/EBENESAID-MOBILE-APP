import {
  Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData,
  useMutation,
  useQuery } from '@tanstack/react-query';
import { router,
  useLocalSearchParams } from 'expo-router';
import { Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { StatusBadge } from '@/src/components/partner/StatusBadge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { toast } from '@/src/components/ui/Toast';
import { colors, spacing, typography } from '@/src/constants';
import {
  extractRecord,
  formatDate,
  getBoolean,
  getString,
  PartnerLoadingScreen,
  statusTone,
  type PartnerRecord
} from '@/src/features/partner/screens';
import { api } from '@/src/lib/api';

import { Text } from '@/src/components/ui/TranslatedText';

const userTypes = ['student', 'resident', 'agent', 'supplier', 'job_partner', 'transport', 'university', 'investor', 'staff', 'admin'];

export default function AdminUserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string | string[] }>();
  const id = Array.isArray(userId) ? userId[0] : userId;

  const query = useQuery<unknown>({
    queryKey: ['/api/admin/users', id],
    queryFn: async () => (await api.get(`/api/admin/users/${id}`)).data,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
    placeholderData: keepPreviousData,
    enabled: Boolean(id)
  });

  const patchMutation = useMutation({
    mutationFn: (body: PartnerRecord) => api.patch(`/api/admin/users/${id}`, body),
    onSuccess: () => {
      toast.success('User updated.');
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to update user.');
    }
  });

  if (query.isLoading) {
    return <PartnerLoadingScreen portalName="User Detail" subtitle="Loading account record." />;
  }

  if (!id || query.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState title="Unable to load user" onRetry={() => void query.refetch()} />
      </SafeAreaView>
    );
  }

  const data = extractRecord(query.data);
  const user = extractRecord(data.user ?? data);
  const rows = Object.entries(user).map(([key, value]) => ({ key, value: String(value ?? '') }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<{ key: string; value: string }>
        data={rows}
        keyExtractor={(item) => item.key}
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
            <View style={styles.backRow}>
              <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </Pressable>
              <PartnerHeader portalName="User Detail" subtitle={getString(user, 'email', 'Account record')} />
            </View>
            <Card style={styles.actionsCard}>
              <View style={styles.actionRow}>
                <Text style={styles.actionLabel}>Active account</Text>
                <Switch
                  value={getBoolean(user, 'isActive')}
                  onValueChange={() => patchMutation.mutate({ isActive: !getBoolean(user, 'isActive') })}
                  thumbColor={colors.primary}
                  trackColor={{ false: colors.border, true: colors.secondary }}
                />
              </View>
              <View style={styles.typeWrap}>
                {userTypes.map((type) => (
                  <Button
                    key={type}
                    title={type}
                    variant={getString(user, 'userType') === type ? 'primary' : 'secondary'}
                    onPress={() => patchMutation.mutate({ userType: type })}
                    style={styles.typeButton}
                  />
                ))}
              </View>
              <Text style={styles.meta}>Created: {formatDate(user.createdAt)}</Text>
              <Text style={styles.meta}>Last login: {formatDate(user.lastLoginAt)}</Text>
              <StatusBadge label={getString(user, 'isActive', 'active')} tone={statusTone(user.isActive)} />
            </Card>
            <Text style={styles.sectionTitle}>All Fields</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.fieldCard}>
            <Text style={styles.fieldKey}>{item.key}</Text>
            <Text style={styles.fieldValue}>{item.value || '-'}</Text>
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
  backRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  actionsCard: { gap: spacing.md },
  actionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  actionLabel: { ...typography.headingSmall },
  typeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  typeButton: { height: 40 },
  meta: { ...typography.caption },
  sectionTitle: { ...typography.headingSmall },
  fieldCard: { gap: spacing.xs, marginBottom: spacing.sm, marginHorizontal: spacing.xl },
  fieldKey: { ...typography.label, color: colors.textSecondary },
  fieldValue: { ...typography.body }
});
