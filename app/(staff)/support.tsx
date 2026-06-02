import { ReadOnlyListScreen } from '@/src/features/partner/screens';

export default function StaffSupportScreen() {
  return (
    <ReadOnlyListScreen
      portalName="Staff Dashboard"
      title="Support"
      subtitle="Open support tickets and recent messages."
      endpoint="/api/admin/support"
      listKeys={['tickets', 'support']}
      item={{
        titleKey: 'userName',
        subtitleKeys: ['lastMessage'],
        metaKeys: ['timestamp', 'updatedAt'],
        statusKey: 'status',
        icon: 'chatbubbles-outline'
      }}
    />
  );
}

