import { ReadOnlyListScreen } from '@/src/features/partner/screens';

export default function AdminSupportScreen() {
  return (
    <ReadOnlyListScreen
      portalName="Admin"
      title="Support Queue"
      subtitle="All open support tickets by recent activity."
      endpoint="/api/admin/support"
      listKeys={['tickets', 'support']}
      item={{
        titleKey: 'userName',
        subtitleKeys: ['lastMessage'],
        metaKeys: ['updatedAt', 'timestamp'],
        statusKey: 'status',
        icon: 'chatbubbles-outline'
      }}
    />
  );
}
