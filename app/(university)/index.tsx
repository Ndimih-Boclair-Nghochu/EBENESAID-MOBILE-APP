import { SummaryScreen } from '@/src/features/partner/screens';

export default function UniversitySummaryScreen() {
  return (
    <SummaryScreen
      portalName="University Portal"
      subtitle="Students, applications, and active programs."
      endpoint="/api/university/summary"
      showAssistant
      metrics={[
        { label: 'Applications', key: 'applications', format: 'number' },
        { label: 'Pending Applications', key: 'pending', format: 'number' },
        { label: 'Active Programs', key: 'activePrograms', format: 'number' }
      ]}
    />
  );
}

