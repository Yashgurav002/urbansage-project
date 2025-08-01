import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import IssuesListScreen from './screens/IssuesListScreen';

import notificationService from './services/notifications';
import databaseService from './services/database';

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  IssuesList: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    // Initialize services
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      await databaseService.init();
      
      // Register for push notifications
      await notificationService.registerForPushNotifications();
      
      // Add notification listeners
      const listeners = notificationService.addNotificationListeners();
      
      // Cleanup function
      return () => {
        notificationService.removeNotificationListeners(listeners);
      };
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3B82F6',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: '🏙️ UrbanSage Pro' }}
        />
        <Stack.Screen 
          name="Camera" 
          component={CameraScreen} 
          options={{ title: '📸 Report with Photo' }}
        />
        <Stack.Screen 
          name="IssuesList" 
          component={IssuesListScreen} 
          options={{ title: '📋 All Issues' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
