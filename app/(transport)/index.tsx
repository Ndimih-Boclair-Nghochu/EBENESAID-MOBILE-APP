import { SummaryScreen } from '@/src/features/partner/screens';

export default function TransportSummaryScreen() {
  return (
    <SummaryScreen
      portalName="Transport Portal"
      subtitle="Trips, pickups, fleet, and revenue."
      endpoint="/api/transport/summary"
      revenueRoute="/(transport)/revenue"
      showAssistant
      metrics={[
        { label: 'Trips Today', key: 'tripsToday', format: 'number' },
        { label: 'Revenue', key: 'revenue', format: 'currency' },
        { label: 'Fleet Size', key: 'fleetSize', format: 'number' },
        { label: 'Pending Pickups', key: 'pendingPickups', format: 'number' }
      ]}
    />
  );
}

