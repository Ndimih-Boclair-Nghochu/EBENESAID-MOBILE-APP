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
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              activeName="chatbubbles"
              inactiveName="chatbubbles-outline"
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
      <Tabs.Screen name="food" options={{ href: null }} />
      <Tabs.Screen name="community" options={{ href: null }} />
      <Tabs.Screen name="conversation" options={{ href: null }} />
      <Tabs.Screen name="circle-detail" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
      <Tabs.Screen name="arrival" options={{ href: null }} />
      <Tabs.Screen name="programs" options={{ href: null }} />
      <Tabs.Screen name="support" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="change-password" options={{ href: null }} />
    </Tabs>
  );
}
