import { SummaryScreen } from '@/src/features/partner/screens';

export default function SupplierSummaryScreen() {
  return (
    <SummaryScreen
      portalName="Supplier Portal"
      subtitle="Orders, revenue, pending work, and menu health."
      endpoint="/api/supplier/summary"
      metrics={[
        { label: 'Total Orders', key: 'totalOrders', format: 'number' },
        { label: 'Revenue', key: 'revenue', format: 'currency' },
        { label: 'Pending', key: 'pending', format: 'number' },
        { label: 'Menu Items', key: 'menuItems', format: 'number' }
      ]}
    />
  );
}

