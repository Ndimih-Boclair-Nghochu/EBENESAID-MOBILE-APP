import { CrudListScreen } from '@/src/features/partner/screens';

export default function JobPartnerJobsScreen() {
  return (
    <CrudListScreen
      portalName="Job Partner Portal"
      title="Jobs"
      subtitle="Create and maintain job postings."
      getEndpoint="/api/job-partner/jobs"
      listKeys={['jobs']}
      fields={[
        { key: 'title', label: 'Title' },
        { key: 'company', label: 'Company' },
        { key: 'location', label: 'Location' },
        { key: 'type', label: 'Type', placeholder: 'full-time / part-time / internship / remote' },
        { key: 'salary', label: 'Salary' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'requirements', label: 'Requirements', type: 'textarea' }
      ]}
      card={{
        titleKey: 'title',
        subtitleKeys: ['company', 'location', 'type'],
        descriptionKey: 'description',
        metaKeys: ['applicantCount'],
        statusKey: 'status',
        valueKey: 'salary'
      }}
    />
  );
}

