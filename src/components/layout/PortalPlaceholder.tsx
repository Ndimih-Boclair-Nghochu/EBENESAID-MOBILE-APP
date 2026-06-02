import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/src/components/ui/Avatar';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Separator } from '@/src/components/ui/Separator';
import { colors, spacing, typography } from '@/src/constants';
import { useAuth } from '@/src/hooks/useAuth';

import { ScreenHeader } from './ScreenHeader';

interface PortalPlaceholderProps {
  portalName: string;
}

export function PortalPlaceholder({ portalName }: PortalPlaceholderProps) {
  const { user, logout, isLoading } = useAuth();
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'EBENESAID user';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title={`${portalName} Portal`} subtitle="Phase 1 foundation" />
        <Card elevated>
          <View style={styles.userRow}>
            <Avatar firstName={user?.firstName} lastName={user?.lastName} uri={user?.avatar} />
            <View style={styles.userText}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.email}>{user?.email ?? 'No email available'}</Text>
            </View>
          </View>
          <Separator style={styles.separator} />
          <Badge label={user?.userType ?? portalName.toLowerCase()} tone="success" />
        </Card>
        <Text style={styles.placeholderText}>
          This portal shell is ready for the next implementation phase.
        </Text>
        <Button title="Logout" variant="primary" loading={isLoading} onPress={logout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    gap: spacing.lg,
    padding: spacing.xl
  },
  userRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md
  },
  userText: {
    flex: 1,
    gap: 4
  },
  name: {
    ...typography.headingSmall
  },
  email: {
    ...typography.body,
    color: colors.textSecondary
  },
  separator: {
    marginVertical: spacing.md
  },
  placeholderText: {
    ...typography.body,
    color: colors.textSecondary
  }
});

