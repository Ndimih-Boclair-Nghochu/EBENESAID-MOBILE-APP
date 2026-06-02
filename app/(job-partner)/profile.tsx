import { ProfileFormScreen } from '@/src/features/partner/screens';

export default function JobPartnerProfileScreen() {
  return (
    <ProfileFormScreen
      portalName="Job Partner Profile"
      subtitle="Employer profile and contact details."
      endpoint="/api/job-partner/profile"
      fields={[
        { key: 'company', label: 'Company' },
        { key: 'contactPerson', label: 'Contact person' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'website', label: 'Website' }
      ]}
    />
  );
}

