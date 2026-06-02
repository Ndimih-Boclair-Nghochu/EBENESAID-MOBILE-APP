import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { colors, spacing, typography } from '@/src/constants';

import { StatusBadge, type StatusBadgeTone } from './StatusBadge';

export interface ActionListItem {
  id: string | number;
  title: string;
  subtitle?: string;
  meta?: string;
  status?: string;
  statusTone?: StatusBadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onPress?: () => void;
}

interface ActionListProps {
  items: ActionListItem[];
  emptyTitle?: string;
  emptySubtitle?: string;
}

export function ActionList({
  items,
  emptyTitle = 'No records yet',
  emptySubtitle = 'New activity will appear here.'
}: ActionListProps) {
  return (
    <FlashList<ActionListItem>
      data={items}
      keyExtractor={(item) => `${item.id}`}
      estimatedItemSize={112}
      ListEmptyComponent={<EmptyState icon="file-tray-outline" title={emptyTitle} subtitle={emptySubtitle} />}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole={item.onPress ? 'button' : undefined}
          disabled={!item.onPress}
          onPress={item.onPress}
          style={styles.rowWrapper}
        >
          <Card style={styles.row}>
            <View style={styles.top}>
              {item.icon ? (
                <View style={styles.iconShell}>
                  <Ionicons name={item.icon} size={20} color={colors.secondary} />
                </View>
              ) : null}
              <View style={styles.textGroup}>
                <Text style={styles.title}>{item.title}</Text>
                {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
                {item.meta ? <Text style={styles.meta}>{item.meta}</Text> : null}
              </View>
              {item.status ? (
                <StatusBadge label={item.status} tone={item.statusTone ?? 'default'} />
              ) : null}
            </View>
            {item.onPrimaryAction || item.onSecondaryAction ? (
              <View style={styles.actions}>
                {item.onSecondaryAction && item.secondaryActionLabel ? (
                  <Button
                    title={item.secondaryActionLabel}
                    variant="secondary"
                    onPress={item.onSecondaryAction}
                    style={styles.actionButton}
                  />
                ) : null}
                {item.onPrimaryAction && item.primaryActionLabel ? (
                  <Button
                    title={item.primaryActionLabel}
                    onPress={item.onPrimaryAction}
                    style={styles.actionButton}
                  />
                ) : null}
              </View>
            ) : null}
          </Card>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  rowWrapper: {
    marginBottom: spacing.sm
  },
  row: {
    gap: spacing.md
  },
  top: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  textGroup: {
    flex: 1,
    gap: 3
  },
  title: {
    ...typography.headingSmall
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary
  },
  meta: {
    ...typography.caption
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  actionButton: {
    flex: 1,
    height: 44
  }
});

