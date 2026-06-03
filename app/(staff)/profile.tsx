import { ProfileFormScreen } from '@/src/features/partner/screens';

export default function StaffProfileScreen() {
  return (
    <ProfileFormScreen
      portalName="Staff Profile"
      subtitle="Staff account and contact details."
      endpoint="/api/auth/me"
      saveEnabled={false}
      fields={[
        { key: 'firstName', label: 'First name' },
        { key: 'lastName', label: 'Last name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'department', label: 'Department' }
      ]}
    />
  );
}

