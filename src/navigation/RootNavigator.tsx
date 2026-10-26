import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingScreen }        from '../screens/auth/OnboardingScreen';
import { SignupScreen }             from '../screens/auth/SignupScreen';
import { LoginScreen }              from '../screens/auth/LoginScreen';
import { WorkerNavigator }          from './WorkerNavigator';
import { ManagerNavigator }         from './ManagerNavigator';
import { PropertyOwnerNavigator }   from './PropertyOwnerNavigator';
import { colors }           from '../theme/colors';
import type { RootStackParamList } from '../types';

const Root = createNativeStackNavigator<RootStackParamList>();
const ONBOARDING_KEY = 'trace_onboarding_v1';

export function RootNavigator() {
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((seen) => setInitialRoute(seen ? 'Login' : 'Onboarding'))
      .catch(() => setInitialRoute('Login'));
  }, []);

  // Gate until AsyncStorage resolves
  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // Mark onboarding as seen once we resolve — any subsequent cold start goes to Login
  const markSeen = () => AsyncStorage.setItem(ONBOARDING_KEY, '1').catch(() => {});

  return (
    <NavigationContainer onReady={markSeen}>
      <Root.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Root.Screen name="Onboarding" component={OnboardingScreen} />
        <Root.Screen name="Signup"     component={SignupScreen}     />
        <Root.Screen name="Login"      component={LoginScreen}      />
        <Root.Screen name="WorkerApp"  component={WorkerNavigator}          />
        <Root.Screen name="ManagerApp" component={ManagerNavigator}         />
        <Root.Screen name="OwnerApp"   component={PropertyOwnerNavigator}   />
      </Root.Navigator>
    </NavigationContainer>
  );
}
