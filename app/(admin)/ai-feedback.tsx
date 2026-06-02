import { ReadOnlyListScreen } from '@/src/features/partner/screens';

export default function AdminAIFeedbackScreen() {
  return (
    <ReadOnlyListScreen
      portalName="Admin"
      title="AI Feedback"
      subtitle="Review user feedback on AI assistant responses."
      endpoint="/api/admin/ai-feedback"
      listKeys={['feedback', 'items']}
      item={{
        titleKey: 'userEmail',
        subtitleKeys: ['message', 'rating'],
        metaKeys: ['createdAt'],
        statusKey: 'status',
        icon: 'chatbox-ellipses-outline'
      }}
    />
  );
}
