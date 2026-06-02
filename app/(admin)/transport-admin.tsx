import { ReadOnlyListScreen } from '@/src/features/partner/screens';

export default function AdminTransportScreen() {
  return (
    <ReadOnlyListScreen
      portalName="Admin"
      title="Transport Admin"
      subtitle="Transport partners and pickup requests."
      endpoint="/api/admin/transport"
      listKeys={['partners', 'pickups', 'requests']}
      item={{
        titleKey: 'businessName',
        subtitleKeys: ['studentName', 'origin', 'destination', 'travelType'],
        metaKeys: ['travelDate', 'travelTime', 'passengerCount'],
        statusKey: 'status',
        icon: 'car-outline'
      }}
    />
  );
}
