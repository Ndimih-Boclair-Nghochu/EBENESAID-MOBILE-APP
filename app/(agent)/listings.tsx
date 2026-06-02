import { CrudListScreen } from '@/src/features/partner/screens';

export default function AgentListingsScreen() {
  return (
    <CrudListScreen
      portalName="Agent Portal"
      title="Listings"
      subtitle="Manage properties submitted to EBENESAID."
      getEndpoint="/api/agent/listings"
      mutateEndpoint="/api/listings"
      listKeys={['listings']}
      createDefaults={{ status: 'Pending' }}
      fields={[
        { key: 'title', label: 'Title' },
        { key: 'location', label: 'Location' },
        { key: 'type', label: 'Type', placeholder: 'Studio / 1BR / 2BR / 3BR / Shared / Other' },
        { key: 'price', label: 'Price', type: 'number' },
        { key: 'details', label: 'Details', type: 'textarea' },
        { key: 'imageUrl', label: 'Image URL', placeholder: 'TODO: image picker' }
      ]}
      card={{
        titleKey: 'title',
        subtitleKeys: ['location', 'type'],
        descriptionKey: 'details',
        imageKey: 'imageUrl',
        statusKey: 'status',
        valueKey: 'price',
        valuePrefix: 'EUR '
      }}
    />
  );
}

