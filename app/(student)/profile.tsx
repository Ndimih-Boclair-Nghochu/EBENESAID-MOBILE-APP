import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { colors, spacing, typography } from '@/src/constants';
import {
  IconLabel,
  PagePadding,
  ProgressBar,
  ScreenSkeleton
} from '@/src/features/student/components';
import type { StudentProfile } from '@/src/features/student/types';
import { studentQueryTimes } from '@/src/features/student/utils';
import { useAuth } from '@/src/hooks/useAuth';
import { api } from '@/src/lib/api';

type ProfileRow =
  | { id: 'documents'; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; route: '/(student)/documents' }
  | { id: 'support'; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; route: '/(student)/support' }
  | { id: 'password'; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; route: '/(student)/change-password' }
  | { id: 'logout'; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap };

const rows: ProfileRow[] = [
  {
    id: 'documents',
    title: 'Document Wallet',
    subtitle: 'View relocation documents',
    icon: 'document-text-outline',
    route: '/(student)/documents'
  },
  {
    id: 'support',
    title: 'Support',
    subtitle: 'Message the EBENESAID team',
    icon: 'chatbubbles-outline',
    route: '/(student)/support'
  },
  {
    id: 'password',
    title: 'Change Password',
    subtitle: 'Update account credentials',
    icon: 'lock-closed-outline',
    route: '/(student)/change-password'
  },
  {
    id: 'logout',
    title: 'Logout',
    subtitle: 'End this session',
    icon: 'log-out-outline'
  }
];

async function fetchProfile() {
  const response = await api.get<StudentProfile | { profile: StudentProfile }>('/api/student/profile');

  if ('profile' in response.data) {
    return response.data.profile;
  }

  return response.data;
}

export default function StudentProfileScreen() {
  const { logout, isLoading } = useAuth();
  const query = useQuery<StudentProfile>({
    queryKey: ['student', 'profile'],
    queryFn: fetchProfile,
    staleTime: studentQueryTimes.profile.staleTime,
    gcTime: studentQueryTimes.profile.gcTime,
    placeholderData: keepPreviousData
  });

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
          title="Unable to load profile"
          message="Refresh your profile when your connection is back."
          onRetry={() => void query.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<ProfileRow>
        data={rows}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }
        ListHeaderComponent={<ProfileHeader profile={query.data} />}
        renderItem={({ item }) => (
          <ProfileMenuRow row={item} onLogout={logout} logoutLoading={isLoading} />
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

function ProfileHeader({ profile }: { profile: StudentProfile }) {
  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <PagePadding style={styles.header}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account and support access.</Text>
        </View>
        <Button
          title="Edit"
          variant="secondary"
          onPress={() => router.push('/(student)/edit-profile')}
          style={styles.editButton}
        />
      </View>
      <Card style={styles.profileCard}>
        <View style={styles.identityRow}>
          {profile.profilePhotoUrl ? (
            <Image source={{ uri: profile.profilePhotoUrl }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {`${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.identityText}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            <View style={styles.badgeRow}>
              <Badge label={profile.userType} tone="success" />
              {profile.university ? <Badge label={profile.university} tone="info" /> : null}
            </View>
          </View>
        </View>
        <ProgressBar percent={profile.completionPercent} label="Profile completion" />
      </Card>
      <Text style={styles.sectionLabel}>Security</Text>
    </PagePadding>
  );
}

function ProfileMenuRow({
  row,
  onLogout,
  logoutLoading
}: {
  row: ProfileRow;
  onLogout: () => Promise<void>;
  logoutLoading: boolean;
}) {
  const isLogout = row.id === 'logout';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (isLogout) {
          void onLogout();
          return;
        }

        router.push(row.route);
      }}
      disabled={isLogout && logoutLoading}
      style={styles.rowPressable}
    >
      <Card style={styles.menuCard}>
        <IconLabel
          icon={row.icon}
          title={row.title}
          subtitle={row.subtitle}
          color={isLogout ? colors.error : colors.secondary}
          right={
            isLogout && logoutLoading ? null : (
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )
          }
        />
      </Card>
    </Pressable>
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
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  title: {
    ...typography.headingLarge
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  editButton: {
    height: 44,
    width: 88
  },
  profileCard: {
    gap: spacing.md
  },
  identityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    width: 72
  },
  avatarImage: {
    borderRadius: 36,
    height: 72,
    width: 72
  },
  avatarText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700'
  },
  identityText: {
    flex: 1,
    gap: spacing.xs
  },
  name: {
    ...typography.headingMedium
  },
  email: {
    ...typography.body,
    color: colors.textSecondary
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary
  },
  listContent: {
    paddingBottom: spacing.xxxl
  },
  rowPressable: {
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xl
  },
  menuCard: {
    paddingVertical: spacing.md
  }
});
