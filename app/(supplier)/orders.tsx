import { ReadOnlyListScreen } from '@/src/features/partner/screens';

export default function SupplierOrdersScreen() {
  return (
    <ReadOnlyListScreen
      portalName="Supplier Portal"
      title="Orders"
      subtitle="Active and historical student food orders."
      endpoint="/api/supplier/orders"
      listKeys={['orders']}
      tabs={[
        { label: 'Active', value: 'active', key: 'status', matches: ['pending', 'confirmed', 'preparing', 'ready'] },
        { label: 'History', value: 'history', key: 'status', matches: ['delivered', 'cancelled', 'canceled'] }
      ]}
      item={{
        titleKey: 'studentName',
        subtitleKeys: ['itemName', 'fulfillment'],
        metaKeys: ['total', 'createdAt'],
        statusKey: 'status',
        icon: 'receipt-outline'
      }}
    />
  );
}

