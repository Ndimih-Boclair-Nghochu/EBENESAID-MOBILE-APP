import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { Text } from '@/src/components/ui/TranslatedText';
import { toast } from '@/src/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/src/constants';
import {
  FilterChip, PagePadding, ScreenSkeleton, SectionHeader, SegmentedTabs,
} from '@/src/features/student/components';
import type { FoodItem, FoodOrder, FoodResponse } from '@/src/features/student/types';
import { formatCurrency, statusTone, studentQueryTimes } from '@/src/features/student/utils';
import { api } from '@/src/lib/api';

type Fulfillment = 'delivery' | 'pickup';
type Cat = 'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
const CATS: Cat[] = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const SNAP = ['55%'] as const;

async function fetchFood() {
  const r = await api.get<FoodResponse>('/api/food');
  return r.data;
}

export default function FoodScreen() {
  const sheetRef = useRef<BottomSheet>(null);
  const [cat, setCat] = useState<Cat>('All');
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [fulfillment, setFulfillment] = useState<Fulfillment>('delivery');

  const query = useQuery<FoodResponse>({
    queryKey: ['food'],
    queryFn: fetchFood,
    staleTime: studentQueryTimes.food.staleTime,
    gcTime: studentQueryTimes.food.gcTime,
    placeholderData: keepPreviousData,
  });

  const orderMut = useMutation({
    mutationFn: (v: { itemId: number; fulfillment: Fulfillment }) => api.post('/api/food', v),
    onSuccess: () => {
      toast.success('Order placed!');
      void query.refetch();
      sheetRef.current?.close();
    },
    onError: () => toast.error('Could not place order. Try again.'),
  });

  const cancelMut = useMutation({
    mutationFn: (orderId: number) => api.patch('/api/food', { orderId }),
    onSuccess: () => { toast.success('Order cancelled.'); void query.refetch(); },
    onError: () => toast.error('Could not cancel order.'),
  });

  if (query.isLoading) return <SafeAreaView style={s.safe}><ScreenSkeleton rows={4} /></SafeAreaView>;

  if (query.isError || !query.data) {
    return (
      <SafeAreaView style={s.safe}>
        <ErrorState title="Unable to load food" message="Check your connection and retry." onRetry={() => void query.refetch()} />
      </SafeAreaView>
    );
  }

  // Backend returns 'items' (not 'menu') with fields: name, img, deliveryFee, kitchen, tags
  const allItems = query.data.items ?? [];
  const orders = query.data.orders ?? [];
  const activeOrders = orders.filter((o) => o.canCancel);

  const filtered = useMemo(() => {
    if (cat === 'All') return allItems;
    return allItems.filter(
      (item) =>
        item.tags?.some((t) => t.toLowerCase() === cat.toLowerCase()) ||
        item.kitchen?.toLowerCase().includes(cat.toLowerCase())
    );
  }, [allItems, cat]);

  function openOrder(item: FoodItem) {
    setSelected(item);
    setFulfillment('delivery');
    sheetRef.current?.expand();
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <FlashList<FoodItem>
        data={filtered}
        keyExtractor={(i) => String(i.id)}
        numColumns={2}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }
        ListHeaderComponent={
          <PagePadding>
            {activeOrders.length > 0 && (
              <>
                <SectionHeader title={`Active Orders (${activeOrders.length})`} />
                {activeOrders.map((o) => (
                  <ActiveOrderCard key={o.id} order={o} onCancel={() => cancelMut.mutate(o.id)} cancelling={cancelMut.isPending} />
                ))}
              </>
            )}
            <SectionHeader title="Menu" />
            <View style={s.chips}>
              {CATS.map((c) => (
                <FilterChip key={c} label={c} selected={cat === c} onPress={() => setCat(c)} />
              ))}
            </View>
          </PagePadding>
        }
        ListEmptyComponent={
          <EmptyState icon="restaurant-outline" title="No items" subtitle="Check back soon for new menu items." />
        }
        renderItem={({ item }) => (
          <View style={s.cell}>
            <ItemCard item={item} onOrder={() => openOrder(item)} />
          </View>
        )}
        contentContainerStyle={s.list}
      />

      <BottomSheet ref={sheetRef} snapPoints={SNAP} index={-1} enablePanDownToClose>
        <BottomSheetView style={s.sheet}>
          {selected && (
            <>
              <Text style={s.sheetTitle}>{selected.name}</Text>
              <Text style={s.sheetPrice}>
                {formatCurrency(selected.price)} · Delivery fee: {formatCurrency(selected.deliveryFee)}
              </Text>
              {selected.kitchen ? <Text style={s.sheetKitchen}>{selected.kitchen}</Text> : null}
              <Text style={s.sheetLabel}>How would you like it?</Text>
              <View style={s.fulfillRow}>
                {(['delivery', 'pickup'] as Fulfillment[]).map((f) => (
                  <Pressable
                    key={f}
                    accessibilityRole="button"
                    onPress={() => setFulfillment(f)}
                    style={[s.fulfillBtn, fulfillment === f && s.fulfillBtnActive]}
                  >
                    <Text style={[s.fulfillLabel, fulfillment === f && s.fulfillLabelActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Button
                title={orderMut.isPending ? 'Placing order…' : 'Confirm Order'}
                variant="primary"
                disabled={orderMut.isPending}
                onPress={() => selected && orderMut.mutate({ itemId: selected.id, fulfillment })}
              />
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
}

function ActiveOrderCard({ order, onCancel, cancelling }: { order: FoodOrder; onCancel: () => void; cancelling: boolean }) {
  return (
    <Card style={s.activeCard}>
      <View style={s.orderRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.orderName}>{order.itemName}</Text>
          <Text style={s.orderMeta}>{order.fulfillment} · {formatCurrency(order.total)}</Text>
        </View>
        <Badge label={order.status} tone={statusTone(order.status)} />
      </View>
      {order.canCancel && (
        <Button title={cancelling ? 'Cancelling…' : 'Cancel'} variant="ghost" disabled={cancelling} onPress={onCancel} />
      )}
    </Card>
  );
}

function ItemCard({ item, onOrder }: { item: FoodItem; onOrder: () => void }) {
  // Backend field: item.img (not item.imageUrl), item.name (not item.itemName)
  return (
    <Card style={s.itemCard}>
      {item.img ? (
        <Image source={{ uri: item.img }} style={s.itemImg} contentFit="cover" />
      ) : (
        <View style={[s.itemImg, s.itemImgPh]}>
          <Text style={{ fontSize: 32 }}>🍽</Text>
        </View>
      )}
      <View style={s.itemBody}>
        <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
        {item.kitchen ? <Text style={s.itemKitchen}>{item.kitchen}</Text> : null}
        <Text style={s.itemPrice}>{formatCurrency(item.price)}</Text>
        <Button title="Order" variant="primary" onPress={onOrder} />
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxxl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  cell: { flex: 1, padding: spacing.xs },
  itemCard: { flex: 1, padding: 0, overflow: 'hidden' },
  itemImg: { width: '100%', height: 110, backgroundColor: colors.neutralSoft },
  itemImgPh: { alignItems: 'center', justifyContent: 'center' },
  itemBody: { padding: spacing.sm, gap: spacing.xs },
  itemName: { ...typography.label, fontSize: 13 },
  itemKitchen: { ...typography.caption, color: colors.textSecondary },
  itemPrice: { ...typography.headingSmall, color: colors.secondary },
  activeCard: { marginBottom: spacing.sm, gap: spacing.sm },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  orderName: { ...typography.label },
  orderMeta: { ...typography.caption, color: colors.textSecondary },
  sheet: { padding: spacing.xl, gap: spacing.md },
  sheetTitle: { ...typography.headingMedium },
  sheetPrice: { ...typography.body, color: colors.secondary },
  sheetKitchen: { ...typography.caption, color: colors.textSecondary },
  sheetLabel: { ...typography.label, marginTop: spacing.sm },
  fulfillRow: { flexDirection: 'row', gap: spacing.sm },
  fulfillBtn: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
  },
  fulfillBtnActive: { borderColor: colors.secondary, backgroundColor: '#F0FDF4' },
  fulfillLabel: { ...typography.label, color: colors.textSecondary },
  fulfillLabelActive: { color: colors.secondary },
});
