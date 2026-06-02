import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

interface TabBarIconProps {
  focused: boolean;
  activeName: IconName;
  inactiveName: IconName;
  color: string;
  size: number;
}

export function TabBarIcon({
  focused,
  activeName,
  inactiveName,
  color,
  size
}: TabBarIconProps) {
  return <Ionicons name={focused ? activeName : inactiveName} color={color} size={size} />;
}

