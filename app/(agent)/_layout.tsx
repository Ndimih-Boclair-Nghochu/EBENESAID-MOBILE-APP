import { PartnerTabsLayout } from '@/src/features/partner/screens';

export default function AgentLayout() {
  return (
    <PartnerTabsLayout
      tabs={[
        { name: 'index', title: 'Summary', activeIcon: 'stats-chart', inactiveIcon: 'stats-chart-outline' },
        { name: 'listings', title: 'Listings', activeIcon: 'business', inactiveIcon: 'business-outline' },
        { name: 'bookings', title: 'Bookings', activeIcon: 'calendar', inactiveIcon: 'calendar-outline' },
        { name: 'leads', title: 'Leads', activeIcon: 'mail-unread', inactiveIcon: 'mail-unread-outline' },
        { name: 'verification', title: 'Verify', activeIcon: 'shield-checkmark', inactiveIcon: 'shield-checkmark-outline' },
        { name: 'profile', title: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' }
      ]}
    />
  );
}

