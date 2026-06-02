import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/src/components/ui/Avatar';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { colors, spacing, typography } from '@/src/constants';
import { useAuth } from '@/src/hooks/useAuth';

import { ScreenHeader } from './ScreenHeader';

import { Text } from '@/src/components/ui/TranslatedText';

interface StudentTabPlaceholderProps {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof EmptyState>['icon'];
  showLogout?: boolean;
}

export function StudentTabPlaceholder({
  title,
  subtitle,
  icon,
  showLogout = false
}: StudentTabPlaceholderProps) {
  const { user, logout, isLoading } = useAuth();
  const firstName = user?.firstName ?? 'there';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title={title} subtitle={subtitle} />
        <Card>
          <View style={styles.userRow}>
            <Avatar firstName={user?.firstName} lastName={user?.lastName} uri={user?.avatar} />
            <View style={styles.userText}>
              <Text style={styles.name}>Hi, {firstName}</Text>
              <Text style={styles.email}>{user?.email ?? 'Your account is loading'}</Text>
            </View>
            <Badge label={user?.userType ?? 'student'} tone="success" />
          </View>
        </Card>
        <EmptyState
          icon={icon}
          title="Phase 2 workspace"
          subtitle="This area is wired into the navigation shell and ready for feature buildout."
        />
        {showLogout ? (
          <Button title="Logout" variant="primary" loading={isLoading} onPress={logout} />
        ) : null}
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
    ...typography.caption
  }
});

