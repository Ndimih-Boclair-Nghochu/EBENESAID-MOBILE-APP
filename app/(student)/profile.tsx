import { StudentTabPlaceholder } from '@/src/components/layout/StudentTabPlaceholder';

export default function StudentProfileScreen() {
  return (
    <StudentTabPlaceholder
      title="Profile"
      subtitle="Account details"
      icon="person-outline"
      showLogout
    />
  );
}

