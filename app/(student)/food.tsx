import BottomSheet from '@gorhom/bottom-sheet';
import {
  FlashList } from '@shopify/flash-list';
import { keepPreviousData,
  useMutation,
  useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useMemo,
  useRef,
  useState } from 'react';
import { RefreshControl,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { toast } from '@/src/components/ui/Toast';
import { colors, spacing, typography } from '@/src/constants';
import {
  FilterChip,
  PagePadding,
  ScreenSkeleton,
  SegmentedTabs,
  SectionHeader
} from '@/src/features/student/components';
import type { FoodMenuItem, FoodOrder, FoodResponse } from '@/src/features/student/types';
import { formatCurrency, statusTone, studentQueryTimes } from '@/src/features/student/utils';
import { api } from '@/src/lib/api';

import { Text } from '@/src/components/ui/TranslatedText';

type Fulfillment = 'delivery' | 'pickup';
type Category = 'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

const categories: Category[] = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];

async function fetchFood() {
  const response = await api.get<FoodResponse>('/api/food');
  return response.data;
}

export default function FoodScreen() {
  const sheetRef = useRef<BottomSheet>(null);
  const [category, setCategory] = useState<Category>('All');
  const [selectedItem, setSelectedItem] = useState<FoodMenuItem | null>(null);
  const [fulfillment, setFulfillment] = useState<Fulfillment>('delivery');

  const query = useQuery<FoodResponse>({
    queryKey: ['food'],
    queryFn: fetchFood,
    staleTime: studentQueryTimes.food.staleTime,
    gcTime: studentQueryTimes.food.gcTime,
    placeholderData: keepPreviousData
  });

  const orderMutation = useMutation({
    mutationFn: ({ itemId, method }: { itemId: number; method: Fulfillment }) =>
      api.post('/api/food', {
        itemId,
        fulfillment: method
      }),
    onSuccess: () => {
      toast.success('Order placed.');
      sheetRef.current?.close();
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to place order.');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: number) =>
      api.patch('/api/food', {
        orderId
      }),
    onSuccess: () => {
      toast.success('Order cancelled.');
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to cancel order.');
    }
  });

  const menu = useMemo(() => {
    if (category === 'All') {
      return query.data?.menu ?? [];
    }

    return (
      query.data?.menu.filter(
        (item: FoodMenuItem) => item.category.toLowerCase() === category.toLowerCase()
      ) ?? []
    );
  }, [category, query.data?.menu]);

  const openOrderSheet = (item: FoodMenuItem) => {
    setSelectedItem(item);
    setFulfillment('delivery');
    sheetRef.current?.snapToIndex(0);
  };

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
          title="Unable to load food service"
          message="Refresh the menu when your connection is back."
          onRetry={() => void query.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<FoodMenuItem>
        data={menu}
        numColumns={2}
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
            <View>
              <Text style={styles.title}>Food Service</Text>
              <Text style={styles.subtitle}>Order meals from trusted suppliers.</Text>
            </View>
            {query.data.orders.length > 0 ? (
              <View style={styles.activeOrders}>
                <SectionHeader title="Active Orders" />
                <FlashList<FoodOrder>
                  horizontal
                  data={query.data.orders}
                  keyExtractor={(item) => `${item.id}`}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <ActiveOrderCard
                      order={item}
                      onCancel={() => cancelMutation.mutate(item.id)}
                      isCancelling={cancelMutation.isPending}
                    />
                  )}
                />
              </View>
            ) : null}
            <View style={styles.chipRow}>
              {categories.map((option) => (
                <FilterChip
                  key={option}
                  label={option}
                  selected={category === option}
                  onPress={() => setCategory(option)}
                />
              ))}
            </View>
          </PagePadding>
        }
        ListEmptyComponent={
          <EmptyState
            icon="restaurant-outline"
            title="No menu items"
            subtitle="Try another category."
          />
        }
        renderItem={({ item }) => <MenuItemCard item={item} onOrder={() => openOrderSheet(item)} />}
        contentContainerStyle={styles.listContent}
      />

      <BottomSheet ref={sheetRef} index={-1} snapPoints={['42%']} enablePanDownToClose>
        <View style={styles.sheetContent}>
          <View>
            <Text style={styles.sheetTitle}>{selectedItem?.itemName ?? 'Order item'}</Text>
            <Text style={styles.sheetSubtitle}>
              {selectedItem ? formatCurrency(selectedItem.price, selectedItem.currency) : ''}
            </Text>
          </View>
          <SegmentedTabs
            value={fulfillment}
            onChange={setFulfillment}
            tabs={[
              { label: 'Delivery', value: 'delivery' },
              { label: 'Pickup', value: 'pickup' }
            ]}
          />
          <Button
            title="Confirm order"
            loading={orderMutation.isPending}
            onPress={() => {
              if (!selectedItem) {
                return;
              }
              orderMutation.mutate({
                itemId: selectedItem.id,
                method: fulfillment
              });
            }}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function ActiveOrderCard({
  order,
  onCancel,
  isCancelling
}: {
  order: FoodOrder;
  onCancel: () => void;
  isCancelling: boolean;
}) {
  return (
    <Card style={styles.orderCard}>
      <Text style={styles.orderTitle} numberOfLines={2}>
        {order.itemName}
      </Text>
      <Badge label={order.status} tone={statusTone(order.status)} />
      <Text style={styles.orderMeta}>{order.fulfillment}</Text>
      <Button title="Cancel" variant="ghost" loading={isCancelling} onPress={onCancel} />
    </Card>
  );
}

function MenuItemCard({ item, onOrder }: { item: FoodMenuItem; onOrder: () => void }) {
  return (
    <Card style={styles.menuCard}>
      <Image
        source={item.imageUrl ? { uri: item.imageUrl } : undefined}
        style={styles.menuImage}
        contentFit="cover"
      />
      <View style={styles.menuBody}>
        <Text style={styles.menuTitle} numberOfLines={2}>
          {item.itemName}
        </Text>
        <Text style={styles.supplier} numberOfLines={1}>
          {item.supplierName}
        </Text>
        <Text style={styles.price}>{formatCurrency(item.price, item.currency)}</Text>
        <Button title="Order" disabled={!item.available} onPress={onOrder} />
      </View>
    </Card>
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
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  activeOrders: {
    gap: spacing.sm
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  listContent: {
    paddingBottom: spacing.xxxl
  },
  orderCard: {
    gap: spacing.xs,
    marginRight: spacing.sm,
    width: 220
  },
  orderTitle: {
    ...typography.headingSmall
  },
  orderMeta: {
    ...typography.caption,
    textTransform: 'capitalize'
  },
  menuCard: {
    flex: 1,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
    overflow: 'hidden',
    padding: 0
  },
  menuImage: {
    backgroundColor: colors.neutralSoft,
    height: 128,
    width: '100%'
  },
  menuBody: {
    gap: spacing.xs,
    padding: spacing.md
  },
  menuTitle: {
    ...typography.headingSmall,
    minHeight: 40
  },
  supplier: {
    ...typography.caption
  },
  price: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: '700'
  },
  sheetContent: {
    gap: spacing.md,
    padding: spacing.xl
  },
  sheetTitle: {
    ...typography.headingMedium
  },
  sheetSubtitle: {
    ...typography.body,
    color: colors.secondary,
    marginTop: spacing.xs
  }
});
