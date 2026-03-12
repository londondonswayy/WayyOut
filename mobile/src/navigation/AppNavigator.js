import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VenueDetailScreen from '../screens/VenueDetailScreen';
import StoriesScreen from '../screens/StoriesScreen';
import PostStoryScreen from '../screens/PostStoryScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#07071A' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: 'Poppins-SemiBold' },
          contentStyle: { backgroundColor: '#07071A' },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="VenueDetail" component={VenueDetailScreen} options={{ title: '' }} />
            <Stack.Screen
              name="Stories"
              component={StoriesScreen}
              options={{ headerShown: false, presentation: 'fullScreenModal' }}
            />
            <Stack.Screen
              name="PostStory"
              component={PostStoryScreen}
              options={{ title: 'New Story', presentation: 'modal' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
