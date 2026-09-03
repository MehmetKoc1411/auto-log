// App.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { FuelScreen } from './src/screens/FuelScreen';
import { ServiceScreen } from './src/screens/ServiceScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { COLORS } from './src/constants/theme';

const Tab = createBottomTabNavigator();

function MainNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: 64 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'speedometer';

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'FuelTab') {
            iconName = focused ? 'funnel' : 'funnel-outline';
          } else if (route.name === 'ServiceTab') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'AnalyticsTab') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ tabBarLabel: 'Gösterge' }} />
      <Tab.Screen name="FuelTab" component={FuelScreen} options={{ tabBarLabel: 'Yakıt' }} />
      <Tab.Screen name="ServiceTab" component={ServiceScreen} options={{ tabBarLabel: 'Bakım' }} />
      <Tab.Screen name="AnalyticsTab" component={AnalyticsScreen} options={{ tabBarLabel: 'Analiz' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <MainNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}