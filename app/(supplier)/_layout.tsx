import { PartnerTabsLayout } from '@/src/features/partner/screens';

export default function SupplierLayout() {
  return (
    <PartnerTabsLayout
      tabs={[
        { name: 'index', title: 'Summary', activeIcon: 'stats-chart', inactiveIcon: 'stats-chart-outline' },
        { name: 'menu', title: 'Menu', activeIcon: 'restaurant', inactiveIcon: 'restaurant-outline' },
        { name: 'orders', title: 'Orders', activeIcon: 'receipt', inactiveIcon: 'receipt-outline' },
        { name: 'payouts', title: 'Payouts', activeIcon: 'wallet', inactiveIcon: 'wallet-outline' },
        { name: 'profile', title: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' }
      ]}
    />
  );
}

