import { SummaryScreen } from '@/src/features/partner/screens';

export default function UniversitySummaryScreen() {
  return (
    <SummaryScreen
      portalName="University Portal"
      subtitle="Students, applications, and active programs."
      endpoint="/api/university/summary"
      showAssistant
      metrics={[
        { label: 'Enrolled Students', key: 'enrolledStudents', format: 'number' },
        { label: 'Pending Applications', key: 'pendingApplications', format: 'number' },
        { label: 'Active Programs', key: 'activePrograms', format: 'number' }
      ]}
    />
  );
}

