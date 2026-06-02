import { PartnerTabsLayout } from '@/src/features/partner/screens';

export default function JobPartnerLayout() {
  return (
    <PartnerTabsLayout
      tabs={[
        { name: 'index', title: 'Summary', activeIcon: 'stats-chart', inactiveIcon: 'stats-chart-outline' },
        { name: 'jobs', title: 'Jobs', activeIcon: 'briefcase', inactiveIcon: 'briefcase-outline' },
        { name: 'applicants', title: 'Applicants', activeIcon: 'people', inactiveIcon: 'people-outline' },
        { name: 'profile', title: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' }
      ]}
    />
  );
}

