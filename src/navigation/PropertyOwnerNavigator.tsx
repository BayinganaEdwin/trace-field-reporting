import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { OwnerOverviewScreen } from '../screens/owner/OwnerOverviewScreen';
import { OwnerReportsScreen } from '../screens/owner/OwnerReportsScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { FloatingTabBar } from '../components/layout/FloatingTabBar';
import { colors } from '../theme/colors';
import type { OwnerTabParamList, OwnerStackParamList } from '../types';

const Tab = createBottomTabNavigator<OwnerTabParamList>();
const Stack = createNativeStackNavigator<OwnerStackParamList>();

function OwnerTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="OwnerOverview" component={OwnerOverviewScreen} />
      <Tab.Screen name="OwnerReports" component={OwnerReportsScreen} />
      <Tab.Screen
        name="OwnerProfile"
        children={() => <ProfileScreen role="owner" />}
      />
    </Tab.Navigator>
  );
}

export function PropertyOwnerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.accent,
        headerBackTitle: 'Back',
        headerTitleStyle: {
          fontFamily: 'DMSans_700Bold',
          fontSize: 17,
          color: colors.textPrimary,
        },
        headerStyle: { backgroundColor: colors.bgSecondary },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bgSecondary },
      }}
    >
      <Stack.Screen
        name="OwnerTabs"
        component={OwnerTabs}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
