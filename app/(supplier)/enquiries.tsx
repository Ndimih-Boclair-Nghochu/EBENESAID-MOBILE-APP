import { ReadOnlyListScreen } from '@/src/features/partner/screens';

export default function SupplierEnquiriesScreen() {
  return (
    <ReadOnlyListScreen
      portalName="Supplier Portal"
      title="Enquiries"
      subtitle="Customer questions about menu items."
      endpoint="/api/supplier/enquiries"
      listKeys={['enquiries', 'messages', 'items']}
      searchKeys={['customerName', 'itemName', 'message', 'status']}
      item={{
        titleKey: 'customerName',
        subtitleKeys: ['itemName', 'message'],
        metaKeys: ['createdAt'],
        statusKey: 'status',
        icon: 'chatbubbles-outline'
      }}
    />
  );
}
