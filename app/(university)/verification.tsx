import { FlashList } from '@shopify/flash-list';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { StatusBadge } from '@/src/components/partner/StatusBadge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { Text } from '@/src/components/ui/TranslatedText';
import { toast } from '@/src/components/ui/Toast';
import { colors, spacing, typography } from '@/src/constants';
import {
  extractArray,
  getRecordId,
  getString,
  PartnerLoadingScreen,
  statusTone,
  type PartnerRecord
} from '@/src/features/partner/screens';
import { api } from '@/src/lib/api';
import { normalizeDocumentAsset, validatePickedFile } from '@/src/lib/pickedFile';
import { uploadPartnerDocument } from '@/src/lib/uploadFile';
import { useAuthStore } from '@/src/stores/authStore';

const maxPdfSize = 8 * 1024 * 1024;

export default function UniversityVerificationScreen() {
  const user = useAuthStore((store) => store.user);
  const query = useQuery<unknown>({
    queryKey: ['/api/university/profile', 'verification'],
    queryFn: async () => (await api.get('/api/university/profile')).data,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('You must be signed in to upload documents.');
      }

      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: 'application/pdf'
      });

      const asset = result.assets?.[0];

      if (result.canceled || !asset) {
        throw new Error('No document selected.');
      }

      const file = normalizeDocumentAsset(asset, 'university-verification.pdf');
      const validationError = validatePickedFile(file, ['application/pdf'], maxPdfSize);

      if (validationError) {
        throw new Error(validationError);
      }

      const { fileUrl, storageKey } = await uploadPartnerDocument(
        user.id,
        'university',
        file.uri,
        file.filename,
        file.mimeType
      );

      return api.post('/api/university/profile', {
        name: file.filename,
        type: file.mimeType,
        fileUrl,
        storageKey
      });
    },
    onSuccess: () => {
      toast.success('Verification document uploaded.');
      void query.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Unable to upload document.')
  });

  if (query.isLoading) {
    return <PartnerLoadingScreen portalName="Verification" subtitle="Loading accreditation documents." />;
  }

  if (query.isError) {
    return <ErrorState title="Unable to load verification" onRetry={() => void query.refetch()} />;
  }

  const records = extractArray(query.data, ['documents', 'verification', 'items']);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<PartnerRecord>
        data={records}
        keyExtractor={(item) => `${getRecordId(item)}`}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.secondary} colors={[colors.secondary]} />}
        ListHeaderComponent={
          <View style={styles.content}>
            <PartnerHeader portalName="Verification" subtitle="University accreditation documents." />
            <Button title="Upload PDF" loading={uploadMutation.isPending} onPress={() => uploadMutation.mutate()} />
          </View>
        }
        ListEmptyComponent={<EmptyState icon="shield-checkmark-outline" title="No verification documents" />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.textGroup}>
                <Text style={styles.title}>{getString(item, 'name', getString(item, 'documentName', 'Document'))}</Text>
                <Text style={styles.meta}>{getString(item, 'createdAt', getString(item, 'uploadedAt'))}</Text>
              </View>
              <StatusBadge label={getString(item, 'status', 'pending')} tone={statusTone(item.status)} />
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
  card: { marginBottom: spacing.sm, marginHorizontal: spacing.xl },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  textGroup: { flex: 1, gap: 4 },
  title: { ...typography.headingSmall },
  meta: { ...typography.caption }
});
