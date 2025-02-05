import React, { useContext, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  View,
  ScrollView
} from 'react-native';
import ParallelogramButton from '../components/ParallelogramButton';
import { useNavigation } from '@react-navigation/native';
import { WorkoutContext } from '../src/context/workoutContext';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { globalStyles } from '../src/styles/globalStyles';
import Header from '../components/Header';

const FlexWorkout = () => {
  const navigation = useNavigation();
  const {
    state: workoutState,
    initializeFlexWorkout,
    clearWorkoutDetails
  } = useContext(WorkoutContext);

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  useEffect(() => {
    initializeFlexWorkout();
  }, []);

  const handleAddExercise = () => {
    navigation.navigate('ExerciseSelection', {
      contextType: 'workout',
      isNewProgram: false
    });
  };

  const handleCancel = () => {
    clearWorkoutDetails();
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={[
        globalStyles.container,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <Header pageName='Workout' />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text
            style={[styles.instructions, { color: themedStyles.textColor }]}
          >
            Start by adding exercises to your flex workout.
          </Text>
        </View>
        <View style={styles.buttonRow}>
          <ParallelogramButton
            label='ADD EXERCISE'
            style={[{ width: 150, alignItems: 'center' }]}
            onPress={handleAddExercise}
          />
          <ParallelogramButton
            label='CANCEL'
            style={[{ width: 150, alignItems: 'center' }]}
            onPress={handleCancel}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'space-between'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  instructions: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  addButton: {
    flex: 1,
    marginRight: 10
  },
  cancelButton: {
    flex: 1,
    marginLeft: 10
  }
});

export default FlexWorkout;
