import { ReadOnlyListScreen } from '@/src/features/partner/screens';

export default function JobPartnerApplicantsScreen() {
  return (
    <ReadOnlyListScreen
      portalName="Job Partner Portal"
      title="Applicants"
      subtitle="Review applicants grouped by posted job."
      endpoint="/api/job-partner/applicants"
      listKeys={['applicants', 'applications']}
      searchKeys={['name', 'email', 'jobTitle', 'title']}
      item={{
        titleKey: 'name',
        subtitleKeys: ['email', 'jobTitle', 'title'],
        metaKeys: ['appliedAt'],
        statusKey: 'status',
        icon: 'person-outline'
      }}
    />
  );
}

