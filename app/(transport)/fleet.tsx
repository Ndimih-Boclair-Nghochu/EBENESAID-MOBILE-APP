import { CrudListScreen } from '@/src/features/partner/screens';

export default function TransportFleetScreen() {
  return (
    <CrudListScreen
      portalName="Transport Portal"
      title="Fleet"
      subtitle="Manage registered transport vehicles."
      getEndpoint="/api/transport/fleet"
      listKeys={['fleet', 'vehicles']}
      deleteEnabled={false}
      fields={[
        { key: 'registration', label: 'Registration' },
        { key: 'type', label: 'Type' },
        { key: 'capacity', label: 'Capacity', type: 'number' },
        { key: 'status', label: 'Status' }
      ]}
      card={{
        titleKey: 'registration',
        subtitleKeys: ['type'],
        metaKeys: ['capacity'],
        statusKey: 'status'
      }}
    />
  );
}

