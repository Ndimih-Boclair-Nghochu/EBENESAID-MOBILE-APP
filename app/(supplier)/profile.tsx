import { ProfileFormScreen } from '@/src/features/partner/screens';

export default function SupplierProfileScreen() {
  return (
    <ProfileFormScreen
      portalName="Supplier Profile"
      subtitle="Supplier account and payout contact details."
      endpoint="/api/supplier/profile"
      fields={[
        { key: 'businessName', label: 'Business name' },
        { key: 'contactPerson', label: 'Contact person' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'address', label: 'Address' }
      ]}
    />
  );
}

