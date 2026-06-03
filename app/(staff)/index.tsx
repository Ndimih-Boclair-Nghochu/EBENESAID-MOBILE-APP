import { SummaryScreen } from '@/src/features/partner/screens';

export default function StaffDashboardScreen() {
  return (
    <SummaryScreen
      portalName="Staff Dashboard"
      subtitle="Platform stats and operations overview."
      endpoint="/api/staff/summary"
      metrics={[
        { label: 'Students', key: 'activeStudents', format: 'number' },
        { label: 'Support Threads', key: 'supportThreads', format: 'number' },
        { label: 'Pending Verifications', key: 'pendingVerifications', format: 'number' },
        { label: 'Active Orders', key: 'activeOrders', format: 'number' }
      ]}
    />
  );
}

