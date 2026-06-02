import { PartnerTabsLayout } from '@/src/features/partner/screens';

export default function TransportLayout() {
  return (
    <PartnerTabsLayout
      hiddenScreens={['revenue']}
      tabs={[
        { name: 'index', title: 'Summary', activeIcon: 'stats-chart', inactiveIcon: 'stats-chart-outline' },
        { name: 'fleet', title: 'Fleet', activeIcon: 'car', inactiveIcon: 'car-outline' },
        { name: 'pickups', title: 'Pickups', activeIcon: 'navigate', inactiveIcon: 'navigate-outline' },
        { name: 'services', title: 'Services', activeIcon: 'map', inactiveIcon: 'map-outline' },
        { name: 'profile', title: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' }
      ]}
    />
  );
}
