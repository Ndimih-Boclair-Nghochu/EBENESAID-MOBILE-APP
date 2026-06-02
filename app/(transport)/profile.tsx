import { ProfileFormScreen } from '@/src/features/partner/screens';

export default function TransportProfileScreen() {
  return (
    <ProfileFormScreen
      portalName="Transport Profile"
      subtitle="Operator details and dispatch contacts."
      endpoint="/api/transport/profile"
      fields={[
        { key: 'businessName', label: 'Business name' },
        { key: 'contactPerson', label: 'Contact person' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'serviceArea', label: 'Service area' }
      ]}
    />
  );
}

