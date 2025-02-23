import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback
} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
  Animated,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import withKeyboardAvoidingView from '../src/hocs/withKeyboardAvoidingView';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import { useNavigation } from '@react-navigation/native';
import { WorkoutContext } from '../src/context/workoutContext';
import { ProgramContext } from '../src/context/programContext';
import ParallelogramButton from '../components/ParallelogramButton';
import SecondaryButton from '../components/SecondaryButton';
import SwipeableItemDeletion from '../components/SwipeableItemDeletion';
import Header from '../components/Header';
import Set from '../components/Set';
import ExerciseImage from '../components/ExerciseImage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { globalStyles, colors } from '../src/styles/globalStyles';

const StartWorkoutView = ({ route, isKeyboardVisible }) => {
  const {
    state: workoutState,
    completeWorkout,
    removeExerciseFromWorkout,
    setActiveWorkout,
    updateExerciseSets,
    updateWorkoutName,
    startWorkout
  } = useContext(WorkoutContext);

  const { setActiveWorkout: setActiveWorkoutProgram } =
    useContext(ProgramContext);

  const activeWorkout = workoutState.activeWorkout;
  const contextType = route?.params?.contextType || 'workout';

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState(
    activeWorkout.name || 'Workout'
  );
  const inputRef = useRef(null);
  const swipeableRef = useRef(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [time, setTime] = useState(0);
  const [showExerciseInfo, setShowExerciseInfo] = useState(false);
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const [imageOpacity] = useState(new Animated.Value(1));
  const timerRef = useRef(null);

  const navigation = useNavigation();

  const scrollViewRef = useRef(null);

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor,
    themeState.textColor
  );

  const currentExercise = activeWorkout.exercises[currentExerciseIndex];
  const currentSets = activeWorkout.exercises[currentExerciseIndex]?.sets || [];

  useEffect(() => {
    if (activeWorkout.exercises.length === 0) {
      navigation.goBack();
      return;
    }
  }, [activeWorkout.exercises, navigation]);

  // Effect to animate image opacity when showing exercise info
  useEffect(() => {
    let timeoutId;
    if (showExerciseInfo) {
      // Set a timer to hide the info after 2 seconds
      timeoutId = setTimeout(() => {
        setShowExerciseInfo(false);
      }, 2000); // 2 seconds
    }
    // Cleanup the timer when showExerciseInfo changes or component unmounts
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showExerciseInfo]);

  // For exercise info auto-hide timer

  useEffect(() => {
    if (activeWorkout.exercises.length === 0) {
      navigation.goBack();
      return;
    }
  }, [activeWorkout.exercises, navigation]);

  useEffect(() => {
    const currentExercise = activeWorkout.exercises[currentExerciseIndex];
    if (
      currentExercise &&
      JSON.stringify(currentExercise.sets) !== JSON.stringify(currentSets)
    ) {
      updateExerciseSets(currentExercise.id, currentSets);
    }
  }, [currentSets, activeWorkout, currentExerciseIndex]);

  // Dismiss keyboard when tapping outside
  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
    if (isEditingTitle) {
      handleTitleSubmit();
    }
  }, [isEditingTitle, handleTitleSubmit]);

  // Function to handle input focus
  const handleInputFocus = useCallback(index => {
    if (scrollViewRef.current) {
      // Calculate the position to scroll to (adjust these values based on your layout)
      const yOffset = index * 50; // Approximate height of each input row
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  }, []);

  const handleTitlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditingTitle(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleEditTitleChange = text => {
    setWorkoutTitle(text);
  };

  const handleTitleSubmit = useCallback(() => {
    setIsEditingTitle(false);
    if (workoutTitle.trim() !== activeWorkout.name) {
      updateWorkoutName(workoutTitle.trim());
    }
  }, [workoutTitle, activeWorkout.name, updateWorkoutName]);

  const handleCancel = () => navigation.goBack();

  const startTimer = () => {
    const workoutId = workoutState.activeWorkout.id;
    if (!isStarted) {
      setIsStarted(true);
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
      startWorkout(workoutId);
    }
  };

  const pauseTimer = () => {
    if (isStarted && !isPaused) {
      clearInterval(timerRef.current);
      setIsPaused(true);
    } else if (isStarted && isPaused) {
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
  };

  const stopTimer = async () => {
    try {
      // Stop the timer first
      clearInterval(timerRef.current);

      // Validate active workout
      if (!activeWorkout) {
        throw new Error('No active workout found');
      }

      // Create a local copy of the workout data to avoid hook-related issues
      const workoutData = {
        ...activeWorkout,
        exercises: activeWorkout.exercises
          .map(exercise => ({
            ...exercise,
            sets: (exercise.sets || []).filter(set => {
              const weight = set.weight;
              const reps = set.reps;
              return !isNaN(weight) && !isNaN(reps) && reps > 0;
            })
          }))
          .filter(exercise => exercise.sets.length > 0)
      };

      // Validate workout data
      if (!workoutData.exercises || workoutData.exercises.length === 0) {
        throw new Error(
          'Workout must have at least one exercise with valid sets'
        );
      }

      // Update states
      setIsStarted(false);
      setIsPaused(false);

      // Update workout name if changed
      if (workoutTitle.trim() !== workoutData.name) {
        await updateWorkoutName(workoutTitle.trim());
      }

      // Calculate duration (minimum 1 minute)
      const durationInMinutes = Math.max(1, Math.floor(time / 60));

      // Complete the workout
      await completeWorkout(durationInMinutes);

      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Failed to complete workout:', error);
      Alert.alert(
        'Error',
        error.message ||
          'Failed to save workout. Please ensure all exercises have valid sets with weight and reps.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    // Add leading zeros using padStart
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `T+${formattedMinutes}:${formattedSeconds}`;
  };

  const handlePause = () => pauseTimer();

  const handleAddExercises = () => {
    console.log('contextType in handleAddExercise', contextType);
    if (contextType === 'workout') {
      setActiveWorkout(workoutState.activeWorkout.id);
    } else if (contextType === 'program') {
      setActiveWorkoutProgram(workoutState.activeWorkout.id);
    }
    navigation.navigate('ExerciseSelection', {
      contextType: contextType,
      isNewProgram: contextType === 'program',
      programId: workoutState.activeWorkout.id
    });
  };

  const handleDeleteExercise = async exerciseId => {
    // Close swipe action first
    swipeableRef.current?.close();

    // Wait a brief moment for the animation to complete
    await new Promise(resolve => setTimeout(resolve, 200));

    removeExerciseFromWorkout(exerciseId);

    if (currentExerciseIndex >= activeWorkout.exercises.length - 1) {
      setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1));
    }
  };

  const handleNextExercise = () => {
    console.log('Current Exercise Index:', currentExerciseIndex);
    console.log(
      'Next Exercise:',
      activeWorkout.exercises[currentExerciseIndex + 1]
    );
    if (currentExerciseIndex < activeWorkout.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const handlePreviousExercise = () => {
    console.log('Current Exercise Index:', currentExerciseIndex);
    console.log(
      'Previous Exercise:',
      activeWorkout.exercises[currentExerciseIndex - 1]
    );
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  const handleAddSet = () => {
    const currentExercise = activeWorkout.exercises[currentExerciseIndex];
    const newSet = {
      id: Crypto.randomUUID(),
      weight: '',
      reps: '',
      order: (currentSets.length || 0) + 1
    };

    updateExerciseSets(currentExercise.id, [...currentSets, newSet]);
  };

  const handleSetChange = (index, field, value) => {
    const currentExercise = activeWorkout.exercises[currentExerciseIndex];
    const updatedSets = currentSets.map(set =>
      set.order === index + 1 ? { ...set, [field]: value } : set
    );
    updateExerciseSets(currentExercise.id, updatedSets);
  };

  const handleDeleteSet = setId => {
    const currentExercise = activeWorkout.exercises[currentExerciseIndex];
    const updatedSets = currentSets
      .filter(s => String(s.id) !== String(setId))
      .map((s, idx) => ({ ...s, order: idx + 1 }));
    updateExerciseSets(currentExercise.id, updatedSets);
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView
        style={[
          globalStyles.container,
          { backgroundColor: themedStyles.primaryBackgroundColor }
        ]}
      >
        <Header pageName='WORKOUT' />
        <View style={styles.header}>
          {/* workout title starts here */}
          <Animated.View>
            {isEditingTitle ? (
              <TextInput
                ref={inputRef}
                style={[styles.workoutName, { color: themedStyles.textColor }]}
                value={workoutTitle}
                onChangeText={handleEditTitleChange}
                onBlur={handleTitleSubmit}
                onSubmitEditing={handleTitleSubmit}
              />
            ) : (
              <TouchableOpacity onPress={handleTitlePress}>
                <Text
                  style={[
                    styles.workoutName,
                    { color: themedStyles.textColor }
                  ]}
                >
                  {workoutTitle}
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
          {/* workout title ends here */}
        </View>
        {activeWorkout.exercises.length > 0 && (
          <View style={styles.mainControls}>
            <TouchableOpacity
              style={[
                styles.startButton,
                { backgroundColor: themedStyles.secondaryBackgroundColor }
              ]}
              onPress={isStarted ? stopTimer : startTimer}
            >
              <Text
                style={[
                  styles.startButtonText,
                  { color: themedStyles.textColor }
                ]}
              >
                {isStarted ? 'COMPLETE WORKOUT' : 'START WORKOUT'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePause}
              style={[
                styles.pauseButton,
                { backgroundColor: themedStyles.accentColor },
                !isStarted && styles.disabledButton
              ]}
              disabled={!isStarted}
            >
              <Ionicons
                name={isPaused ? 'play-outline' : 'pause-outline'}
                size={24}
                style={[styles.pauseIcon, !isStarted && styles.disabledIcon]}
              />
            </TouchableOpacity>
            <Text
              style={[styles.timerDisplay, { color: themedStyles.accentColor }]}
            >
              {formatTime(time)}
            </Text>
          </View>
        )}

        {/* exercise start */}
        <SafeAreaView style={[globalStyles.container]}>
          <View style={styles.swipeableContainer}>
            {/* Navigation buttons and content wrapper */}
            {!showExerciseInfo &&
              !isSwipeOpen &&
              activeWorkout.exercises.length > 1 &&
              !isKeyboardVisible && (
                <View
                  style={[
                    styles.navigationWrapper,
                    styles.topNavigationWrapper
                  ]}
                >
                  <TouchableOpacity
                    onPress={handlePreviousExercise}
                    disabled={currentExerciseIndex === 0}
                    style={[
                      styles.navigationButton,
                      currentExerciseIndex === 0 && styles.disabledButton
                    ]}
                  >
                    <Ionicons
                      name='chevron-up-outline'
                      size={24}
                      style={{
                        color: themeState.accentColor,
                        opacity: currentExerciseIndex === 0 ? 0.3 : 1
                      }}
                    />
                  </TouchableOpacity>
                </View>
              )}

            {/* Swipeable Content */}
            <SwipeableItemDeletion
              ref={swipeableRef}
              swipeableType='exercise-start'
              onDelete={() => handleDeleteExercise(currentExercise?.id)}
              onSwipeChange={setIsSwipeOpen}
              style={[
                {
                  backgroundColor: themedStyles.secondaryBackgroundColor,
                  paddingTop: 10
                }
              ]}
            >
              <View style={[styles.exerciseContainer]}>
                <View
                  style={[
                    styles.exerciseImageWrapper,
                    { opacity: isKeyboardVisible ? 0.1 : 1 }
                  ]}
                >
                  {currentExercise ? (
                    <ExerciseImage
                      exercise={currentExercise}
                      resizeMode='contain'
                      showOverlay={true}
                    />
                  ) : (
                    <View style={styles.placeholderImage} />
                  )}

                  {showExerciseInfo && (
                    <View style={styles.infoOverlay}>
                      <Text
                        style={[
                          styles.exerciseName,
                          { color: themedStyles.textColor }
                        ]}
                      >
                        {currentExercise?.name}
                      </Text>
                      <Text
                        style={[
                          styles.muscleName,
                          { color: themedStyles.textColor }
                        ]}
                      >
                        {currentExercise?.muscle}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </SwipeableItemDeletion>
            {!isSwipeOpen && (
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => setShowExerciseInfo(prev => !prev)}
              >
                <Ionicons
                  name='information-outline'
                  size={24}
                  color={themeState.accentColor}
                />
              </TouchableOpacity>
            )}

            {/* Next Navigation Button */}
            {activeWorkout.exercises.length > 0 &&
              !isSwipeOpen &&
              !isKeyboardVisible && (
                <View
                  style={[
                    styles.navigationWrapper,
                    styles.bottomNavigationWrapper
                  ]}
                >
                  <TouchableOpacity
                    onPress={handleNextExercise}
                    disabled={
                      currentExerciseIndex ===
                      activeWorkout.exercises.length - 1
                    }
                    style={[
                      styles.navigationButton,
                      currentExerciseIndex ===
                        activeWorkout.exercises.length - 1 &&
                        styles.disabledButton
                    ]}
                  >
                    <Ionicons
                      name='chevron-down-outline'
                      size={24}
                      style={{
                        color: themeState.accentColor,
                        opacity:
                          currentExerciseIndex ===
                          activeWorkout.exercises.length - 1
                            ? 0.3
                            : 1
                      }}
                    />
                  </TouchableOpacity>
                </View>
              )}
          </View>
        </SafeAreaView>
        {/* exercise end */}
        {activeWorkout.exercises?.length > 0 && (
          <View
            style={[
              styles.setControls,
              { backgroundColor: themeState.primaryBackgroundColor },
              isKeyboardVisible
                ? styles.setControlsKeyboardVisible
                : styles.setControlsKeyboardNotVisible
            ]}
          >
            <View
              style={[
                styles.setHeader,
                { backgroundColor: themedStyles.secondaryBackgroundColor }
              ]}
            >
              <Text
                style={[
                  styles.setHeaderText,
                  { color: themedStyles.textColor }
                ]}
              >
                Set
              </Text>
              <Text
                style={[
                  styles.setHeaderText,
                  styles.setWeight,
                  { color: themedStyles.textColor }
                ]}
              >
                Weight
              </Text>
              <Text
                style={[
                  styles.setHeaderText,
                  styles.setReps,
                  { color: themedStyles.textColor }
                ]}
              >
                Reps
              </Text>
            </View>

            <ScrollView ref={scrollViewRef} keyboardShouldPersistTaps='handled'>
              {currentSets.length === 0 && (
                <Text
                  style={[styles.noSetsText, { color: themedStyles.textColor }]}
                >
                  No Sets
                </Text>
              )}
              {currentSets.map((set, index) => (
                <Set
                  key={set.id}
                  index={set.order - 1}
                  set={set}
                  isLast={index === currentSets.length - 1}
                  onSetChange={handleSetChange}
                  onDelete={handleDeleteSet}
                  themedStyles={themedStyles}
                />
              ))}
            </ScrollView>
            <SecondaryButton
              label='Add Set'
              iconName='add-outline'
              onPress={handleAddSet}
            />
          </View>
        )}

        <View
          style={[
            styles.bottomButtons,
            isKeyboardVisible && {
              marginBottom: Platform.OS === 'ios' ? 20 : 0
            },
            { opacity: isKeyboardVisible ? 0 : 1 }
          ]}
        >
          <ParallelogramButton
            label='ADD EXERCISE'
            style={[{ width: 150, alignItems: 'center', marginLeft: 25 }]}
            onPress={() => handleAddExercises(workoutState.workout_id)}
          />
          <ParallelogramButton
            label='CANCEL'
            style={[{ width: 150, alignItems: 'center', marginRight: 25 }]}
            onPress={handleCancel}
          />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 1,
    alignItems: 'center'
  },
  workoutName: {
    fontSize: 16,
    fontFamily: 'Lexend',
    marginBottom: 5
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginVertical: 5,
    marginBottom: 10
  },
  startButton: {
    width: 180,
    height: 35,
    padding: 10,
    borderRadius: 5
  },
  startButtonText: {
    color: colors.flatBlack,
    fontSize: 14,
    fontFamily: 'Lexend',
    textAlign: 'center'
  },
  pauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pauseIcon: {
    color: colors.flatBlack,
    marginLeft: 2
  },
  timerDisplay: {
    fontSize: 26,
    fontFamily: 'Tiny5'
  },
  swipeableContainer: {
    flex: 1,
    marginHorizontal: 5,
    marginBottom: '5%',
    zIndex: 997,
    position: 'relative',
    marginTop: '2%',
    height: '45%',
    justifyContent: 'center'
  },
  exerciseContainer: {
    width: '110%',
    alignItems: 'center',
    alignSelf: 'center'
  },
  exerciseImageWrapper: {
    width: '90%',
    aspectRatio: 1.5,
    position: 'relative',
    borderRadius: 5,
    overflow: 'hidden'
  },
  exerciseContent: {
    flex: 1,
    position: 'relative'
  },
  imageNavigationContainer: {
    flex: 1,
    marginTop: 10,
    position: 'relative'
  },
  navigationWrapper: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 998
    // paddingVertical: '5%'
  },
  topNavigationWrapper: {
    top: '3%',
    paddingTop: '2%'
  },

  bottomNavigationWrapper: {
    bottom: '-2%',
    paddingBottom: '3%'
  },
  navigationButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 30,
    elevation: 3
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    aspectRatio: 1.5,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
    borderRadius: 5
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: 'Lexend',
    padding: 5,
    textAlign: 'center'
  },
  muscleName: {
    fontSize: 14,
    fontFamily: 'Lexend',
    paddingLeft: 5,
    textAlign: 'center'
  },

  exerciseGif: {
    width: '100%',
    height: '100%',

    resizeMode: 'contain'
  },
  placeholderImage: {
    width: '100%',
    height: '100%'
  },

  keyboardAvoidingView: {
    flex: 1
  },

  noSetsText: {
    textAlign: 'center',
    fontFamily: 'Lexend',
    fontSize: 16,
    marginTop: 10
  },

  setControls: {
    paddingBottom: 5
  },

  setControlsKeyboardNotVisible: {
    flex: 1,
    paddingHorizontal: 5
  },

  setControlsKeyboardVisible: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 5
  },
  scrollViewConten: {
    paddingBottom: 20
  },
  keyboardAvoidingView: {
    flex: 1
  },

  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 25,
    marginBottom: 3,
    borderRadius: 5
  },

  setHeaderText: {
    flex: 1,
    fontSize: 16,
    padding: 1,
    textAlign: 'center',
    fontFamily: 'Lexend',
    marginRight: 10
  },

  setWeight: {
    marginRight: 80
  },

  setReps: {
    marginRight: 55
  },
  addSetButtonKeyboardNotVisible: {
    marginTop: 5,
    marginLeft: 25,
    position: 'relative',
    zIndex: 1
  },
  addSetButtonKeyboardVisible: {
    marginBottom: 150
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20
  },

  bottomButtonText: {
    fontSize: 14,
    fontFamily: 'Lexend'
  },
  disabledButton: {
    opacity: 0
  },
  disabledIcon: {
    opacity: 4
  },
  infoButton: {
    position: 'absolute',
    top: '5%',
    right: '3%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 30,
    padding: 10,
    zIndex: 1000,
    elevation: 5
  },
  infoOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    justifyContent: 'center'
  },

  noExerciseContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20
  },
  noExerciseText: {
    fontSize: 18,
    fontFamily: 'Lexend',
    textAlign: 'center'
  },
  addExerciseButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20
  },
  addExerciseButtonText: {
    color: colors.flatBlack,
    fontFamily: 'Lexend',
    fontSize: 14
  },
  workoutName: {
    fontSize: 16,
    fontFamily: 'Lexend',
    textAlign: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    minWidth: 100
  }
});

export default withKeyboardAvoidingView(StartWorkoutView);
