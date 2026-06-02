import { SummaryScreen } from '@/src/features/partner/screens';

export default function StaffDashboardScreen() {
  return (
    <SummaryScreen
      portalName="Staff Dashboard"
      subtitle="Platform stats and operations overview."
      endpoint="/api/staff/summary"
      metrics={[
        { label: 'Users', key: 'users', format: 'number' },
        { label: 'Open Tickets', key: 'openTickets', format: 'number' },
        { label: 'Listings', key: 'listings', format: 'number' },
        { label: 'Orders', key: 'orders', format: 'number' }
      ]}
    />
  );
}

