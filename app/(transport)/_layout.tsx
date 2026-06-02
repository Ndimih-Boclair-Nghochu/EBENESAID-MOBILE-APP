import { Stack } from 'expo-router';

import { colors } from '@/src/constants';

export default function TransportLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}

