import { CrudListScreen } from '@/src/features/partner/screens';

export default function AdminCommissionsScreen() {
  return (
    <CrudListScreen
      portalName="Admin"
      title="Commissions"
      subtitle="Platform pricing and partner commission overrides."
      getEndpoint="/api/admin/commissions"
      mutateEndpoint="/api/admin/commissions"
      listKeys={['commissions', 'overrides', 'items']}
      fields={[
        { key: 'partnerId', label: 'Partner ID', type: 'number' },
        { key: 'partnerType', label: 'Partner type' },
        { key: 'rate', label: 'Commission rate', type: 'number' },
        { key: 'serviceFee', label: 'Service fee', type: 'number' }
      ]}
      card={{
        titleKey: 'partnerName',
        subtitleKeys: ['partnerType'],
        valueKey: 'rate',
        valuePrefix: 'Rate ',
        statusKey: 'status'
      }}
    />
  );
}
