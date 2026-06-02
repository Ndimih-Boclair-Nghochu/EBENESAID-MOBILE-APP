import { CrudListScreen } from '@/src/features/partner/screens';

export default function AdminTaskTemplatesScreen() {
  return (
    <CrudListScreen
      portalName="Admin"
      title="Task Templates"
      subtitle="Relocation task checklist management."
      getEndpoint="/api/admin/task-templates"
      listKeys={['templates', 'tasks']}
      deleteEnabled={false}
      fields={[
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'order', label: 'Order', type: 'number' },
        { key: 'required', label: 'Required', type: 'switch' }
      ]}
      card={{
        titleKey: 'title',
        descriptionKey: 'description',
        metaKeys: ['order'],
        statusKey: 'status'
      }}
    />
  );
}
