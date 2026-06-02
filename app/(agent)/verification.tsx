import {
  Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData,
  useMutation,
  useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { RefreshControl,
  StyleSheet,
  View
} from 'react-native';
import { TextInput } from '@/src/components/ui/TranslatedTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { StatusBadge } from '@/src/components/partner/StatusBadge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { toast } from '@/src/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/src/constants';
import { api } from '@/src/lib/api';
import { extractArray, extractRecord, getString, PartnerLoadingScreen, statusTone, type PartnerRecord } from '@/src/features/partner/screens';

import { Text } from '@/src/components/ui/TranslatedText';

export default function AgentVerificationScreen() {
  const [documentName, setDocumentName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const query = useQuery<unknown>({
    queryKey: ['/api/agent/verification'],
    queryFn: async () => (await api.get('/api/agent/verification')).data,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData
  });

  const uploadMutation = useMutation({
    mutationFn: () =>
      api.post('/api/agent/verification', {
        name: documentName.trim(),
        fileUrl: fileUrl.trim(),
        storageKey: `agent-verification/${Date.now()}`
      }),
    onSuccess: () => {
      toast.success('Document submitted.');
      setDocumentName('');
      setFileUrl('');
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to submit document.');
    }
  });

  if (query.isLoading) {
    return <PartnerLoadingScreen portalName="Verification" subtitle="Loading verification documents." />;
  }

  if (query.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState title="Unable to load verification" onRetry={() => void query.refetch()} />
      </SafeAreaView>
    );
  }

  const data = extractRecord(query.data);
  const documents = extractArray(query.data, ['requiredDocuments', 'documents']);
  const status = getString(data, 'status', 'Not Started');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<PartnerRecord>
        data={documents}
        keyExtractor={(item, index) => `${getString(item, 'name', 'document')}-${index}`}
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
            <PartnerHeader portalName="Verification" subtitle="Submit required agent documents." />
            <Card style={styles.statusCard}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.secondary} />
              <Text style={styles.statusTitle}>Verification Status</Text>
              <StatusBadge label={status} tone={statusTone(status)} />
            </Card>
            <Card style={styles.uploadCard}>
              <Text style={styles.sectionTitle}>Upload Section</Text>
              <TextInput value={documentName} onChangeText={setDocumentName} placeholder="Document name" placeholderTextColor={colors.inactive} style={styles.input} />
              <TextInput value={fileUrl} onChangeText={setFileUrl} placeholder="File URL" placeholderTextColor={colors.inactive} style={styles.input} />
              <Button title="Submit Document" loading={uploadMutation.isPending} disabled={!documentName.trim() || !fileUrl.trim()} onPress={() => uploadMutation.mutate()} />
            </Card>
            <Text style={styles.sectionTitle}>Required Documents</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="document-outline" title="No required documents listed" />}
        renderItem={({ item }) => (
          <Card style={styles.documentCard}>
            <Text style={styles.documentTitle}>{getString(item, 'name', getString(item, 'type', 'Document'))}</Text>
            <StatusBadge label={getString(item, 'status', 'Required')} tone={statusTone(item.status)} />
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
  statusCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  statusTitle: { ...typography.headingSmall, flex: 1 },
  uploadCard: { gap: spacing.md },
  sectionTitle: { ...typography.headingSmall },
  input: { ...typography.body, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1.5, height: 52, paddingHorizontal: spacing.md },
  documentCard: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm, marginHorizontal: spacing.xl },
  documentTitle: { ...typography.body, flex: 1, fontWeight: '600' }
});
