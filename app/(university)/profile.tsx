import { ProfileFormScreen } from '@/src/features/partner/screens';

export default function UniversityProfileScreen() {
  return (
    <ProfileFormScreen
      portalName="University Profile"
      subtitle="Institution details and admissions contact."
      endpoint="/api/university/profile"
      fields={[
        { key: 'schoolName', label: 'School name' },
        { key: 'contactPerson', label: 'Contact person' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'website', label: 'Website' }
      ]}
    />
  );
}

