import { ReadOnlyListScreen } from '@/src/features/partner/screens';

export default function AdminHousingScreen() {
  return (
    <ReadOnlyListScreen
      portalName="Admin"
      title="Housing Admin"
      subtitle="All listings, enquiries, and bookings."
      endpoint="/api/admin/housing"
      listKeys={['listings', 'enquiries', 'bookings']}
      tabs={[
        { label: 'Pending', value: 'pending', key: 'status' },
        { label: 'Active', value: 'active', key: 'status' },
        { label: 'Rejected', value: 'rejected', key: 'status' },
        { label: 'Confirmed', value: 'confirmed', key: 'status' }
      ]}
      item={{
        titleKey: 'title',
        subtitleKeys: ['listingTitle', 'location', 'requesterName'],
        metaKeys: ['type', 'createdAt'],
        statusKey: 'status',
        icon: 'business-outline'
      }}
    />
  );
}
