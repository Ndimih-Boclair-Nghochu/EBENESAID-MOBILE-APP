import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { toast } from '@/src/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/src/constants';
import {
  FilterChip,
  IconLabel,
  PagePadding,
  ProgressBar,
  ScreenSkeleton,
  SectionHeader
} from '@/src/features/student/components';
import type {
  DocumentsResponse,
  DocumentType,
  StudentDocument
} from '@/src/features/student/types';
import { formatDate, studentQueryTimes } from '@/src/features/student/utils';
import { api } from '@/src/lib/api';
import { useAuthStore } from '@/src/stores/authStore';

const documentTypes: DocumentType[] = [
  'passport',
  'offer_letter',
  'health_insurance',
  'residence_permit',
  'visa',
  'bank_statement',
  'photo_id',
  'other'
];

const requiredDocuments: DocumentType[] = ['passport', 'offer_letter', 'health_insurance'];

async function fetchDocuments() {
  const response = await api.get<DocumentsResponse>('/api/student/documents');
  return response.data;
}

function documentLabel(type: DocumentType): string {
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function DocumentsScreen() {
  const sheetRef = useRef<BottomSheet>(null);
  const user = useAuthStore((store) => store.user);
  const [selectedType, setSelectedType] = useState<DocumentType>('passport');
  const [name, setName] = useState('');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isResident = user?.userType === 'resident';

  const query = useQuery<DocumentsResponse>({
    queryKey: ['student', 'documents'],
    queryFn: fetchDocuments,
    staleTime: studentQueryTimes.documents.staleTime,
    gcTime: studentQueryTimes.documents.gcTime,
    placeholderData: keepPreviousData,
    enabled: !isResident
  });

  const uploadMutation = useMutation({
    mutationFn: ({
      documentName,
      documentType
    }: {
      documentName: string;
      documentType: DocumentType;
    }) => {
      const timestamp = Date.now();
      const safeName = documentName.trim().replace(/\s+/g, '_').toLowerCase();

      // TODO Phase 5: replace with Firebase Storage upload
      return api.post('/api/student/documents', {
        name: documentName.trim(),
        type: documentType,
        fileUrl: `uploaded_${timestamp}_${safeName}`,
        storageKey: `docs/${user?.id ?? 'unknown'}/${timestamp}`
      });
    },
    onMutate: () => {
      setUploadProgress(35);
    },
    onSuccess: () => {
      setUploadProgress(100);
      toast.success('Document uploaded.');
      setName('');
      setPickedUri(null);
      sheetRef.current?.close();
      void query.refetch();
    },
    onError: () => {
      setUploadProgress(0);
      toast.error('Unable to upload document.');
    }
  });

  const uploadedTypes = useMemo(
    () => new Set(query.data?.documents.map((document: StudentDocument) => document.type) ?? []),
    [query.data?.documents]
  );

  const pickImage = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      toast.error('Permission is required to select a document.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8
          });

    if (!result.canceled) {
      setPickedUri(result.assets[0]?.uri ?? null);
      setUploadProgress(0);
      if (!name) {
        setName(documentLabel(selectedType));
      }
    }
  };

  if (isResident) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <PagePadding>
          <Text style={styles.title}>Documents</Text>
          <EmptyState
            icon="document-text-outline"
            title="Document wallet is available to student accounts."
            subtitle="Resident profiles do not need school document uploads."
          />
        </PagePadding>
      </SafeAreaView>
    );
  }

  if (query.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenSkeleton rows={4} />
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load documents"
          message="Refresh the wallet when your connection is back."
          onRetry={() => void query.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<StudentDocument>
        data={query.data.documents}
        keyExtractor={(item) => `${item.id}`}
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
          <PagePadding style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.title}>Documents</Text>
                <Text style={styles.subtitle}>Keep your relocation documents ready.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Upload document"
                onPress={() => sheetRef.current?.snapToIndex(0)}
                style={styles.uploadButton}
              >
                <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
              </Pressable>
            </View>
            <Card style={styles.checklist}>
              <SectionHeader title="Required Documents" />
              {requiredDocuments.map((type) => {
                const uploaded = uploadedTypes.has(type);

                return (
                  <IconLabel
                    key={type}
                    icon={uploaded ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                    title={documentLabel(type)}
                    subtitle={uploaded ? 'Uploaded' : 'Missing'}
                    color={uploaded ? colors.secondary : colors.error}
                    right={<Badge label={uploaded ? 'Done' : 'Missing'} tone={uploaded ? 'success' : 'error'} />}
                  />
                );
              })}
            </Card>
          </PagePadding>
        }
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title="No documents yet"
            subtitle="Upload your first document to start the wallet."
          />
        }
        renderItem={({ item }) => <DocumentRow document={item} />}
        contentContainerStyle={styles.listContent}
      />

      <BottomSheet ref={sheetRef} index={-1} snapPoints={['68%']} enablePanDownToClose>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Upload document</Text>
          <View style={styles.typeGrid}>
            {documentTypes.map((type) => (
              <FilterChip
                key={type}
                label={documentLabel(type)}
                selected={selectedType === type}
                onPress={() => setSelectedType(type)}
              />
            ))}
          </View>
          <View style={styles.pickRow}>
            <Button title="Take Photo" variant="secondary" onPress={() => void pickImage('camera')} style={styles.pickButton} />
            <Button title="Choose from Library" variant="secondary" onPress={() => void pickImage('library')} style={styles.pickButton} />
          </View>
          {pickedUri ? <Image source={{ uri: pickedUri }} style={styles.preview} contentFit="cover" /> : null}
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Document name"
            placeholderTextColor={colors.inactive}
            style={styles.nameInput}
          />
          {uploadProgress > 0 ? <ProgressBar percent={uploadProgress} label="Upload progress" /> : null}
          <Button
            title="Upload"
            loading={uploadMutation.isPending}
            disabled={!pickedUri || !name.trim()}
            onPress={() =>
              uploadMutation.mutate({
                documentName: name,
                documentType: selectedType
              })
            }
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function DocumentRow({ document }: { document: StudentDocument }) {
  return (
    <Card style={styles.documentRow}>
      <IconLabel
        icon="document-text-outline"
        title={document.name}
        subtitle={`${documentLabel(document.type)} • Uploaded ${formatDate(document.uploadedAt)}`}
        right={
          <Button
            title="View"
            variant="secondary"
            onPress={() => void Linking.openURL(document.fileUrl)}
            style={styles.viewButton}
          />
        }
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  title: {
    ...typography.headingLarge
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  header: {
    paddingBottom: spacing.md
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md
  },
  headerText: {
    flex: 1
  },
  uploadButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  checklist: {
    gap: spacing.md
  },
  listContent: {
    paddingBottom: spacing.xxxl
  },
  documentRow: {
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xl
  },
  viewButton: {
    height: 40,
    paddingHorizontal: spacing.md
  },
  sheetContent: {
    gap: spacing.md,
    padding: spacing.xl
  },
  sheetTitle: {
    ...typography.headingMedium
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  pickRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  pickButton: {
    flex: 1
  },
  preview: {
    backgroundColor: colors.neutralSoft,
    borderRadius: radius.md,
    height: 120,
    width: '100%'
  },
  nameInput: {
    ...typography.body,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    height: 52,
    paddingHorizontal: spacing.md
  }
});
