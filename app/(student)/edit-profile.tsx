import {
  FlashList } from '@shopify/flash-list';
import { keepPreviousData,
  useMutation,
  useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect,
  useMemo,
  useState } from 'react';
import { Alert,
  RefreshControl,
  StyleSheet,
  View
} from 'react-native';
import { TextInput } from '@/src/components/ui/TranslatedTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { ProfilePhotoUploader } from '@/src/components/ProfilePhotoUploader';
import { toast } from '@/src/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/src/constants';
import { PagePadding, ProgressBar, ScreenSkeleton } from '@/src/features/student/components';
import type { StudentProfile } from '@/src/features/student/types';
import { studentQueryTimes } from '@/src/features/student/utils';
import { api } from '@/src/lib/api';
import { normalizeImageAsset, validatePickedFile } from '@/src/lib/pickedFile';
import { uploadProfilePhoto } from '@/src/lib/uploadFile';
import { useAuthStore } from '@/src/stores/authStore';

import { Text } from '@/src/components/ui/TranslatedText';

type EditableProfile = Pick<
  StudentProfile,
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'whatsapp'
  | 'nationality'
  | 'currentCountry'
  | 'destinationCountry'
  | 'destinationCity'
  | 'preferredSchool'
  | 'preferredProgram'
  | 'emergencyContactName'
  | 'emergencyContactPhone'
  | 'emergencyContactRelationship'
  | 'passportNumberMasked'
  | 'passportExpiryDate'
>;

type FieldKey = keyof EditableProfile;

const fields: Array<{ key: FieldKey; label: string }> = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'phone', label: 'Phone' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'currentCountry', label: 'Current country' },
  { key: 'destinationCountry', label: 'Destination country' },
  { key: 'destinationCity', label: 'Destination city' },
  { key: 'preferredSchool', label: 'Preferred school' },
  { key: 'preferredProgram', label: 'Preferred program' },
  { key: 'emergencyContactName', label: 'Emergency contact name' },
  { key: 'emergencyContactPhone', label: 'Emergency contact phone' },
  { key: 'emergencyContactRelationship', label: 'Emergency contact relationship' },
  { key: 'passportNumberMasked', label: 'Passport number masked' },
  { key: 'passportExpiryDate', label: 'Passport expiry date' }
];

const allowedProfilePhotoMimeTypes = ['image/jpeg', 'image/png'] as const;
const maxProfilePhotoSize = 5 * 1024 * 1024;

async function fetchProfile() {
  const response = await api.get<StudentProfile | { profile: StudentProfile }>('/api/student/profile');

  if ('profile' in response.data) {
    return response.data.profile;
  }

  return response.data;
}

function emptyForm(): EditableProfile {
  return {
    firstName: '',
    lastName: '',
    phone: '',
    whatsapp: '',
    nationality: '',
    currentCountry: '',
    destinationCountry: '',
    destinationCity: '',
    preferredSchool: '',
    preferredProgram: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    passportNumberMasked: '',
    passportExpiryDate: ''
  };
}

export default function EditProfileScreen() {
  const [form, setForm] = useState<EditableProfile>(emptyForm);
  const user = useAuthStore((store) => store.user);

  const query = useQuery<StudentProfile>({
    queryKey: ['student', 'profile'],
    queryFn: fetchProfile,
    staleTime: studentQueryTimes.profile.staleTime,
    gcTime: studentQueryTimes.profile.gcTime,
    placeholderData: keepPreviousData
  });

  useEffect(() => {
    if (!query.data) {
      return;
    }

    setForm({
      firstName: query.data.firstName ?? '',
      lastName: query.data.lastName ?? '',
      phone: query.data.phone ?? '',
      whatsapp: query.data.whatsapp ?? '',
      nationality: query.data.nationality ?? '',
      currentCountry: query.data.currentCountry ?? '',
      destinationCountry: query.data.destinationCountry ?? '',
      destinationCity: query.data.destinationCity ?? '',
      preferredSchool: query.data.preferredSchool ?? '',
      preferredProgram: query.data.preferredProgram ?? '',
      emergencyContactName: query.data.emergencyContactName ?? '',
      emergencyContactPhone: query.data.emergencyContactPhone ?? '',
      emergencyContactRelationship: query.data.emergencyContactRelationship ?? '',
      passportNumberMasked: query.data.passportNumberMasked ?? '',
      passportExpiryDate: query.data.passportExpiryDate ?? ''
    });
  }, [query.data]);

  const completionPercent = useMemo(() => query.data?.completionPercent ?? 0, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () => api.patch('/api/student/profile', form),
    onSuccess: () => {
      toast.success('Profile saved.');
      void query.refetch();
      router.back();
    },
    onError: () => {
      toast.error('Unable to save profile.');
    }
  });

  const photoMutation = useMutation({
    mutationFn: async (asset: ImagePicker.ImagePickerAsset) => {
      if (!user) {
        throw new Error('You must be signed in to upload a profile photo.');
      }

      const file = normalizeImageAsset(asset, 'profile-photo.jpg');
      const validationError = validatePickedFile(
        file,
        allowedProfilePhotoMimeTypes,
        maxProfilePhotoSize
      );

      if (validationError) {
        throw new Error(validationError);
      }

      const { fileUrl } = await uploadProfilePhoto(user.id, file.uri, file.filename, file.mimeType);
      await api.patch('/api/student/profile', {
        profilePhotoUrl: fileUrl
      });
    },
    onSuccess: () => {
      toast.success('Profile photo updated.');
      void query.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to update profile photo.');
    }
  });

  const pickProfilePhoto = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      toast.error('Permission is required to change your photo.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.85
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.85
          });

    if (!result.canceled) {
      const asset = result.assets?.[0];
      if (!asset) {
        return;
      }

      photoMutation.mutate(asset);
    }
  };

  const openPhotoActions = () => {
    Alert.alert('Change photo', 'Choose a profile photo source.', [
      { text: 'Take Photo', onPress: () => void pickProfilePhoto('camera') },
      { text: 'Choose from Library', onPress: () => void pickProfilePhoto('library') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  if (query.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenSkeleton rows={6} />
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load profile"
          message="Refresh your profile before editing."
          onRetry={() => void query.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList
        data={fields}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
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
            <Text style={styles.title}>Edit Profile</Text>
            <ProfilePhotoUploader
              imageUrl={query.data.profilePhotoUrl}
              name={`${query.data.firstName} ${query.data.lastName}`}
              uploading={photoMutation.isPending}
              onPress={openPhotoActions}
            />
            <Card>
              <ProgressBar percent={completionPercent} label="Profile completion" />
            </Card>
          </PagePadding>
        }
        renderItem={({ item }) => (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{item.label}</Text>
            <TextInput
              value={String(form[item.key] ?? '')}
              onChangeText={(value) => setForm((current) => ({ ...current, [item.key]: value }))}
              placeholder={item.label}
              placeholderTextColor={colors.inactive}
              style={styles.input}
            />
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <Button title="Save" loading={saveMutation.isPending} onPress={() => saveMutation.mutate()} />
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  header: {
    paddingBottom: spacing.md
  },
  title: {
    ...typography.headingLarge
  },
  fieldRow: {
    gap: spacing.xs,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xl
  },
  fieldLabel: {
    ...typography.label
  },
  input: {
    ...typography.body,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    height: 52,
    paddingHorizontal: spacing.md
  },
  footer: {
    padding: spacing.xl,
    paddingTop: spacing.sm
  },
  listContent: {
    paddingBottom: spacing.xxxl
  }
});
