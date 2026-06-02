import { PartnerTabsLayout } from '@/src/features/partner/screens';

export default function StaffLayout() {
  return (
    <PartnerTabsLayout
      tabs={[
        { name: 'index', title: 'Dashboard', activeIcon: 'stats-chart', inactiveIcon: 'stats-chart-outline' },
        { name: 'users', title: 'Users', activeIcon: 'people', inactiveIcon: 'people-outline' },
        { name: 'support', title: 'Support', activeIcon: 'chatbubbles', inactiveIcon: 'chatbubbles-outline' },
        { name: 'reports', title: 'Reports', activeIcon: 'document-text', inactiveIcon: 'document-text-outline' },
        { name: 'profile', title: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' }
      ]}
    />
  );
}

