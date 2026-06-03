import { ReadOnlyListScreen } from '@/src/features/partner/screens';

export default function UniversityStudentsScreen() {
  return (
    <ReadOnlyListScreen
      portalName="University Portal"
      title="Students"
      subtitle="Enrolled student registry and progress."
      endpoint="/api/university/summary"
      listKeys={['students', 'enrolledStudentsList', 'registry']}
      searchKeys={['firstName', 'lastName', 'email', 'countryOfOrigin']}
      item={{
        titleKey: 'fullName',
        subtitleKeys: ['email', 'countryOfOrigin'],
        metaKeys: ['completedTasks', 'totalTasks'],
        statusKey: 'status',
        icon: 'people-outline'
      }}
    />
  );
}
