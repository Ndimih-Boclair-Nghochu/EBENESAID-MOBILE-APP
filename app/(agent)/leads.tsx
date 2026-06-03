import { FlashList } from '@shopify/flash-list';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { StatusBadge } from '@/src/components/partner/StatusBadge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { Text } from '@/src/components/ui/TranslatedText';
import { toast } from '@/src/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/src/constants';
import {
  extractArray,
  getRecordId,
  getString,
  PartnerLoadingScreen,
  statusTone,
  type PartnerRecord
} from '@/src/features/partner/screens';
import { api } from '@/src/lib/api';

export default function AgentLeadsScreen() {
  const [tab, setTab] = useState<'new' | 'all'>('new');
  const query = useQuery<unknown>({
    queryKey: ['/api/agent/bookings', 'leads'],
    queryFn: async () => (await api.get('/api/agent/bookings')).data,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData
  });

  const mutation = useMutation({
    mutationFn: ({ record, status }: { record: PartnerRecord; status: string }) =>
      api.patch('/api/agent/bookings', { id: getRecordId(record), status }),
    onSuccess: () => {
      toast.success('Lead updated.');
      void query.refetch();
    },
    onError: () => toast.error('Unable to update lead.')
  });

  const leads = useMemo(() => {
    const records = extractArray(query.data, ['bookings', 'enquiries', 'requests']);
    return tab === 'new'
      ? records.filter((record) => ['new', 'pending', 'open'].includes(getString(record, 'status').toLowerCase()))
      : records;
  }, [query.data, tab]);

  if (query.isLoading) {
    return <PartnerLoadingScreen portalName="Leads" subtitle="Loading housing enquiries." />;
  }

  if (query.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState title="Unable to load leads" onRetry={() => void query.refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<PartnerRecord>
        data={leads}
        keyExtractor={(item) => `${getRecordId(item)}`}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.secondary} colors={[colors.secondary]} />}
        ListHeaderComponent={
          <View style={styles.content}>
            <PartnerHeader portalName="Leads" subtitle="New enquiries with requester details and timeline." />
            <View style={styles.tabs}>
              {(['new', 'all'] as const).map((value) => (
                <Pressable accessibilityRole="button" key={value} onPress={() => setTab(value)} style={[styles.tab, tab === value && styles.tabActive]}>
                  <Text style={[styles.tabText, tab === value && styles.tabTextActive]}>{value === 'new' ? 'New Leads' : 'All'}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="mail-unread-outline" title="No active leads" />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getString(item, 'requesterName', 'S').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.textGroup}>
                <Text style={styles.title}>{getString(item, 'requesterName', 'Student')}</Text>
                <Text style={styles.meta}>{getString(item, 'requesterEmail', getString(item, 'email'))}</Text>
                <Text style={styles.meta}>{getString(item, 'requesterPhone', getString(item, 'phone'))}</Text>
              </View>
              <StatusBadge label={getString(item, 'status', 'new')} tone={statusTone(item.status)} />
            </View>
            <Text style={styles.listing}>{getString(item, 'listingTitle', 'Housing enquiry')}</Text>
            <Text style={styles.message} numberOfLines={3}>{getString(item, 'message', 'No message provided.')}</Text>
            <Text style={styles.meta}>Move-in {getString(item, 'moveInDate', 'TBD')} - {getString(item, 'stayMonths', '0')} months</Text>
            <View style={styles.actions}>
              <Button title="Reject" variant="danger" onPress={() => mutation.mutate({ record: item, status: 'rejected' })} style={styles.actionButton} />
              <Button title="Accept" onPress={() => mutation.mutate({ record: item, status: 'accepted' })} style={styles.actionButton} />
            </View>
          </Card>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.md, padding: spacing.xl },
  listContent: { paddingBottom: spacing.xxxl },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { borderColor: colors.border, borderRadius: radius.full, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  tabActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  tabText: { ...typography.label, color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  card: { gap: spacing.md, marginBottom: spacing.sm, marginHorizontal: spacing.xl },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  avatar: { alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: radius.full, height: 44, justifyContent: 'center', width: 44 },
  avatarText: { color: '#15803d', fontWeight: '800' },
  textGroup: { flex: 1, gap: 2 },
  title: { ...typography.headingSmall },
  listing: { ...typography.headingSmall, color: '#15803d' },
  message: { ...typography.body, color: colors.textSecondary },
  meta: { ...typography.caption },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1, height: 44 }
});
