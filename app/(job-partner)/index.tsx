import { SummaryScreen } from '@/src/features/partner/screens';

export default function JobPartnerSummaryScreen() {
  return (
    <SummaryScreen
      portalName="Job Partner Portal"
      subtitle="Posted jobs, applicants, and hiring outcomes."
      endpoint="/api/job-partner/summary"
      showAssistant
      metrics={[
        { label: 'Active Jobs', key: 'activeJobs', format: 'number' },
        { label: 'Total Applicants', key: 'applications', format: 'number' },
        { label: 'Hired Count', key: 'hired', format: 'number' }
      ]}
    />
  );
}

