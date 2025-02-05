import React, { useContext, useEffect, useCallback } from 'react';
import { StyleSheet, SafeAreaView, Text, View, ScrollView } from 'react-native';
import withKeyboardAvoidingView from '../src/hocs/withKeyboardAvoidingView';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProgramForm from '../components/ProgramForm';
import Workout from '../components/Workout';
import ParallelogramButton from '../components/ParallelogramButton';
import { ProgramContext } from '../src/context/programContext';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { globalStyles, colors } from '../src/styles/globalStyles';
import Header from '../components/Header';
import useExpandedItems from '../src/hooks/useExpandedItems';

const CreateProgram = () => {
  const navigation = useNavigation();
  const {
    state,
    initializeNewProgramState,
    setMode,
    saveProgram,
    clearProgram,
    addWorkout
  } = useContext(ProgramContext);

  const program = state.program;
  const workouts = state.workout.workouts;
  const {
    isProgramFormExpanded,
    toggleItem,
    toggleProgramForm,
    isItemExpanded
  } = useExpandedItems(workouts);

  const memoizedToggleItem = useCallback(
    workoutId => {
      toggleItem(workoutId);
    },
    [toggleItem]
  );

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  useEffect(() => {
    setMode('create');
    if (!state.program || !state.workout.workouts.length) {
      initializeNewProgramState();
    }
  }, []);

  const handleSaveProgram = async () => {
    try {
      await saveProgram(state.program);
      navigation.goBack();
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
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={[
        globalStyles.container,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <Header pageName='Create Program' />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <ProgramForm
            program={program}
            isExpanded={isProgramFormExpanded}
            onToggleExpand={toggleProgramForm}
          />
        </View>

        {/* Workouts section */}
        <View style={styles.workoutsContainer}>
          {workouts && workouts.length > 0 ? (
            workouts.map(workout => (
              <Workout
                key={workout.id}
                workout={workout}
                isExpanded={isItemExpanded(workout.id)}
                onToggleExpand={memoizedToggleItem}
              />
            ))
          ) : (
            <Text style={{ color: themedStyles.textColor }}>
              No workouts available
            </Text>
          )}
        </View>

        {/* Add Workout button */}
        <ParallelogramButton
          label='Add Workout'
          icon={
            <Ionicons
              name='add-outline'
              size={16}
              style={{
                color: themedStyles.accentColor
              }}
            />
          }
          onPress={handleAddWorkout}
        />

        {/* Save and Cancel buttons */}
        <View style={styles.buttonRow}>
          <ParallelogramButton
            label='SAVE'
            style={[{ width: 150, alignItems: 'center' }]}
            onPress={handleSaveProgram}
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
  container: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    padding: 5
  },
  workoutsContainer: {
    marginBottom: 10
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginHorizontal: 20
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 10
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

export default withKeyboardAvoidingView(CreateProgram);
