import React, { useState, useEffect, useRef } from 'react';
import { initializeApi, api } from './src/services/api';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet, ActivityIndicator, Text, Alert } from 'react-native';
import * as Font from 'expo-font';
import Constants from 'expo-constants';
import Navigation from './components/Navigation';
import { ThemeProvider } from './src/context/themeContext';
import { ProgramProvider } from './src/context/programContext';
import { WorkoutProvider } from './src/context/workoutContext';
import { StaticDataProvider } from './src/context/staticDataContext';
import { AuthProvider, useAuth } from './src/context/authContext';
import { UserProvider } from './src/context/userContext';
import { UserEquipmentProvider } from './src/context/userEquipmentContext';
import { imageCache } from './src/utils/imageCache';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import your view components
import ProgramsView from './views/ProgramsView';
import ProgramDetails from './views/ProgramDetails';
import CreateProgram from './views/CreateProgram';
import EditProgram from './views/EditProgram';
import WorkoutView from './views/WorkoutView';
import ProgressView from './views/ProgressView';
import ProfileView from './views/ProfileView';
import ExerciseSelectionView from './views/ExerciseSelectionView';
import CurrentProgramView from './views/CurrentProgramView';
import FlexWorkoutView from './views/FlexWorkoutView';
import CurrentProgramDetailsView from './views/CurrentProgramDetailsView';
import StartWorkoutView from './views/StartWorkoutView';
import SignInView from './views/SignInView';
import SignUpView from './views/SignUpView';
import ForgotPasswordView from './views/ForgotPasswordView';
import ResetPasswordView from './views/ResetPasswordView';

const Tab = createBottomTabNavigator();
const ProgramsStack = createStackNavigator();
const WorkoutStack = createStackNavigator();
const RootStack = createStackNavigator();
const AuthStack = createStackNavigator();

// Constants for image preloading
const LAST_PRELOAD_KEY = 'last_exercises_preload';
const PRELOAD_INTERVAL = 1000 * 60 * 60 * 24 * 7; // 7 days

const ProgramsStackScreen = () => (
  <ProgramsStack.Navigator screenOptions={{ headerShown: false }}>
    <ProgramsStack.Screen name='ProgramsList' component={ProgramsView} />
    <ProgramsStack.Screen name='ProgramDetails' component={ProgramDetails} />
    <ProgramsStack.Screen name='CreateProgram' component={CreateProgram} />
    <ProgramsStack.Screen name='EditProgram' component={EditProgram} />
    <ProgramsStack.Screen
      name='ExerciseSelection'
      component={ExerciseSelectionView}
    />
  </ProgramsStack.Navigator>
);

const WorkoutStackScreen = () => (
  <WorkoutStack.Navigator screenOptions={{ headerShown: false }}>
    <WorkoutStack.Screen name='WorkoutMain' component={WorkoutView} />
    <WorkoutStack.Screen name='CurrentProgram' component={CurrentProgramView} />
    <WorkoutStack.Screen name='FlexWorkout' component={FlexWorkoutView} />
    <WorkoutStack.Screen
      name='CurrentProgramDetails'
      component={CurrentProgramDetailsView}
    />
    <WorkoutStack.Screen name='StartWorkout' component={StartWorkoutView} />
  </WorkoutStack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    tabBar={props => <Navigation {...props} />}
    initialRouteName='Workout'
  >
    <Tab.Screen
      name='Programs'
      component={ProgramsStackScreen}
      options={{ headerShown: false }}
    />
    <Tab.Screen
      name='Workout'
      component={WorkoutStackScreen}
      options={{ headerShown: false }}
    />
    <Tab.Screen
      name='Progress'
      component={ProgressView}
      options={{ headerShown: false }}
    />
    <Tab.Screen
      name='Profile'
      component={ProfileView}
      options={{ headerShown: false }}
    />
  </Tab.Navigator>
);

const getPrefixes = () => {
  const scheme = Constants.expoConfig?.scheme || 'WRKT';

  if (__DEV__) {
    return [
      `${scheme}://`,
      'exp://',
      'https://wrkt-backend-development.up.railway.app'
    ];
  }

  return [
    `${scheme}://`,
    `https://${Constants.expoConfig?.hostUri || 'wrkt.fitness'}`
  ];
};

const linking = {
  prefixes: getPrefixes(),
  config: {
    screens: {
      Auth: {
        screens: {
          ResetPassword: {
            path: 'reset-password',
            parse: {
              token: token => token
            }
          }
        }
      }
    }
  }
};

const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{ headerShown: false, gestureEnabled: false }}
    initialRouteName='SignIn'
  >
    <AuthStack.Screen
      name='SignUp'
      component={SignUpView}
      options={{
        animationTypeForReplace: 'pop'
      }}
    />
    <AuthStack.Screen name='SignIn' component={SignInView} />
    <AuthStack.Screen name='ForgotPassword' component={ForgotPasswordView} />
    <AuthStack.Screen
      name='ResetPassword'
      component={ResetPasswordView}
      options={{
        path: 'reset-password'
      }}
    />
  </AuthStack.Navigator>
);

// Create a loading screen component with progress indicator
const LoadingScreen = ({ message = 'Loading...', progress = null }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size='large' color='#ffffff' />
    {message && <Text style={styles.loadingText}>{message}</Text>}
    {progress && (
      <Text style={styles.progressText}>
        {progress.percent}% ({progress.current}/{progress.total})
      </Text>
    )}
  </View>
);

// Function to preload exercise images
const preloadExerciseImages = async (setPreloadProgress, setPreloadMessage) => {
  try {
    setPreloadMessage('Checking for image updates...');

    // Check if we should preload based on last preload time
    const lastPreload = await AsyncStorage.getItem(LAST_PRELOAD_KEY);
    const lastPreloadTime = lastPreload ? parseInt(lastPreload, 10) : 0;
    const now = Date.now();

    if (now - lastPreloadTime < PRELOAD_INTERVAL && lastPreloadTime > 0) {
      console.log('Skipping preload, last preload was recent');
      return false; // Skip preload, it was done recently
    }

    // Check network status before preloading
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || netInfo.isConnectionExpensive) {
      console.log('Skipping preload due to network constraints');
      return false; // Skip preload on cellular or no connection
    }

    setPreloadMessage('Downloading exercise catalog...');

    // Fetch all exercises
    const params = new URLSearchParams();
    params.append('limit', '500'); // Get as many as possible in one request

    const response = await api.get(
      `/api/exercise-catalog?${params.toString()}`
    );

    if (
      !response ||
      !response.exercises ||
      !Array.isArray(response.exercises)
    ) {
      console.log('Invalid exercise data received');
      return false;
    }

    const exercises = response.exercises;

    if (exercises.length === 0) {
      console.log('No exercises received to preload');
      return false;
    }

    console.log(`Starting preload of ${exercises.length} exercise images`);
    setPreloadMessage('Preloading exercise images...');

    // Start preloading
    const result = await imageCache.preloadImages(exercises, progress => {
      setPreloadProgress(progress);
    });

    // Update last preload time
    await AsyncStorage.setItem(LAST_PRELOAD_KEY, now.toString());

    console.log('Preload completed:', result);
    return true;
  } catch (error) {
    console.error('Failed to preload exercise images:', error);
    return false;
  } finally {
    setPreloadProgress(null);
    setPreloadMessage(null);
  }
};

// Create a navigator that checks auth state
const RootNavigator = () => {
  const { user, loading } = useAuth();
  const [preloading, setPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(null);
  const [preloadMessage, setPreloadMessage] = useState(null);
  const hasInitialized = useRef(false);

  // Handle image preloading after user logs in
  useEffect(() => {
    if (user && !loading && !hasInitialized.current && !__DEV__) {
      hasInitialized.current = true;
      setPreloading(true);

      // Start preloading process
      preloadExerciseImages(setPreloadProgress, setPreloadMessage)
        .then(didPreload => {
          if (didPreload) {
            // Optional: Show completion message
            console.log('Image preloading completed successfully');
          }
        })
        .catch(error => {
          console.error('Error during image preloading:', error);
        })
        .finally(() => {
          setPreloading(false);
        });
    }
  }, [user, loading]);

  if (loading) {
    return <LoadingScreen message='Loading your profile...' />;
  }

  if (preloading) {
    return (
      <LoadingScreen
        message={preloadMessage || 'Preparing your workout data...'}
        progress={preloadProgress}
      />
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Show auth screens when no user
        <RootStack.Screen name='Auth' component={AuthNavigator} />
      ) : (
        // Show main app screens when user exists
        <>
          <RootStack.Screen name='MainTabs' component={TabNavigator} />
          <RootStack.Screen
            name='ExerciseSelection'
            component={ExerciseSelectionView}
          />
        </>
      )}
    </RootStack.Navigator>
  );
};

const App = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          Tiny5: require('./assets/fonts/Tiny5-Regular.ttf'),
          Teko: require('./assets/fonts/Teko-Light.ttf'),
          Lexend: require('./assets/fonts/Lexend-VariableFont_wght.ttf')
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Failed to load fonts:', error);
      }
    }
    const apiUrl = Constants.expoConfig.extra.apiUrl;
    console.log('API URL from App.jsx', apiUrl);
    initializeApi({ apiUrl });

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#ffffff' />
      </View>
    );
  }

  return (
    <AuthProvider>
      <UserProvider>
        <StaticDataProvider>
          <UserEquipmentProvider>
            <ProgramProvider>
              <WorkoutProvider>
                <ThemeProvider>
                  <View style={styles.container}>
                    <NavigationContainer linking={linking}>
                      <RootNavigator />
                    </NavigationContainer>
                  </View>
                </ThemeProvider>
              </WorkoutProvider>
            </ProgramProvider>
          </UserEquipmentProvider>
        </StaticDataProvider>
      </UserProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black'
  },
  loadingText: {
    color: 'white',
    marginTop: 20,
    fontFamily: 'Lexend'
  },
  progressText: {
    color: '#bbb',
    marginTop: 10,
    fontFamily: 'Lexend'
  }
});

export default App;
