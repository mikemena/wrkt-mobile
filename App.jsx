import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import * as Font from 'expo-font';
import Navigation from './components/Navigation';
import { ThemeProvider } from './src/context/themeContext';
import { ProgramProvider } from './src/context/programContext';
import { WorkoutProvider } from './src/context/workoutContext';
import { AuthProvider, useAuth } from './src/context/authContext';
import { UserProvider } from './src/context/userContext';
import { ConfigProvider } from './src/context/configContext';
import { initializeApi } from './src/services/api';

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

const linking = {
  prefixes: ['wrkt://', 'http://localhost:8081', 'exp://'],
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
    initialRouteName='SignUp'
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
        path: 'reset-password' // for web routing
      }}
    />
  </AuthStack.Navigator>
);

// Create a loading screen component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size='large' />
  </View>
);

// Create a navigator that checks auth state
const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
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
    <ConfigProvider>
      <AuthProvider>
        <UserProvider>
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
        </UserProvider>
      </AuthProvider>
    </ConfigProvider>
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
  }
});

export default App;
