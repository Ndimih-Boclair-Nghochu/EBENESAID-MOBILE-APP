import { ProfileFormScreen } from '@/src/features/partner/screens';

export default function InvestorProfileScreen() {
  return (
    <ProfileFormScreen
      portalName="Investor Profile"
      subtitle="Investor account details."
      endpoint="/api/auth/me"
      saveEnabled={false}
      fields={[
        { key: 'firstName', label: 'First name' },
        { key: 'lastName', label: 'Last name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'organization', label: 'Organization' }
      ]}
    />
  );
}

