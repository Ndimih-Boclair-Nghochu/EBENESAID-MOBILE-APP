import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/TranslatedText';
import { colors, radius, shadow, spacing, typography } from '@/src/constants';
import {
  deferNotificationPrompt,
  requestNotificationsFromPrompt,
  shouldShowNotificationPrompt,
  subscribeNotificationPrompt
} from '@/src/lib/notifications';
import type { SafeUser } from '@/src/types';

interface NotificationPromptModalProps {
  user: SafeUser | null;
}

export function NotificationPromptModal({ user }: NotificationPromptModalProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const refresh = () => {
      void shouldShowNotificationPrompt(user).then((shouldShow) => {
        if (mounted) {
          setVisible(shouldShow);
        }
      });
    };

    refresh();
    const unsubscribe = subscribeNotificationPrompt(refresh);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [user]);

  const allowNotifications = async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    const granted = await requestNotificationsFromPrompt(user);
    setLoading(false);
    setVisible(false);

    if (!granted) {
      return;
    }
  };

  const maybeLater = async () => {
    if (!user) {
      return;
    }

    await deferNotificationPrompt(user);
    setVisible(false);
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={maybeLater}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification prompt"
            onPress={maybeLater}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
          <View style={styles.iconShell}>
            <Ionicons name="notifications-outline" color={colors.secondary} size={64} />
          </View>
          <Text style={styles.title}>Stay in the loop</Text>
          <Text style={styles.body}>
            Allow EBENESAID to send you updates about your housing enquiries, job applications,
            messages and arrival plans.
          </Text>
          <View style={styles.actions}>
            <Button title="Allow notifications" loading={loading} onPress={() => void allowNotifications()} />
            <Button title="Maybe later" variant="ghost" onPress={() => void maybeLater()} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.34)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.xl,
    width: '100%',
    ...shadow
  },
  closeButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    width: 36
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.full,
    height: 96,
    justifyContent: 'center',
    width: 96
  },
  title: {
    ...typography.headingLarge,
    textAlign: 'center'
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center'
  },
  actions: {
    gap: spacing.sm,
    width: '100%'
  }
});
