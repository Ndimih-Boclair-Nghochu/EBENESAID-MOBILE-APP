import { CrudListScreen } from '@/src/features/partner/screens';

export default function TransportServicesScreen() {
  return (
    <CrudListScreen
      portalName="Transport Portal"
      title="Services"
      subtitle="Offer transport service types and pricing."
      getEndpoint="/api/transport/services"
      listKeys={['services']}
      deleteEnabled={false}
      toggleKey="active"
      fields={[
        { key: 'serviceType', label: 'Service type', placeholder: 'airport_pickup / city_transfer / intercity / custom' },
        { key: 'price', label: 'Price', type: 'number' },
        { key: 'active', label: 'Active', type: 'switch' }
      ]}
      card={{
        titleKey: 'serviceType',
        valueKey: 'price',
        valuePrefix: 'EUR ',
        statusKey: 'status'
      }}
    />
  );
}

