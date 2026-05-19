import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, Animated, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from './src/theme';
import { LayoutDashboard, Package, ArrowLeftRight, History as HistoryIcon, Users } from 'lucide-react-native';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';
import ProductsScreen from './src/screens/Products/ProductsScreen';
import StockEntryScreen from './src/screens/StockEntry/StockEntryScreen';
import HistoryScreen from './src/screens/History/HistoryScreen';
import ManagementScreen from './src/screens/Management/ManagementScreen';
import AuthScreen, { IS_LOGGED_IN_KEY } from './src/screens/Auth/AuthScreen';
import AdminCustomersScreen from './src/screens/Admin/AdminCustomersScreen';
import AdminCustomerDetailsScreen from './src/screens/Admin/AdminCustomerDetailsScreen';
import { authEvents } from './src/services/api';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function MainTabs() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      backBehavior="history"
      tabBarPosition="bottom"
      screenOptions={{
        tabBarShowIcon: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarIndicatorStyle: { height: 0 }, // Hide the indicator for a bottom-tab look
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 65,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          textTransform: 'none',
          marginBottom: 5,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
        },
        swipeEnabled: true,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarLabel: t.tabDashboard,
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen} 
        options={{
          tabBarLabel: t.tabProducts,
          tabBarIcon: ({ color }) => <Package size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Management" 
        component={ManagementScreen} 
        options={{
          tabBarLabel: t.tabManagement,
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Stock" 
        component={StockEntryScreen} 
        options={{
          tabBarLabel: t.tabStock,
          tabBarIcon: ({ color }) => <ArrowLeftRight size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{
          tabBarLabel: t.tabHistory,
          tabBarIcon: ({ color }) => <HistoryIcon size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="AdminCustomers" component={AdminCustomersScreen} />
      <Stack.Screen name="AdminCustomerDetails" component={AdminCustomerDetailsScreen} />
    </Stack.Navigator>
  );
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: theme.colors.success, height: 75, width: '92%' }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a'
      }}
      text2Style={{
        fontSize: 14,
        color: '#555'
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: theme.colors.error, height: 75, width: '92%' }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a'
      }}
      text2Style={{
        fontSize: 14,
        color: '#555'
      }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: theme.colors.primary, height: 75, width: '92%' }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a'
      }}
      text2Style={{
        fontSize: 14,
        color: '#555'
      }}
    />
  )
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = authEvents.subscribe(() => {
      setIsLoggedIn(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load resources and check login status
        const loginStatus = await AsyncStorage.getItem(IS_LOGGED_IN_KEY);
        setIsLoggedIn(loginStatus === 'true');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
      
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setSplashVisible(false);
      });
    }
  }, [appIsReady, fadeAnim]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <SafeAreaProvider>
          <View style={styles.container} onLayout={onLayoutRootView}>
          <StatusBar style="dark" />
          {isLoggedIn ? (
            <NavigationContainer theme={{
              ...DefaultTheme,
              colors: {
                ...DefaultTheme.colors,
                primary: theme.colors.primary,
                background: theme.colors.background,
                card: theme.colors.background,
                text: theme.colors.text,
                border: theme.colors.border,
                notification: theme.colors.accent,
              }
            }}>
              <AppStack />
            </NavigationContainer>
          ) : (
            <AuthScreen onLoginSuccess={() => setIsLoggedIn(true)} />
          )}

          {splashVisible && (
            <Animated.View 
              style={[
                styles.splashOverlay, 
                { opacity: fadeAnim }
              ]}
            >
              <Image 
                source={require('./assets/Logo_2.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.loadingText}>Loading Premium Experience...</Text>
            </Animated.View>
          )}
          <Toast config={toastConfig} />
        </View>
      </SafeAreaProvider>
    </LanguageProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: theme.spacing.lg,
  },
  loadingText: {
    ...theme.typography.caption,
    letterSpacing: 1,
  },
});
