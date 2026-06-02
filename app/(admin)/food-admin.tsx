import { ReadOnlyListScreen } from '@/src/features/partner/screens';

export default function AdminFoodScreen() {
  return (
    <ReadOnlyListScreen
      portalName="Admin"
      title="Food Admin"
      subtitle="Orders across all suppliers with timeline metadata."
      endpoint="/api/admin/food"
      listKeys={['orders']}
      searchKeys={['supplierName', 'studentName', 'itemName', 'status']}
      item={{
        titleKey: 'itemName',
        subtitleKeys: ['supplierName', 'studentName', 'fulfillment'],
        metaKeys: ['createdAt', 'timeline'],
        statusKey: 'status',
        icon: 'restaurant-outline'
      }}
    />
  );
}
