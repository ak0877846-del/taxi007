import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import OtpScreen from '../screens/OtpScreen';
import HomeScreen from '../screens/HomeScreen';
import TripTrackingScreen from '../screens/TripTrackingScreen';
import RatingScreen from '../screens/RatingScreen';

export type RootStackParamList = {
  Login: undefined;
  Otp: { phone: string };
  Home: undefined;
  TripTracking: { tripId: string };
  Rating: { tripId: string };
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
            <Stack.Screen name="TripTracking" component={TripTrackingScreen} options={{ title: 'Your trip' }} />
            <Stack.Screen name="Rating" component={RatingScreen} options={{ title: 'Rate your trip', headerBackVisible: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Otp" component={OtpScreen} options={{ title: '' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
