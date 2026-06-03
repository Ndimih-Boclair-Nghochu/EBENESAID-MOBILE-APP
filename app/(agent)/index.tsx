import { SummaryScreen } from '@/src/features/partner/screens';

export default function AgentSummaryScreen() {
  return (
    <SummaryScreen
      portalName="Agent Portal"
      subtitle="Listings, enquiries, bookings, and revenue."
      endpoint="/api/agent/summary"
      showAssistant
      metrics={[
        { label: 'Total Listings', key: 'totalListings', format: 'number' },
        { label: 'Active Enquiries', key: 'totalEnquiries', format: 'number' },
        { label: 'Confirmed Bookings', key: 'totalBookings', format: 'number' },
        { label: 'Revenue', key: 'revenueEstimate', format: 'currency' }
      ]}
    />
  );
}

