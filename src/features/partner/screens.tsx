import {
  Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData,
  useMutation,
  useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Tabs,
  router } from 'expo-router';
import { useEffect,
  useMemo,
  useRef,
  useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  View
} from 'react-native';
import { TextInput } from '@/src/components/ui/TranslatedTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionList, type ActionListItem } from '@/src/components/partner/ActionList';
import { DataTable } from '@/src/components/partner/DataTable';
import { MetricCard } from '@/src/components/partner/MetricCard';
import { PartnerHeader } from '@/src/components/partner/PartnerHeader';
import { StatusBadge, type StatusBadgeTone } from '@/src/components/partner/StatusBadge';
import { AIAssistantFAB } from '@/src/components/AIAssistantFAB';
import { ProfilePhotoUploader } from '@/src/components/ProfilePhotoUploader';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { SkeletonLoader } from '@/src/components/ui/SkeletonLoader';
import { toast } from '@/src/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/src/constants';
import { useAuth } from '@/src/hooks/useAuth';
import { api } from '@/src/lib/api';
import { normalizeImageAsset, validatePickedFile } from '@/src/lib/pickedFile';
import { uploadPartnerDocument } from '@/src/lib/uploadFile';

import { Text } from '@/src/components/ui/TranslatedText';

export type PartnerRecord = Record<string, unknown>;

export interface TabDefinition {
  name: string;
  title: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

export interface MetricConfig {
  label: string;
  key: string;
  format?: 'currency' | 'number' | 'text';
}

export interface FieldConfig {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'switch';
  placeholder?: string;
}

export interface CardConfig {
  titleKey: string;
  subtitleKeys?: string[];
  descriptionKey?: string;
  imageKey?: string;
  statusKey?: string;
  metaKeys?: string[];
  valueKey?: string;
  valuePrefix?: string;
}

export interface ActionConfig {
  label: string;
  endpoint: string;
  method?: 'post' | 'patch';
  payload: (record: PartnerRecord) => PartnerRecord;
  successMessage: string;
}

const defaultQueryOptions = {
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 60,
  placeholderData: keepPreviousData
};

const allowedProfilePhotoMimeTypes = ['image/jpeg', 'image/png'] as const;
const maxProfilePhotoSize = 5 * 1024 * 1024;

export function PartnerTabsLayout({
  tabs,
  hiddenScreens = []
}: {
  tabs: TabDefinition[];
  hiddenScreens?: string[];
}) {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8
        }
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.activeIcon : tab.inactiveIcon}
                color={color}
                size={size}
              />
            )
          }}
        />
      ))}
      {hiddenScreens.map((screen) => (
        <Tabs.Screen key={screen} name={screen} options={{ href: null }} />
      ))}
    </Tabs>
  );
}

export function getString(record: PartnerRecord | undefined, key: string, fallback = ''): string {
  const value = record?.[key];

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return fallback;
}

export function getNumber(record: PartnerRecord | undefined, key: string, fallback = 0): number {
  const value = record?.[key];

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function getBoolean(record: PartnerRecord | undefined, key: string): boolean {
  return record?.[key] === true;
}

export function getRecordId(record: PartnerRecord): number | string {
  const id = record.id;
  return typeof id === 'number' || typeof id === 'string' ? id : JSON.stringify(record);
}

export function extractArray(data: unknown, keys: string[]): PartnerRecord[] {
  if (Array.isArray(data)) {
    return data.filter(isRecord);
  }

  if (!isRecord(data)) {
    return [];
  }

  const containers = [data, ...nestedRecords(data)];
  const records = containers.flatMap((container) =>
    keys.flatMap((key) => {
      const value = container[key];
      return Array.isArray(value) ? value.filter(isRecord) : [];
    })
  );

  return records;
}

export function extractRecord(data: unknown): PartnerRecord {
  if (!isRecord(data)) {
    return {};
  }

  return {
    ...nestedRecords(data).reduce<PartnerRecord>((merged, record) => ({ ...merged, ...record }), {}),
    ...data
  };
}

export function isRecord(value: unknown): value is PartnerRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nestedRecords(record: PartnerRecord): PartnerRecord[] {
  return ['overview', 'metrics', 'summary', 'totals', 'statistics', 'finance', 'institutions', 'partnerProfile']
    .map((key) => record[key])
    .filter(isRecord);
}

export function statusTone(status: unknown): StatusBadgeTone {
  const value = String(status ?? '').toLowerCase();

  if (['active', 'verified', 'confirmed', 'accepted', 'delivered', 'ready', 'open', 'paid'].includes(value)) {
    return 'success';
  }

  if (['pending', 'preparing', 'waitlisted', 'review', 'submitted'].includes(value)) {
    return 'warning';
  }

  if (['cancelled', 'canceled', 'inactive', 'rejected', 'closed', 'failed'].includes(value)) {
    return 'error';
  }

  return 'default';
}

export function formatDate(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatValue(value: unknown, format?: MetricConfig['format']): string {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  if (format === 'currency') {
    const amount = typeof value === 'number' ? value : Number(value);

    if (Number.isFinite(amount)) {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
      }).format(amount);
    }
  }

  if (format === 'number' && typeof value === 'number') {
    return value.toLocaleString();
  }

  return String(value);
}

export function metricGrid(metrics: Array<MetricConfig & { value: string | number }>) {
  const rows: Array<Array<MetricConfig & { value: string | number }>> = [];

  for (let index = 0; index < metrics.length; index += 2) {
    rows.push(metrics.slice(index, index + 2));
  }

  return (
    <View style={styles.metricGrid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.metricRow}>
          {row.map((metric) => (
            <MetricCard key={metric.key} label={metric.label} value={metric.value} />
          ))}
          {row.length === 1 ? <View style={styles.metricSpacer} /> : null}
        </View>
      ))}
    </View>
  );
}

export function SummaryScreen({
  portalName,
  subtitle,
  endpoint,
  metrics,
  activityKeys = ['recentActivity', 'activity', 'activities'],
  revenueRoute,
  showAssistant = false
}: {
  portalName: string;
  subtitle: string;
  endpoint: string;
  metrics: MetricConfig[];
  activityKeys?: string[];
  revenueRoute?: string;
  showAssistant?: boolean;
}) {
  const query = useQuery<unknown>({
    queryKey: [endpoint],
    queryFn: async () => (await api.get(endpoint)).data,
    ...defaultQueryOptions
  });

  if (query.isLoading) {
    return <LoadingPortalScreen portalName={portalName} subtitle={subtitle} />;
  }

  if (query.isError) {
    return (
      <PartnerErrorScreen
        title={`Unable to load ${portalName.toLowerCase()}`}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const data = extractRecord(query.data);
  const activity = extractArray(query.data, [
    ...activityKeys,
    'workQueues',
    'queues',
    'recentEvents',
    'recentBookings',
    'recentOrders',
    'recentApplications'
  ]);
  const metricValues = metrics.map((metric) => ({
    ...metric,
    value: formatValue(data[metric.key], metric.format)
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<PartnerRecord>
        data={activity}
        keyExtractor={(item, index) => `${getRecordId(item)}-${index}`}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.content}>
            <PartnerHeader portalName={portalName} subtitle={subtitle} />
            {metricGrid(metricValues)}
            {revenueRoute ? (
              <Button title="View Revenue" variant="secondary" onPress={() => router.push(revenueRoute as never)} />
            ) : null}
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="No recent activity"
            subtitle="New partner activity will appear here."
          />
        }
        renderItem={({ item }) => <ActivityCard record={item} />}
        contentContainerStyle={styles.listContent}
      />
      {showAssistant ? <AIAssistantFAB /> : null}
    </SafeAreaView>
  );
}

export function ReadOnlyListScreen({
  portalName,
  title,
  subtitle,
  endpoint,
  listKeys,
  item,
  tabs,
  searchKeys
}: {
  portalName: string;
  title: string;
  subtitle: string;
  endpoint: string;
  listKeys: string[];
  item: {
    titleKey: string;
    subtitleKeys?: string[];
    metaKeys?: string[];
    statusKey?: string;
    icon?: keyof typeof Ionicons.glyphMap;
  };
  tabs?: Array<{ label: string; value: string; key: string; matches?: string[] }>;
  searchKeys?: string[];
}) {
  const [selectedTab, setSelectedTab] = useState(tabs?.[0]?.value ?? 'all');
  const [search, setSearch] = useState('');
  const query = useQuery<unknown>({
    queryKey: [endpoint],
    queryFn: async () => (await api.get(endpoint)).data,
    ...defaultQueryOptions
  });

  const records = useMemo(() => {
    const allRecords = extractArray(query.data, listKeys);
    const searched = search
      ? allRecords.filter((record) =>
          (searchKeys ?? [item.titleKey, ...(item.subtitleKeys ?? [])])
            .map((key) => getString(record, key).toLowerCase())
            .join(' ')
            .includes(search.toLowerCase())
        )
      : allRecords;

    if (!tabs || selectedTab === 'all') {
      return searched;
    }

    const tab = tabs.find((entry) => entry.value === selectedTab);

    if (!tab) {
      return searched;
    }

    const matches = tab.matches ?? [tab.value];
    return searched.filter((record) =>
      matches.includes(getString(record, tab.key).toLowerCase())
    );
  }, [item.subtitleKeys, item.titleKey, listKeys, query.data, search, searchKeys, selectedTab, tabs]);

  if (query.isLoading) {
    return <LoadingPortalScreen portalName={portalName} subtitle={subtitle} />;
  }

  if (query.isError) {
    return <PartnerErrorScreen title={`Unable to load ${title.toLowerCase()}`} onRetry={() => void query.refetch()} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <PartnerHeader portalName={title} subtitle={subtitle} />
        {searchKeys ? (
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={colors.inactive}
            style={styles.input}
          />
        ) : null}
        {tabs ? (
          <View style={styles.chips}>
            {tabs.map((tab) => (
              <Pressable
                accessibilityRole="button"
                key={tab.value}
                onPress={() => setSelectedTab(tab.value)}
                style={[styles.chip, selectedTab === tab.value && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selectedTab === tab.value && styles.chipTextSelected]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.flexList}>
          <ActionList
            items={records.map((record) => toActionItem(record, item))}
            emptyTitle={`No ${title.toLowerCase()} yet`}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

export function CrudListScreen({
  portalName,
  title,
  subtitle,
  getEndpoint,
  mutateEndpoint = getEndpoint,
  listKeys,
  fields,
  card,
  createDefaults,
  deleteEnabled = true,
  editEnabled = true,
  toggleKey,
  numColumns = 1
}: {
  portalName: string;
  title: string;
  subtitle: string;
  getEndpoint: string;
  mutateEndpoint?: string;
  listKeys: string[];
  fields: FieldConfig[];
  card: CardConfig;
  createDefaults?: PartnerRecord;
  deleteEnabled?: boolean;
  editEnabled?: boolean;
  toggleKey?: string;
  numColumns?: number;
}) {
  const sheetRef = useRef<BottomSheet>(null);
  const [editingRecord, setEditingRecord] = useState<PartnerRecord | null>(null);
  const [form, setForm] = useState<PartnerRecord>({});
  const query = useQuery<unknown>({
    queryKey: [getEndpoint],
    queryFn: async () => (await api.get(getEndpoint)).data,
    ...defaultQueryOptions
  });

  const records = extractArray(query.data, listKeys);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload(fields, form);

      if (editingRecord) {
        return api.patch(mutateEndpoint, {
          id: getRecordId(editingRecord),
          ...payload
        });
      }

      return api.post(mutateEndpoint, {
        ...payload,
        ...(createDefaults ?? {})
      });
    },
    onSuccess: () => {
      toast.success(editingRecord ? 'Updated.' : 'Created.');
      sheetRef.current?.close();
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to save changes.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => api.delete(mutateEndpoint, { data: { id } }),
    onSuccess: () => {
      toast.success('Deleted.');
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to delete record.');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (record: PartnerRecord) =>
      api.patch(mutateEndpoint, {
        id: getRecordId(record),
        [toggleKey ?? 'active']: !getBoolean(record, toggleKey ?? 'active')
      }),
    onSuccess: () => {
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to update status.');
    }
  });

  const openCreate = () => {
    setEditingRecord(null);
    setForm({});
    sheetRef.current?.snapToIndex(0);
  };

  const openEdit = (record: PartnerRecord) => {
    setEditingRecord(record);
    setForm(record);
    sheetRef.current?.snapToIndex(0);
  };

  if (query.isLoading) {
    return <LoadingPortalScreen portalName={portalName} subtitle={subtitle} />;
  }

  if (query.isError) {
    return <PartnerErrorScreen title={`Unable to load ${title.toLowerCase()}`} onRetry={() => void query.refetch()} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<PartnerRecord>
        data={records}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => `${getRecordId(item)}`}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.content}>
            <PartnerHeader portalName={title} subtitle={subtitle} />
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon="file-tray-outline" title={`No ${title.toLowerCase()} yet`} subtitle="Add the first record to get started." />
        }
        renderItem={({ item }) => (
          <ManagedCard
            record={item}
            card={card}
            editEnabled={editEnabled}
            deleteEnabled={deleteEnabled}
            toggleKey={toggleKey}
            onEdit={() => openEdit(item)}
            onDelete={() =>
              Alert.alert('Delete record', 'This action cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteMutation.mutate(getRecordId(item))
                }
              ])
            }
            onToggle={() => toggleMutation.mutate(item)}
            compact={numColumns > 1}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
      <Pressable accessibilityRole="button" accessibilityLabel={`Add ${title}`} onPress={openCreate} style={styles.fab}>
        <Ionicons name="add" size={26} color={colors.primary} />
      </Pressable>
      <BottomSheet ref={sheetRef} index={-1} snapPoints={['76%']} enablePanDownToClose>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>{editingRecord ? `Edit ${title}` : `Add ${title}`}</Text>
          <FlashList<FieldConfig>
            data={fields}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <PartnerField
                field={item}
                value={form[item.key]}
                onChange={(value) => setForm((current) => ({ ...current, [item.key]: value }))}
              />
            )}
            ListFooterComponent={
              <Button title="Save" loading={saveMutation.isPending} onPress={() => saveMutation.mutate()} />
            }
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

export function ProfileFormScreen({
  portalName,
  subtitle,
  endpoint,
  fields,
  profileImageRole,
  profileImageField = 'logoUrl'
}: {
  portalName: string;
  subtitle: string;
  endpoint: string;
  fields: FieldConfig[];
  profileImageRole?: string;
  profileImageField?: string;
}) {
  const { logout, isLoading, user } = useAuth();
  const [form, setForm] = useState<PartnerRecord>({});
  const query = useQuery<unknown>({
    queryKey: [endpoint],
    queryFn: async () => (await api.get(endpoint)).data,
    ...defaultQueryOptions
  });

  useEffect(() => {
    const record = extractRecord(query.data);
    setForm(isRecord(record.profile) ? record.profile : record);
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () => api.patch(endpoint, buildPayload(fields, form)),
    onSuccess: () => {
      toast.success('Profile saved.');
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to save profile.');
    }
  });

  const photoMutation = useMutation({
    mutationFn: async (asset: ImagePicker.ImagePickerAsset) => {
      if (!user || !profileImageRole) {
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

      const { fileUrl } = await uploadPartnerDocument(
        user.id,
        profileImageRole,
        file.uri,
        file.filename,
        file.mimeType
      );
      await api.patch(endpoint, {
        [profileImageField]: fileUrl
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
    return <LoadingPortalScreen portalName={portalName} subtitle={subtitle} />;
  }

  if (query.isError) {
    return <PartnerErrorScreen title="Unable to load profile" onRetry={() => void query.refetch()} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <PartnerHeader portalName={portalName} subtitle={subtitle} />
        {profileImageRole ? (
          <ProfilePhotoUploader
            imageUrl={
              getString(form, profileImageField) ||
              getString(form, 'avatarUrl') ||
              getString(form, 'logoUrl')
            }
            name={
              getString(form, 'businessName') ||
              getString(form, 'company') ||
              getString(form, 'schoolName') ||
              getString(form, 'contactPerson') ||
              portalName
            }
            uploading={photoMutation.isPending}
            onPress={openPhotoActions}
          />
        ) : null}
        <View style={styles.flexList}>
          <FlashList<FieldConfig>
            data={fields}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <PartnerField
                field={item}
                value={form[item.key]}
                onChange={(value) => setForm((current) => ({ ...current, [item.key]: value }))}
              />
            )}
            ListFooterComponent={
              <View style={styles.profileFooter}>
                <Button title="Save profile" loading={saveMutation.isPending} onPress={() => saveMutation.mutate()} />
                <Button title="Logout" variant="danger" loading={isLoading} onPress={logout} />
              </View>
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

export function TableScreen({
  portalName,
  subtitle,
  endpoint,
  listKeys,
  headers,
  row
}: {
  portalName: string;
  subtitle: string;
  endpoint: string;
  listKeys: string[];
  headers: string[];
  row: (record: PartnerRecord) => Array<string | number>;
}) {
  const query = useQuery<unknown>({
    queryKey: [endpoint],
    queryFn: async () => (await api.get(endpoint)).data,
    ...defaultQueryOptions
  });

  if (query.isLoading) {
    return <LoadingPortalScreen portalName={portalName} subtitle={subtitle} />;
  }

  if (query.isError) {
    return <PartnerErrorScreen title={`Unable to load ${portalName.toLowerCase()}`} onRetry={() => void query.refetch()} />;
  }

  const records = extractArray(query.data, listKeys);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <PartnerHeader portalName={portalName} subtitle={subtitle} />
        <DataTable headers={headers} rows={records.map(row)} />
      </View>
    </SafeAreaView>
  );
}

function ManagedCard({
  record,
  card,
  editEnabled,
  deleteEnabled,
  toggleKey,
  onEdit,
  onDelete,
  onToggle,
  compact
}: {
  record: PartnerRecord;
  card: CardConfig;
  editEnabled: boolean;
  deleteEnabled: boolean;
  toggleKey?: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  compact: boolean;
}) {
  const imageUrl = card.imageKey ? getString(record, card.imageKey) : '';
  const status = card.statusKey ? getString(record, card.statusKey) : '';

  return (
    <Card style={[styles.managedCard, compact && styles.compactCard]}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.cardImage} contentFit="cover" /> : null}
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <View style={styles.cardTitleGroup}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {getString(record, card.titleKey, 'Untitled')}
            </Text>
            {card.subtitleKeys ? <Text style={styles.cardSubtitle}>{joinValues(record, card.subtitleKeys)}</Text> : null}
          </View>
          {status ? <StatusBadge label={status} tone={statusTone(status)} /> : null}
        </View>
        {card.valueKey ? (
          <Text style={styles.cardValue}>
            {card.valuePrefix ?? ''}
            {getString(record, card.valueKey)}
          </Text>
        ) : null}
        {card.descriptionKey ? (
          <Text style={styles.cardDescription} numberOfLines={3}>
            {getString(record, card.descriptionKey)}
          </Text>
        ) : null}
        {card.metaKeys ? <Text style={styles.cardMeta}>{joinValues(record, card.metaKeys)}</Text> : null}
        {toggleKey ? (
          <View style={styles.toggleRow}>
            <Text style={styles.label}>{toggleKey}</Text>
            <Switch
              value={getBoolean(record, toggleKey)}
              onValueChange={onToggle}
              thumbColor={colors.primary}
              trackColor={{ false: colors.border, true: colors.secondary }}
            />
          </View>
        ) : null}
        <View style={styles.cardActions}>
          {editEnabled ? <Button title="Edit" variant="secondary" onPress={onEdit} style={styles.smallButton} /> : null}
          {deleteEnabled ? <Button title="Delete" variant="danger" onPress={onDelete} style={styles.smallButton} /> : null}
        </View>
      </View>
    </Card>
  );
}

function PartnerField({
  field,
  value,
  onChange
}: {
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === 'switch') {
    return (
      <View style={styles.switchField}>
        <Text style={styles.label}>{field.label}</Text>
        <Switch
          value={value === true}
          onValueChange={onChange}
          thumbColor={colors.primary}
          trackColor={{ false: colors.border, true: colors.secondary }}
        />
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{field.label}</Text>
      <TextInput
        value={value === undefined || value === null ? '' : String(value)}
        onChangeText={onChange}
        keyboardType={field.type === 'number' ? 'numeric' : 'default'}
        multiline={field.type === 'textarea'}
        textAlignVertical={field.type === 'textarea' ? 'top' : 'center'}
        placeholder={field.placeholder ?? field.label}
        placeholderTextColor={colors.inactive}
        style={[styles.input, field.type === 'textarea' && styles.textarea]}
      />
    </View>
  );
}

function ActivityCard({ record }: { record: PartnerRecord }) {
  return (
    <Card style={styles.activityCard}>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {getString(record, 'title', getString(record, 'type', 'Activity'))}
      </Text>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {getString(record, 'description', getString(record, 'message', getString(record, 'content', 'New activity')))}
      </Text>
      <Text style={styles.cardMeta}>{formatDate(record.createdAt ?? record.date ?? record.sentAt)}</Text>
    </Card>
  );
}

function toActionItem(record: PartnerRecord, config: Parameters<typeof ReadOnlyListScreen>[0]['item']): ActionListItem {
  const status = config.statusKey ? getString(record, config.statusKey) : '';

  return {
    id: getRecordId(record),
    title: getString(record, config.titleKey, 'Untitled'),
    subtitle: config.subtitleKeys ? joinValues(record, config.subtitleKeys) : undefined,
    meta: config.metaKeys ? joinValues(record, config.metaKeys) : undefined,
    status: status || undefined,
    statusTone: statusTone(status),
    icon: config.icon
  };
}

function buildPayload(fields: FieldConfig[], form: PartnerRecord): PartnerRecord {
  return fields.reduce<PartnerRecord>((payload, field) => {
    const value = form[field.key];

    if (field.type === 'number') {
      payload[field.key] = Number(value);
      return payload;
    }

    payload[field.key] = value ?? '';
    return payload;
  }, {});
}

function joinValues(record: PartnerRecord, keys: string[]): string {
  return keys
    .map((key) => {
      const value = record[key];
      return key.toLowerCase().includes('date') || key.toLowerCase().includes('time')
        ? formatDate(value)
        : formatValue(value, 'text');
    })
    .filter((value) => value && value !== '0')
    .join(' • ');
}

export function PartnerLoadingScreen({ portalName, subtitle }: { portalName: string; subtitle: string }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <PartnerHeader portalName={portalName} subtitle={subtitle} />
        <View style={styles.metricGrid}>
          <View style={styles.metricRow}>
            <Card style={styles.skeletonCard}>
              <SkeletonLoader width="56%" height={14} />
              <SkeletonLoader width="72%" height={32} />
            </Card>
            <Card style={styles.skeletonCard}>
              <SkeletonLoader width="56%" height={14} />
              <SkeletonLoader width="72%" height={32} />
            </Card>
          </View>
          <Card style={styles.skeletonCard}>
            <SkeletonLoader width="48%" height={20} />
            <SkeletonLoader width="100%" height={14} />
            <SkeletonLoader width="78%" height={14} />
          </Card>
          <Card style={styles.skeletonCard}>
            <SkeletonLoader width="62%" height={20} />
            <SkeletonLoader width="100%" height={14} />
            <SkeletonLoader width="68%" height={14} />
          </Card>
        </View>
      </View>
    </SafeAreaView>
  );
}

function LoadingPortalScreen({ portalName, subtitle }: { portalName: string; subtitle: string }) {
  return <PartnerLoadingScreen portalName={portalName} subtitle={subtitle} />;
}

function PartnerErrorScreen({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ErrorState title={title} message="Refresh when your connection is back." onRetry={onRetry} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    padding: spacing.xl
  },
  listContent: {
    paddingBottom: spacing.xxxl
  },
  flexList: {
    flex: 1
  },
  metricGrid: {
    gap: spacing.sm
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  metricSpacer: {
    flex: 1
  },
  sectionTitle: {
    ...typography.headingSmall
  },
  activityCard: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xl
  },
  fab: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 28,
    bottom: spacing.xl,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.xl,
    width: 56
  },
  managedCard: {
    marginBottom: spacing.md,
    marginHorizontal: spacing.xl,
    overflow: 'hidden',
    padding: 0
  },
  compactCard: {
    flex: 1,
    marginHorizontal: spacing.xs
  },
  cardImage: {
    backgroundColor: colors.neutralSoft,
    height: 132,
    width: '100%'
  },
  cardBody: {
    gap: spacing.sm,
    padding: spacing.md
  },
  cardTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm
  },
  cardTitleGroup: {
    flex: 1,
    gap: 4
  },
  cardTitle: {
    ...typography.headingSmall
  },
  cardSubtitle: {
    ...typography.caption
  },
  cardValue: {
    ...typography.headingSmall,
    color: colors.secondary
  },
  cardDescription: {
    ...typography.body,
    color: colors.textSecondary
  },
  cardMeta: {
    ...typography.caption
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  smallButton: {
    flex: 1,
    height: 44
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  label: {
    ...typography.label
  },
  field: {
    gap: spacing.xs,
    marginBottom: spacing.md
  },
  switchField: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  input: {
    ...typography.body,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    height: 52,
    paddingHorizontal: spacing.md
  },
  textarea: {
    height: 112,
    paddingVertical: spacing.sm
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  chip: {
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  chipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary
  },
  chipText: {
    ...typography.label,
    color: colors.textSecondary
  },
  chipTextSelected: {
    color: colors.primary
  },
  sheetContent: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.xl
  },
  sheetTitle: {
    ...typography.headingMedium
  },
  profileFooter: {
    gap: spacing.md,
    paddingTop: spacing.md
  },
  skeletonCard: {
    flex: 1,
    gap: spacing.md
  }
});
