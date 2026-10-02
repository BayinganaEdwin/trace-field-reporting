import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen }      from '../screens/auth/LoginScreen';
import { WorkerNavigator }  from './WorkerNavigator';
import { ManagerNavigator } from './ManagerNavigator';
import type { RootStackParamList } from '../types';

const Root = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Root.Screen name="Login"      component={LoginScreen}      />
        <Root.Screen name="WorkerApp"  component={WorkerNavigator}  />
        <Root.Screen name="ManagerApp" component={ManagerNavigator} />
      </Root.Navigator>
    </NavigationContainer>
  );
}
