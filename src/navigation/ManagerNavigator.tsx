import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';
import { ManagerHomeScreen }          from '../screens/manager/ManagerHomeScreen';
import { ReportsFeedScreen }          from '../screens/manager/ReportsFeedScreen';
import { ReportDetailScreen }         from '../screens/manager/ReportDetailScreen';
import { NotificationsScreen }        from '../screens/manager/NotificationsScreen';
import { ProfileScreen }              from '../screens/shared/ProfileScreen';
import { FloatingTabBar }             from '../components/layout/FloatingTabBar';
import { colors }                     from '../theme/colors';
import type { ManagerTabParamList, ManagerStackParamList } from '../types';

const Tab   = createBottomTabNavigator<ManagerTabParamList>();
const Stack = createNativeStackNavigator<ManagerStackParamList>();

function ManagerTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="ManagerHome"          component={ManagerHomeScreen}                          />
      <Tab.Screen name="ReportsFeed"          component={ReportsFeedScreen}                          />
      <Tab.Screen name="ManagerNotifications" component={NotificationsScreen}                        />
      <Tab.Screen name="ManagerProfile"       children={() => <ProfileScreen role="manager" />}      />
    </Tab.Navigator>
  );
}

export function ManagerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.accent,
        headerBackTitle: 'Back',
        headerTitleStyle: {
          fontFamily: 'DMSans_600SemiBold',
          fontSize: 17,
          color: colors.textPrimary,
        },
        headerStyle:         { backgroundColor: colors.bgSecondary },
        headerShadowVisible: false,
        contentStyle:        { backgroundColor: colors.bgSecondary },
      }}
    >
      <Stack.Screen name="ManagerTabs" component={ManagerTabs}         options={{ headerShown: false }} />
      <Stack.Screen name="ReportDetail"component={ReportDetailScreen}  options={{ title: 'Report Detail' }} />
    </Stack.Navigator>
  );
}
