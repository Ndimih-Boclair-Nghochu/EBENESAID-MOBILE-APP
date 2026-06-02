import { Stack } from 'expo-router';

import { colors } from '@/src/constants';

export default function AgentLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}

