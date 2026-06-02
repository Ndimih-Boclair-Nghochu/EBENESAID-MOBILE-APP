import { CrudListScreen } from '@/src/features/partner/screens';

export default function SupplierMenuScreen() {
  return (
    <CrudListScreen
      portalName="Supplier Portal"
      title="Menu"
      subtitle="Manage food items and availability."
      getEndpoint="/api/supplier/menu"
      listKeys={['menu', 'items']}
      numColumns={2}
      toggleKey="available"
      fields={[
        { key: 'itemName', label: 'Name' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'price', label: 'Price', type: 'number' },
        { key: 'category', label: 'Category' },
        { key: 'imageUrl', label: 'Image URL' },
        { key: 'available', label: 'Available', type: 'switch' }
      ]}
      card={{
        titleKey: 'itemName',
        subtitleKeys: ['category'],
        descriptionKey: 'description',
        imageKey: 'imageUrl',
        valueKey: 'price',
        valuePrefix: 'EUR '
      }}
    />
  );
}

