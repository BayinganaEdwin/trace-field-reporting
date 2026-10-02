import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';
import { WorkerHomeScreen }           from '../screens/worker/WorkerHomeScreen';
import { WorkerHistoryScreen }        from '../screens/worker/WorkerHistoryScreen';
import { SubmitReportScreen }         from '../screens/worker/SubmitReportScreen';
import { WorkerReportDetailScreen }   from '../screens/worker/WorkerReportDetailScreen';
import { ProfileScreen }              from '../screens/shared/ProfileScreen';
import { FloatingTabBar }             from '../components/layout/FloatingTabBar';
import { colors }                     from '../theme/colors';
import type { WorkerTabParamList, WorkerStackParamList } from '../types';

const Tab   = createBottomTabNavigator<WorkerTabParamList>();
const Stack = createNativeStackNavigator<WorkerStackParamList>();

function WorkerTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="WorkerHome"    component={WorkerHomeScreen}                             />
      <Tab.Screen name="WorkerHistory" component={WorkerHistoryScreen}                          />
      <Tab.Screen name="WorkerProfile" children={() => <ProfileScreen role="worker" />}         />
    </Tab.Navigator>
  );
}

export function WorkerNavigator() {
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
      <Stack.Screen name="WorkerTabs"        component={WorkerTabs}               options={{ headerShown: false }} />
      <Stack.Screen name="SubmitReport"      component={SubmitReportScreen}       options={{ title: 'Submit Report'  }} />
      <Stack.Screen name="WorkerReportDetail"component={WorkerReportDetailScreen} options={{ title: 'Report Detail'  }} />
    </Stack.Navigator>
  );
}
