import { ProfileFormScreen } from '@/src/features/partner/screens';

export default function AgentProfileScreen() {
  return (
    <ProfileFormScreen
      portalName="Agent Profile"
      subtitle="Business identity and contact details."
      endpoint="/api/agent/profile"
      profileImageRole="agent"
      profileImageField="logoUrl"
      fields={[
        { key: 'businessName', label: 'Business name' },
        { key: 'contactPerson', label: 'Contact person' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'website', label: 'Website' }
      ]}
    />
  );
}

