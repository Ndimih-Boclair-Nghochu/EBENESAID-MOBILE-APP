import { Tabs } from 'expo-router';

import { TabBarIcon } from '@/src/components/layout/TabBarIcon';
import { colors } from '@/src/constants';

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 12,
          paddingTop: 10
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              activeName="home"
              inactiveName="home-outline"
              color={color}
              size={size}
            />
          )
        }}
      />
      <Tabs.Screen
        name="housing"
        options={{
          title: 'Housing',
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              activeName="business"
              inactiveName="business-outline"
              color={color}
              size={size}
            />
          )
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              activeName="briefcase"
              inactiveName="briefcase-outline"
              color={color}
              size={size}
            />
          )
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              activeName="people"
              inactiveName="people-outline"
              color={color}
              size={size}
            />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              activeName="person"
              inactiveName="person-outline"
              color={color}
              size={size}
            />
          )
        }}
      />
    </Tabs>
  );
}

