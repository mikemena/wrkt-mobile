import React, { useContext, useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  SafeAreaView,
  View,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import withKeyboardAvoidingView from '../src/hocs/withKeyboardAvoidingView';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ProgramContext } from '../src/context/programContext';
import ProgramForm from '../components/ProgramForm';
import PillButton from '../components/PillButton';
import Workout from '../components/Workout';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { globalStyles, colors } from '../src/styles/globalStyles';
import Header from '../components/Header';
import useExpandedItems from '../src/hooks/useExpandedItems';

const EditProgram = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { program: initialProgram } = route.params || {};

  const {
    state,
    initializeEditProgramState,
    setMode,
    updateProgram,
    addWorkout,
    clearProgram
  } = useContext(ProgramContext);

  const { program } = state;
  const { workouts } = state.workout;
  const [isWorkoutTitleEditing, setIsWorkoutTitleEditing] = useState(false);

  const {
    isProgramFormExpanded,
    toggleItem,
    toggleProgramForm,
    isItemExpanded
  } = useExpandedItems(workouts);

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  useEffect(() => {
    const refresh = route.params?.shouldRefresh;
    const programId = route.params?.programId;

    if (refresh && programId) {
      // Instead of searching through state.programs, use the current program state
      if (state.program && state.program.id === programId) {
        initializeEditProgramState(state.program, state.workout.workouts);
      } else {
        console.warn('Program not found in current state:', programId);
      }
    }
  }, [
    route.params?.shouldRefresh,
    route.params?.programId,
    // state.program
    state.workout.workouts
  ]);

  useEffect(() => {
    setMode('edit');
    initializeEditProgramState(initialProgram, initialProgram.workouts);

    return () => {
      clearProgram();
    };
  }, []); // Empty dependency array to run only once

  // Dismiss keyboard when tapping outside
  const dismissKeyboard = () => {
    Keyboard.dismiss();
    if (isWorkoutTitleEditing) {
      Keyboard.dismiss();
    }
  };

  const handleUpdateProgram = async () => {
    try {
      const updatedProgram = {
        ...state.program,
        workouts: state.workout.workouts.map(workout => ({
          ...workout,
          exercises: workout.exercises.map(exercise => ({
            ...exercise,
            sets: exercise.sets.map(set => ({
              ...set,
              weight: parseInt(set.weight, 10) || 0,
              reps: parseInt(set.reps, 10) || 0,
              order: parseInt(set.order, 10) || 0
            }))
          }))
        }))
      };

      await updateProgram(updatedProgram);
      // Reset the navigation stack to ProgramsList
      navigation.reset({
        index: 0,
        routes: [{ name: 'ProgramsList' }]
      });
    } catch (error) {
      console.error('Failed to save the program:', error);
    }
  };

  const handleAddWorkout = event => {
    event.preventDefault();
    addWorkout(program.id);
  };

  const handleCancel = () => {
    clearProgram();
    // Reset the navigation stack to ProgramsList
    navigation.reset({
      index: 0,
      routes: [{ name: 'ProgramsList' }]
    });
  };

  if (!state.program) {
    return (
      <SafeAreaView
        style={[
          globalStyles.container,
          { backgroundColor: themedStyles.primaryBackgroundColor }
        ]}
      >
        <Header pageName='Edit Program' />
        <Text style={{ color: themedStyles.textColor }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView
        style={[
          globalStyles.container,
          { backgroundColor: themedStyles.primaryBackgroundColor }
        ]}
      >
        <Header pageName='Edit Program' />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <ProgramForm
              program={program}
              isExpanded={isProgramFormExpanded}
              onToggleExpand={toggleProgramForm}
            />
          </View>

          <View style={styles.workoutsContainer}>
            {workouts.length > 0 ? (
              workouts.map(workout => (
                <Workout
                  key={workout.id}
                  workout={workout}
                  isExpanded={isItemExpanded(workout.id)}
                  onToggleExpand={() => toggleItem(workout.id)}
                  onTitleEditingChange={isEditing =>
                    setIsWorkoutTitleEditing(isEditing)
                  }
                  variant='edit-program'
                />
              ))
            ) : (
              <Text style={{ color: themedStyles.textColor }}>
                No workouts available
              </Text>
            )}
          </View>
          {/* Add Workout button */}
          <PillButton
            label='Add Workout'
            icon={
              <Ionicons
                name='add-outline'
                size={16}
                style={{
                  color:
                    themeState.theme === 'dark'
                      ? themedStyles.accentColor
                      : colors.eggShell
                }}
              />
            }
            onPress={handleAddWorkout}
          />
          {/* Save and Cancel buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                globalStyles.button,
                styles.saveButton,
                { backgroundColor: themedStyles.secondaryBackgroundColor }
              ]}
              onPress={handleUpdateProgram}
            >
              <Text
                style={[
                  globalStyles.buttonText,
                  { color: themedStyles.accentColor }
                ]}
              >
                SAVE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                globalStyles.button,
                styles.cancelButton,
                { backgroundColor: themedStyles.secondaryBackgroundColor }
              ]}
              onPress={handleCancel}
            >
              <Text
                style={[
                  globalStyles.buttonText,
                  { color: themedStyles.accentColor }
                ]}
              >
                CANCEL
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    padding: 5
  },
  formContainer: { borderRadius: 10 },
  workoutsContainer: {
    marginBottom: 10
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 16
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  saveButton: {
    flex: 1,
    marginRight: 10
  },
  cancelButton: {
    flex: 1,
    marginLeft: 10
  }
});

export default withKeyboardAvoidingView(EditProgram);
