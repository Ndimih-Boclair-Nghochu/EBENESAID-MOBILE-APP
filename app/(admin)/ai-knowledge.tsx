import { CrudListScreen } from '@/src/features/partner/screens';

export default function AdminAIKnowledgeScreen() {
  return (
    <CrudListScreen
      portalName="Admin"
      title="AI Knowledge"
      subtitle="Knowledge base entries for assistant responses."
      getEndpoint="/api/admin/ai-knowledge"
      listKeys={['entries', 'knowledge']}
      deleteEnabled={false}
      editEnabled={false}
      fields={[
        { key: 'title', label: 'Title' },
        { key: 'content', label: 'Content', type: 'textarea' },
        { key: 'category', label: 'Category' }
      ]}
      card={{
        titleKey: 'title',
        subtitleKeys: ['category'],
        descriptionKey: 'content'
      }}
    />
  );
}
