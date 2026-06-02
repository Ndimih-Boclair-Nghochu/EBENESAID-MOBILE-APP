import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/src/components/ui/Avatar';
import { colors, spacing, typography } from '@/src/constants';
import { useAuthStore } from '@/src/stores/authStore';

interface PartnerHeaderProps {
  portalName: string;
  subtitle?: string;
}

export function PartnerHeader({ portalName, subtitle }: PartnerHeaderProps) {
  const user = useAuthStore((store) => store.user);

  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text style={styles.title}>{portalName}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Avatar firstName={user?.firstName} lastName={user?.lastName} uri={user?.avatar} size={44} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  copy: {
    flex: 1,
    gap: spacing.xs
  },
  title: {
    ...typography.headingLarge
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary
  }
});

