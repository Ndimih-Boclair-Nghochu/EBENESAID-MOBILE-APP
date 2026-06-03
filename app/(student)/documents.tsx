import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  Share as NativeShare,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { Text } from '@/src/components/ui/TranslatedText';
import { TextInput } from '@/src/components/ui/TranslatedTextInput';
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
import type { DocumentsResponse, DocumentType, StudentDocument } from '@/src/features/student/types';
import { formatDate, studentQueryTimes } from '@/src/features/student/utils';
import { api } from '@/src/lib/api';
import {
  normalizeDocumentAsset,
  normalizeImageAsset,
  type PickedFile,
  validatePickedFile
} from '@/src/lib/pickedFile';
import {
  createStudentDocumentUpload,
  type CancellableUpload,
  type UploadResult
} from '@/src/lib/uploadFile';
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
const allowedDocumentMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
const maxDocumentSize = 8 * 1024 * 1024;

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
  const uploadTaskRef = useRef<CancellableUpload<UploadResult> | null>(null);
  const user = useAuthStore((store) => store.user);
  const [selectedType, setSelectedType] = useState<DocumentType>('passport');
  const [name, setName] = useState('');
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
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
    mutationFn: async ({
      documentName,
      documentType
    }: {
      documentName: string;
      documentType: DocumentType;
    }) => {
      if (!user || !pickedFile) {
        throw new Error('Pick a document before uploading.');
      }

      setUploadProgress(0.05);
      const upload = createStudentDocumentUpload(
        user.id,
        pickedFile.uri,
        pickedFile.filename,
        pickedFile.mimeType,
        {
          onProgress: (progress) => setUploadProgress(Math.max(progress, 0.05))
        }
      );
      uploadTaskRef.current = upload;
      const { fileUrl, storageKey } = await upload.promise;

      return api.post('/api/student/documents', {
        name: documentName.trim(),
        type: documentType,
        fileUrl,
        storageKey
      });
    },
    onSuccess: () => {
      setUploadProgress(1);
      toast.success("Document uploaded successfully. You'll receive a confirmation email.");
      setName('');
      setPickedFile(null);
      sheetRef.current?.close();
      void query.refetch();
    },
    onError: (error) => {
      setUploadProgress(0);
      toast.error(
        error instanceof Error && error.message.toLowerCase().includes('cancel')
          ? 'Upload cancelled.'
          : 'Unable to upload document.'
      );
    },
    onSettled: () => {
      uploadTaskRef.current = null;
    }
  });

  const uploadedTypes = useMemo(
    () => new Set(query.data?.documents.map((document: StudentDocument) => document.type) ?? []),
    [query.data?.documents]
  );

  const setValidatedFile = (file: PickedFile) => {
    const validationError = validatePickedFile(file, allowedDocumentMimeTypes, maxDocumentSize);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setPickedFile(file);
    setUploadProgress(0);

    if (!name) {
      setName(documentLabel(selectedType));
    }
  };

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
            quality: 0.82
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.82
          });

    if (!result.canceled) {
      const asset = result.assets?.[0];
      if (!asset) {
        return;
      }

      setValidatedFile(normalizeImageAsset(asset, `${selectedType}.jpg`));
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: [...allowedDocumentMimeTypes]
    });

    const asset = result.assets?.[0];

    if (!result.canceled && asset) {
      setValidatedFile(normalizeDocumentAsset(asset, `${selectedType}.pdf`));
    }
  };

  const cancelUpload = () => {
    uploadTaskRef.current?.cancel();
    uploadTaskRef.current = null;
    setUploadProgress(0);
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

      <BottomSheet ref={sheetRef} index={-1} snapPoints={['76%']} enablePanDownToClose>
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
          <Button title="Choose PDF" variant="ghost" onPress={() => void pickDocument()} />
          {pickedFile ? <PickedFilePreview file={pickedFile} /> : null}
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Document name"
            placeholderTextColor={colors.inactive}
            style={styles.nameInput}
          />
          {uploadProgress > 0 ? (
            <View style={styles.progressBlock}>
              <ProgressBar percent={Math.round(uploadProgress * 100)} label="Upload progress" />
              <Text style={styles.uploadingName}>{pickedFile?.filename}</Text>
            </View>
          ) : null}
          {uploadMutation.isPending ? (
            <Button title="Cancel upload" variant="ghost" onPress={cancelUpload} />
          ) : null}
          <Button
            title="Upload"
            loading={uploadMutation.isPending}
            disabled={!pickedFile || !name.trim()}
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

function PickedFilePreview({ file }: { file: PickedFile }) {
  return (
    <Card style={styles.uploadPreview}>
      {file.mimeType.startsWith('image/') ? (
        <Image
          source={{ uri: file.uri }}
          style={styles.preview}
          contentFit="cover"
          accessibilityLabel={file.filename}
        />
      ) : (
        <View style={styles.pdfPreview}>
          <Ionicons name="document-text-outline" size={28} color={colors.secondary} />
        </View>
      )}
      <View style={styles.previewText}>
        <Text style={styles.previewName} numberOfLines={1}>
          {file.filename}
        </Text>
        <Text style={styles.previewMeta}>{file.mimeType}</Text>
      </View>
    </Card>
  );
}

function DocumentRow({ document }: { document: StudentDocument }) {
  const shareDocument = async () => {
    try {
      if (document.fileUrl.startsWith('file:') && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(document.fileUrl);
        return;
      }

      await NativeShare.share({
        message: document.fileUrl,
        url: document.fileUrl,
        title: document.name
      });
    } catch {
      toast.error('Unable to share document.');
    }
  };

  return (
    <Card style={styles.documentRow}>
      <IconLabel
        icon="document-text-outline"
        title={document.name}
        subtitle={`${documentLabel(document.type)} - Uploaded ${formatDate(document.uploadedAt)}`}
        right={
          <View style={styles.documentActions}>
            <Badge label="Verified" tone="success" />
            <Button
              title="View"
              variant="secondary"
              onPress={() => void Linking.openURL(document.fileUrl)}
              style={styles.viewButton}
            />
            <Button title="Share" variant="ghost" onPress={() => void shareDocument()} style={styles.viewButton} />
          </View>
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
  documentActions: {
    alignItems: 'flex-end',
    gap: spacing.xs
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
  uploadPreview: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md
  },
  preview: {
    backgroundColor: colors.neutralSoft,
    borderRadius: radius.md,
    height: 72,
    width: 72
  },
  pdfPreview: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    height: 72,
    justifyContent: 'center',
    width: 72
  },
  previewText: {
    flex: 1,
    gap: 4
  },
  previewName: {
    ...typography.headingSmall
  },
  previewMeta: {
    ...typography.caption
  },
  nameInput: {
    ...typography.body,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    height: 52,
    paddingHorizontal: spacing.md
  },
  progressBlock: {
    gap: spacing.xs
  },
  uploadingName: {
    ...typography.caption
  }
});
