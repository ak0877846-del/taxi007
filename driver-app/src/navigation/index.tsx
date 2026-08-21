import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import OtpScreen from '../screens/OtpScreen';
import EnrolmentScreen from '../screens/EnrolmentScreen';
import HomeScreen from '../screens/HomeScreen';
import TripInProgressScreen from '../screens/TripInProgressScreen';

export type RootStackParamList = {
  Login: undefined;
  Otp: { phone: string };
  Enrolment: undefined;
  Home: undefined;
  TripInProgress: { tripId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

export default function RootNavigator() {
  const { isReady, isLoggedIn } = useAuth();
  if (!isReady) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TripInProgress" component={TripInProgressScreen} options={{ title: 'Current trip' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Otp" component={OtpScreen} options={{ title: '' }} />
            <Stack.Screen name="Enrolment" component={EnrolmentScreen} options={{ title: 'Enrolment' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
