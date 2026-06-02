import { ReadOnlyListScreen } from '@/src/features/partner/screens';

export default function UniversityApplicationsScreen() {
  return (
    <ReadOnlyListScreen
      portalName="University Portal"
      title="Applications"
      subtitle="Student applications by program and status."
      endpoint="/api/university/applications"
      listKeys={['applications']}
      item={{
        titleKey: 'studentName',
        subtitleKeys: ['programName', 'program'],
        metaKeys: ['appliedAt'],
        statusKey: 'status',
        icon: 'document-text-outline'
      }}
      tabs={[
        { label: 'Pending', value: 'pending', key: 'status' },
        { label: 'Accepted', value: 'accepted', key: 'status' },
        { label: 'Rejected', value: 'rejected', key: 'status' },
        { label: 'Waitlisted', value: 'waitlisted', key: 'status' }
      ]}
    />
  );
}

