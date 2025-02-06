import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Exercise from './Exercise';
import { globalStyles } from '../src/styles/globalStyles';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { ProgramContext } from '../src/context/programContext';
import SwipeableItemDeletion from '../components/SwipeableItemDeletion';

const Workout = ({
  workout: initialWorkout,
  isExpanded,
  onToggleExpand,
  onTitleEditingChange,
  swipeEnabled = true,
  variant
}) => {
  const { state, setActiveWorkout, updateWorkoutField, deleteWorkout } =
    useContext(ProgramContext);

  const workouts = state.workout.workouts;

  // Get the most up-to-date workout data from the state
  const workout = useMemo(() => {
    return workouts.find(w => w.id === initialWorkout.id) || initialWorkout;
  }, [workouts, initialWorkout]);

  const { mode } = state;

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState(workout.name);
  const [localExercises, setLocalExercises] = useState(workout.exercises);
  const inputRef = useRef(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    setWorkoutTitle(workout.name);
  }, [workout.name]);

  useEffect(() => {
    onTitleEditingChange?.(isEditingTitle);
  }, [isEditingTitle]);

  useEffect(() => {
    setLocalExercises(workout.exercises);
  }, [workout.exercises]);

  const headerStyle = [
    styles.workoutHeader,
    { backgroundColor: themedStyles.secondaryBackgroundColor }
  ];

  const handleTitlePress = useCallback(() => {
    if (mode === 'view') return; // Prevent editing in view mode
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditingTitle(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [mode]);

  const handleEditTitleChange = text => {
    setIsEditingTitle(true);
    setWorkoutTitle(text);
  };

  const handleTitleSubmit = useCallback(() => {
    if (workout) {
      updateWorkoutField(workout.id, 'name', workoutTitle);
    }
    setIsEditingTitle(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [workout, workoutTitle, updateWorkoutField]);

  const handleWorkoutExpand = useCallback(() => {
    onToggleExpand(workout.id);
  }, [onToggleExpand, workout.id]);

  const handleAddExercises = workoutId => {
    setActiveWorkout(workoutId);

    navigation.navigate('ExerciseSelection', {
      contextType: 'program',
      isNewProgram: true,
      programId: workout.programId
    });
  };

  const getExerciseCountText = useCallback(count => {
    if (count === 0) return 'NO EXERCISES';
    if (count === 1) return '1 EXERCISE';
    return `${count} EXERCISES`;
  }, []);

  const sortedExercises = [...workout.exercises].sort(
    (a, b) => a.order - b.order
  );

  if (isDeleting) {
    return null;
  }

  return (
    <View style={[styles.containerWrapper]}>
      <SwipeableItemDeletion
        onDelete={() => deleteWorkout(workout.id)}
        swipeableType='workout'
        enabled={swipeEnabled}
        onSwipeChange={setIsSwipeOpen}
      >
        <View style={[styles.workoutContainer]}>
          <TouchableOpacity>
            <View style={headerStyle}>
              <View style={styles.headerContent}>
                <Animated.View>
                  {isEditingTitle ? (
                    <TextInput
                      ref={inputRef}
                      style={[
                        styles.workoutTitle,
                        {
                          color: themedStyles.accentColor,
                          backgroundColor: themedStyles.primaryBackgroundColor
                        }
                      ]}
                      value={workoutTitle}
                      onChangeText={handleEditTitleChange}
                      onBlur={handleTitleSubmit}
                    />
                  ) : mode !== 'view' ? (
                    <TouchableOpacity onPress={handleTitlePress}>
                      <Text
                        style={[
                          styles.workoutTitle,
                          { color: themedStyles.accentColor }
                        ]}
                      >
                        {workoutTitle}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text
                      style={[
                        styles.workoutTitle,
                        { color: themedStyles.accentColor }
                      ]}
                    >
                      {workoutTitle}
                    </Text>
                  )}
                </Animated.View>
                <TouchableOpacity
                  onPress={
                    variant !== 'program-details'
                      ? () => handleAddExercises(workout.id)
                      : undefined
                  }
                >
                  <Text
                    style={[
                      styles.exerciseCountText,
                      { color: themedStyles.textColor }
                    ]}
                  >
                    {getExerciseCountText(workout.exercises.length)}
                    {mode !== 'view' && (
                      <>
                        {' - '}
                        <Text style={{ color: themedStyles.accentColor }}>
                          ADD
                        </Text>
                      </>
                    )}
                  </Text>
                </TouchableOpacity>
              </View>

              {sortedExercises.length > 0 && !isSwipeOpen && (
                <TouchableOpacity
                  onPress={handleWorkoutExpand}
                  style={[
                    globalStyles.iconCircle,
                    { backgroundColor: themedStyles.primaryBackgroundColor }
                  ]}
                >
                  <Ionicons
                    name={
                      isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'
                    }
                    style={[
                      globalStyles.icon,
                      { color: themedStyles.textColor }
                    ]}
                  />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
          {isExpanded && (
            <View style={styles.expandedContent}>
              {localExercises.map((exercise, index) => (
                <Exercise
                  key={exercise.id}
                  exercise={exercise}
                  index={index + 1}
                  workout={workout}
                  variant={variant}
                />
              ))}
            </View>
          )}
        </View>
      </SwipeableItemDeletion>
    </View>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    overflow: 'hidden',
    marginBottom: 5,
    borderRadius: 5
  },
  workoutContainer: {
    zIndex: 1
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10
  },
  headerContent: {
    flex: 1,
    alignItems: 'center'
  },
  workoutTitle: {
    fontFamily: 'Lexend',
    fontSize: 16,
    marginBottom: 4
  },
  exerciseCountText: {
    fontFamily: 'Lexend',
    fontSize: 14
  },
  expandedContent: {
    overflow: 'hidden'
  }
});

export default Workout;
