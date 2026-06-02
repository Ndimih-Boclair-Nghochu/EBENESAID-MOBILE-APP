import { ReadOnlyListScreen } from '@/src/features/partner/screens';

export default function AgentBookingsScreen() {
  return (
    <ReadOnlyListScreen
      portalName="Agent Portal"
      title="Bookings"
      subtitle="Enquiries and bookings grouped by status."
      endpoint="/api/agent/bookings"
      listKeys={['bookings', 'enquiries', 'requests']}
      tabs={[
        { label: 'Pending', value: 'pending', key: 'status' },
        { label: 'Confirmed', value: 'confirmed', key: 'status' },
        { label: 'Cancelled', value: 'cancelled', key: 'status', matches: ['cancelled', 'canceled'] }
      ]}
      item={{
        titleKey: 'requesterName',
        subtitleKeys: ['listingTitle', 'requestType'],
        metaKeys: ['createdAt'],
        statusKey: 'status',
        icon: 'calendar-outline'
      }}
    />
  );
}

