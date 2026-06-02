import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { toast } from '@/src/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/src/constants';
import { extractArray, getRecordId, getString, PartnerLoadingScreen, type PartnerRecord } from '@/src/features/partner/screens';
import { api } from '@/src/lib/api';

const contentRoutes = [
  { title: 'AI Knowledge', route: '/(admin)/ai-knowledge', icon: 'sparkles-outline' },
  { title: 'AI Feedback', route: '/(admin)/ai-feedback', icon: 'chatbox-ellipses-outline' },
  { title: 'Community Circles', route: '/(admin)/community-circles', icon: 'people-outline' },
  { title: 'Task Templates', route: '/(admin)/task-templates', icon: 'checkbox-outline' }
] as const;

export default function AdminContentScreen() {
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [draft, setDraft] = useState('');
  const query = useQuery<unknown>({
    queryKey: ['/api/admin/content'],
    queryFn: async () => (await api.get('/api/admin/content')).data,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData
  });

  const mutation = useMutation({
    mutationFn: () => api.patch('/api/admin/content', { id: editingId, content: draft }),
    onSuccess: () => {
      toast.success('Content updated.');
      setEditingId(null);
      setDraft('');
      void query.refetch();
    }
  });

  if (query.isLoading) {
    return <PartnerLoadingScreen portalName="Content" subtitle="Loading platform content." />;
  }

  if (query.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState title="Unable to load content" onRetry={() => void query.refetch()} />
      </SafeAreaView>
    );
  }

  const items = extractArray(query.data, ['content', 'items', 'announcements', 'textBlocks']);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<PartnerRecord>
        data={items}
        keyExtractor={(item) => `${getRecordId(item)}`}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.secondary} colors={[colors.secondary]} />}
        ListHeaderComponent={
          <View style={styles.content}>
            <PartnerHeader portalName="Content" subtitle="Announcements, text blocks, and admin content tools." />
            {contentRoutes.map((item) => (
              <Pressable accessibilityRole="button" key={item.route} onPress={() => router.push(item.route)}>
                <Card style={styles.routeCard}>
                  <Ionicons name={item.icon} size={22} color={colors.secondary} />
                  <Text style={styles.routeTitle}>{item.title}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </Card>
              </Pressable>
            ))}
            <Text style={styles.sectionTitle}>Platform Content</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="create-outline" title="No content items" />}
        renderItem={({ item }) => {
          const id = getRecordId(item);
          const editing = editingId === id;

          return (
            <Card style={styles.itemCard}>
              <Text style={styles.itemTitle}>{getString(item, 'title', getString(item, 'key', 'Content item'))}</Text>
              {editing ? (
                <TextInput value={draft} onChangeText={setDraft} multiline textAlignVertical="top" style={styles.textArea} />
              ) : (
                <Text style={styles.itemContent}>{getString(item, 'content', getString(item, 'body'))}</Text>
              )}
              <Button
                title={editing ? 'Save' : 'Edit'}
                loading={mutation.isPending && editing}
                onPress={() => {
                  if (editing) {
                    mutation.mutate();
                    return;
                  }
                  setEditingId(id);
                  setDraft(getString(item, 'content', getString(item, 'body')));
                }}
              />
            </Card>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.md, padding: spacing.xl },
  listContent: { paddingBottom: spacing.xxxl },
  routeCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  routeTitle: { ...typography.headingSmall, flex: 1 },
  sectionTitle: { ...typography.headingSmall, marginTop: spacing.sm },
  itemCard: { gap: spacing.md, marginBottom: spacing.sm, marginHorizontal: spacing.xl },
  itemTitle: { ...typography.headingSmall },
  itemContent: { ...typography.body, color: colors.textSecondary },
  textArea: { ...typography.body, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1.5, minHeight: 132, padding: spacing.md }
});
