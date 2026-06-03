import { ReadOnlyListScreen } from '@/src/features/partner/screens';

export default function AdminReportsScreen() {
  return (
    <ReadOnlyListScreen
      portalName="Admin"
      title="Reports"
      subtitle="Operational reports requiring attention."
      endpoint="/api/admin/reports"
      listKeys={['reports', 'items', 'alerts']}
      item={{
        titleKey: 'title',
        subtitleKeys: ['description', 'action'],
        metaKeys: ['count'],
        statusKey: 'status',
        icon: 'document-text-outline'
      }}
    />
  );
}
