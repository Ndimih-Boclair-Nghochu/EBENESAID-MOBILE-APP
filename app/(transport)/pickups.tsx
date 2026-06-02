import { ReadOnlyListScreen } from '@/src/features/partner/screens';

export default function TransportPickupsScreen() {
  return (
    <ReadOnlyListScreen
      portalName="Transport Portal"
      title="Pickups"
      subtitle="Student transport requests sorted by travel date."
      endpoint="/api/transport/pickups"
      listKeys={['pickups', 'requests']}
      item={{
        titleKey: 'studentName',
        subtitleKeys: ['origin', 'destination', 'travelType'],
        metaKeys: ['travelDate', 'travelTime', 'passengerCount'],
        statusKey: 'status',
        icon: 'navigate-outline'
      }}
    />
  );
}

