import { PartnerTabsLayout } from '@/src/features/partner/screens';

export default function AdminLayout() {
  return (
    <PartnerTabsLayout
      hiddenScreens={[
        'user-detail',
        'housing-admin',
        'food-admin',
        'transport-admin',
        'verification',
        'support',
        'finance',
        'schools',
        'audit-logs',
        'ai-knowledge',
        'ai-feedback',
        'community-circles',
        'task-templates'
      ]}
      tabs={[
        { name: 'index', title: 'Dashboard', activeIcon: 'stats-chart', inactiveIcon: 'stats-chart-outline' },
        { name: 'users', title: 'Users', activeIcon: 'people', inactiveIcon: 'people-outline' },
        { name: 'operations', title: 'Operations', activeIcon: 'settings', inactiveIcon: 'settings-outline' },
        { name: 'content', title: 'Content', activeIcon: 'create', inactiveIcon: 'create-outline' },
        { name: 'settings', title: 'Settings', activeIcon: 'person', inactiveIcon: 'person-outline' }
      ]}
    />
  );
}
