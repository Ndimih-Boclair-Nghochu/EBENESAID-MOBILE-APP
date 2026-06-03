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
        { label: 'Total Bookings', key: 'totalBookings', format: 'number' },
        { label: 'Revenue', key: 'revenue', format: 'currency' },
        { label: 'Services', key: 'totalServices', format: 'number' },
        { label: 'Pending Pickups', key: 'pendingBookings', format: 'number' }
      ]}
    />
  );
}

