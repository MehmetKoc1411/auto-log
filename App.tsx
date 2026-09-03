// App.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/constants/theme';

// Ekranlar
import { DashboardScreen } from './src/screens/DashboardScreen';
import { FuelScreen } from './src/screens/FuelScreen';
import { ServiceScreen } from './src/screens/ServiceScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { GuideScreen } from './src/screens/GuideScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textLight,
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopColor: COLORS.border,
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen
            name="DashboardTab"
            component={DashboardScreen}
            options={{
              tabBarLabel: 'Gösterge',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="speedometer-outline" size={size} color={color} />
              ),
            }}
          />

          <Tab.Screen
            name="FuelTab"
            component={FuelScreen}
            options={{
              tabBarLabel: 'Yakıt',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="funnel-outline" size={size} color={color} />
              ),
            }}
          />

          <Tab.Screen
            name="ServiceTab"
            component={ServiceScreen}
            options={{
              tabBarLabel: 'Bakım',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="build-outline" size={size} color={color} />
              ),
            }}
          />

          <Tab.Screen
            name="AnalyticsTab"
            component={AnalyticsScreen}
            options={{
              tabBarLabel: 'Analiz',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="bar-chart-outline" size={size} color={color} />
              ),
            }}
          />

          <Tab.Screen
            name="GuideTab"
            component={GuideScreen}
            options={{
              tabBarLabel: 'Rehber',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="book-outline" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}