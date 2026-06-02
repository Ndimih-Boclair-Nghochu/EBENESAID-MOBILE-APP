import { CrudListScreen } from '@/src/features/partner/screens';

export default function AdminSchoolsScreen() {
  return (
    <CrudListScreen
      portalName="Admin"
      title="Schools"
      subtitle="University partner management."
      getEndpoint="/api/admin/schools"
      listKeys={['schools', 'institutions']}
      deleteEnabled={false}
      fields={[
        { key: 'schoolName', label: 'School name' },
        { key: 'country', label: 'Country' },
        { key: 'city', label: 'City' },
        { key: 'website', label: 'Website' },
        { key: 'active', label: 'Active', type: 'switch' }
      ]}
      card={{
        titleKey: 'schoolName',
        subtitleKeys: ['city', 'country'],
        metaKeys: ['website'],
        statusKey: 'status'
      }}
    />
  );
}
