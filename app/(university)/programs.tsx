import { CrudListScreen } from '@/src/features/partner/screens';

export default function UniversityProgramsScreen() {
  return (
    <CrudListScreen
      portalName="University Portal"
      title="Programs"
      subtitle="Create and update school program offerings."
      getEndpoint="/api/university/programs"
      listKeys={['programs']}
      deleteEnabled={false}
      toggleKey="applicationOpen"
      fields={[
        { key: 'programName', label: 'Program name' },
        { key: 'duration', label: 'Duration' },
        { key: 'language', label: 'Language' },
        { key: 'startDate', label: 'Start date' },
        { key: 'tuitionFee', label: 'Tuition fee', type: 'number' },
        { key: 'currency', label: 'Currency' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'applicationOpen', label: 'Application open', type: 'switch' }
      ]}
      card={{
        titleKey: 'programName',
        subtitleKeys: ['duration', 'language', 'startDate'],
        descriptionKey: 'description',
        metaKeys: ['applicantCount'],
        valueKey: 'tuitionFee'
      }}
    />
  );
}

