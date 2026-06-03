import { PartnerTabsLayout } from '@/src/features/partner/screens';

export default function UniversityLayout() {
  return (
    <PartnerTabsLayout
      tabs={[
        { name: 'index', title: 'Summary', activeIcon: 'stats-chart', inactiveIcon: 'stats-chart-outline' },
        { name: 'programs', title: 'Programs', activeIcon: 'school', inactiveIcon: 'school-outline' },
        { name: 'applications', title: 'Applications', activeIcon: 'document-text', inactiveIcon: 'document-text-outline' },
        { name: 'students', title: 'Students', activeIcon: 'people', inactiveIcon: 'people-outline' },
        { name: 'verification', title: 'Verify', activeIcon: 'shield-checkmark', inactiveIcon: 'shield-checkmark-outline' },
        { name: 'ai-chat', title: 'Messages', activeIcon: 'chatbubbles', inactiveIcon: 'chatbubbles-outline' },
        { name: 'profile', title: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' }
      ]}
    />
  );
}

