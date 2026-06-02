import { TableScreen, formatDate, formatValue, getString, type PartnerRecord } from '@/src/features/partner/screens';

export default function TransportRevenueScreen() {
  return (
    <TableScreen
      portalName="Revenue"
      subtitle="Revenue breakdown by period."
      endpoint="/api/transport/revenue"
      listKeys={['revenue', 'breakdown', 'periods']}
      headers={['Period', 'Revenue', 'Trips', 'Notes']}
      row={(record: PartnerRecord) => [
        getString(record, 'period', formatDate(record.date)),
        formatValue(record.revenue ?? record.amount, 'currency'),
        formatValue(record.trips, 'number'),
        getString(record, 'notes')
      ]}
    />
  );
}

