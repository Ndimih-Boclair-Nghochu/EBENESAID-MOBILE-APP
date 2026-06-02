import { CrudListScreen } from '@/src/features/partner/screens';

export default function AdminCommunityCirclesScreen() {
  return (
    <CrudListScreen
      portalName="Admin"
      title="Community Circles"
      subtitle="Manage circle requests and active circles."
      getEndpoint="/api/admin/community-circles"
      listKeys={['circles', 'requests']}
      deleteEnabled={false}
      fields={[
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'status', label: 'Status' },
        { key: 'active', label: 'Active', type: 'switch' }
      ]}
      card={{
        titleKey: 'name',
        descriptionKey: 'description',
        metaKeys: ['memberCount'],
        statusKey: 'status'
      }}
    />
  );
}
