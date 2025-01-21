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
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import { useNavigation } from '@react-navigation/native';
import { WorkoutContext } from '../src/context/workoutContext';
import { ProgramContext } from '../src/context/programContext';
import PillButton from '../components/PillButton';
import SwipeableItemDeletion from '../components/SwipeableItemDeletion';
import Header from '../components/Header';
import Set from '../components/Set';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { globalStyles, colors } from '../src/styles/globalStyles';
import { getCachedImage } from '../src/utils/imageCache';

const StartWorkoutView = ({ route }) => {
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

  //keyboard handling
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef(null);

  // keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );
    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  const currentExercise = activeWorkout.exercises[currentExerciseIndex];
  const currentSets = activeWorkout.exercises[currentExerciseIndex]?.sets || [];

  // useEffect(() => {
  //   if (currentExercise?.catalogExerciseId) {
  //     const cachedUrl = getCachedImage(currentExercise.catalogExerciseId);
  //     console.log(
  //       `[StartWorkout] Current exercise ${
  //         currentExercise.catalogExerciseId
  //       }: ${cachedUrl ? 'using cached image' : 'no cached image'}`
  //     );
  //   }
  // }, [currentExercise]);

  // Add logging for important state changes
  useEffect(() => {
    if (activeWorkout.exercises.length === 0) {
      navigation.goBack();
      return;
    }
  }, [activeWorkout.exercises, navigation]);

  // Effect to animate image opacity when showing exercise info
  useEffect(() => {
    //Handle opacity animation
    Animated.timing(imageOpacity, {
      toValue: showExerciseInfo ? 0.3 : 1,
      duration: 200,
      useNativeDriver: true
    }).start();
    // Handle auto-hide timer
    let timer;
    if (showExerciseInfo) {
      timer = setTimeout(() => setShowExerciseInfo(false), 2000);
    }
    return () => clearTimeout(timer);
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

  const imageOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `rgba(0,0,0,${themedStyles.overlayOpacity})`,
    zIndex: 1,
    borderRadius: 10
  };

  const infoOverlayStyle = {
    position: 'absolute',
    width: '100%',
    bottom: 230,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: `rgba(0,0,0,${themedStyles.overlayOpacity})`,
    padding: 10,
    // marginLeft: 16,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10
  };

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
      clearInterval(timerRef.current);
      setIsStarted(false);
      setIsPaused(false);

      // Validate that we have an active workout
      if (!activeWorkout) {
        throw new Error('No active workout found');
      }

      // Ensure we're using the most current workout name
      if (workoutTitle.trim() !== activeWorkout.name) {
        await updateWorkoutName(workoutTitle.trim());
      }

      // Validate exercises
      if (!activeWorkout.exercises || !Array.isArray(activeWorkout.exercises)) {
        throw new Error('No exercises found in workout');
      }

      if (activeWorkout.exercises.length === 0) {
        throw new Error('Workout must have at least one exercise');
      }

      // Validate sets
      const exercisesWithSets = activeWorkout.exercises
        .map(exercise => {
          if (!exercise.sets || !Array.isArray(exercise.sets)) {
            console.error('Invalid sets for exercise:', exercise.id);
            return null;
          }

          const validSets = exercise.sets.filter(set => {
            const weight = parseInt(set.weight);
            const reps = parseInt(set.reps);
            return !isNaN(weight) && !isNaN(reps);
          });

          return validSets.length > 0
            ? {
                ...exercise,
                sets: validSets
              }
            : null;
        })
        .filter(Boolean);

      if (exercisesWithSets.length === 0) {
        throw new Error(
          'At least one exercise must have valid sets with weight and reps'
        );
      }

      // Calculate duration - ensure it's at least 1 minute
      const durationInMinutes = Math.max(1, Math.floor(time / 60));
      // Complete workout with duration
      await completeWorkout(durationInMinutes);

      navigation.goBack();
    } catch (error) {
      console.error('Failed to complete workout:', error);
      Alert.alert(
        'Error',
        error.message ||
          'Failed to save workout. Please ensure all required fields are filled out.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
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
    if (currentExerciseIndex < activeWorkout.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const handlePreviousExercise = () => {
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
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
                  style={[
                    styles.workoutName,
                    { color: themedStyles.textColor }
                  ]}
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
                  globalStyles.button,
                  styles.startButton,
                  { backgroundColor: themedStyles.accentColor }
                ]}
                onPress={isStarted ? stopTimer : startTimer}
              >
                <Text style={styles.startButtonText}>
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
                style={[
                  styles.timerDisplay,
                  { color: themedStyles.accentColor }
                ]}
              >
                {formatTime(time)}
              </Text>
            </View>
          )}

          {/* exercise start */}
          <SafeAreaView
            style={[
              globalStyles.container,
              { backgroundColor: themedStyles.primaryBackgroundColor }
            ]}
          >
            <View style={styles.swipeableContainer}>
              {/* Previous Navigation Button */}
              {!showExerciseInfo &&
                !isSwipeOpen &&
                activeWorkout.exercises.length > 1 && (
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
              >
                {!activeWorkout.exercises ||
                activeWorkout.exercises.length === 0 ? (
                  <View
                    style={[
                      styles.exerciseContainer,
                      { backgroundColor: themedStyles.secondaryBackgroundColor }
                    ]}
                  >
                    <View style={styles.noExerciseContainer}>
                      <Text
                        style={[
                          styles.noExerciseText,
                          { color: themedStyles.textColor }
                        ]}
                      >
                        No Exercises
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.addExerciseButton,
                          { backgroundColor: themedStyles.accentColor }
                        ]}
                        onPress={handleAddExercises}
                      >
                        <Text style={styles.addExerciseButtonText}>
                          ADD EXERCISE
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.exerciseContainer,
                      { backgroundColor: themedStyles.secondaryBackgroundColor }
                    ]}
                  >
                    <View style={styles.exerciseImage}>
                      <View style={imageOverlayStyle} />
                      {currentExercise?.imageUrl ? (
                        <Animated.Image
                          source={{
                            uri: (() => {
                              const cachedUrl = getCachedImage(
                                currentExercise.catalogExerciseId
                              );
                              const finalUrl =
                                cachedUrl || currentExercise.imageUrl;

                              return finalUrl;
                            })()
                          }}
                          style={[
                            styles.exerciseGif,
                            { opacity: imageOpacity }
                          ]}
                          resizeMode='contain'
                        />
                      ) : (
                        <View style={styles.placeholderImage} />
                      )}
                      {!showExerciseInfo && !isSwipeOpen && (
                        <TouchableOpacity
                          style={styles.infoButton}
                          onPress={() => setShowExerciseInfo(true)}
                        >
                          <Ionicons
                            name='information-outline'
                            size={24}
                            color={themeState.accentColor}
                          />
                        </TouchableOpacity>
                      )}

                      {showExerciseInfo && (
                        <View style={infoOverlayStyle}>
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
                )}
              </SwipeableItemDeletion>

              {/* Next Navigation Button */}
              {activeWorkout.exercises.length > 0 && !isSwipeOpen && (
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
                { backgroundColor: themeState.primaryBackgroundColor }
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

              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
              >
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.setsScrollView}
                  contentContainerStyle={styles.setsScrollContent}
                  keyboardShouldPersistTaps='handled'
                  showsVerticalScrollIndicator={true}
                >
                  {currentSets.length === 0 && (
                    <Text
                      style={{
                        color: themedStyles.textColor,
                        textAlign: 'center',
                        fontFamily: 'Lexend',
                        marginTop: 10
                      }}
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
                      onFocus={() => {
                        if (scrollViewRef.current) {
                          scrollViewRef.current.scrollTo({
                            y: index * 50,
                            animated: true
                          });
                        }
                      }}
                    />
                  ))}
                </ScrollView>
              </KeyboardAvoidingView>
              <PillButton
                label='Add Set'
                style={styles.addSetButton}
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
                onPress={handleAddSet}
              />
            </View>
          )}

          <View
            style={[
              styles.bottomButtons,
              isKeyboardVisible && {
                marginBottom: Platform.OS === 'ios' ? 20 : 0
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.bottomButton,
                { backgroundColor: themedStyles.secondaryBackgroundColor }
              ]}
              onPress={() => handleAddExercises(workoutState.workout_id)}
            >
              <Text
                style={[
                  styles.bottomButtonText,
                  { color: themedStyles.accentColor }
                ]}
              >
                ADD EXERCISE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.bottomButton,
                { backgroundColor: themedStyles.secondaryBackgroundColor }
              ]}
              onPress={handleCancel}
            >
              <Text
                style={[
                  styles.bottomButtonText,
                  { color: themedStyles.accentColor }
                ]}
              >
                CANCEL
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 5,
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
    marginVertical: 5
  },
  startButton: {
    width: 190,
    height: 35,
    padding: 9
  },
  startButtonText: {
    color: colors.flatBlack,
    fontSize: 14,
    fontFamily: 'Lexend'
  },
  pauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pauseIcon: {
    color: colors.flatBlack
  },
  timerDisplay: {
    fontSize: 26,
    fontFamily: 'Tiny5'
  },
  swipeableContainer: {
    flex: 1,
    marginHorizontal: 5,
    marginBottom: 10
  },
  exerciseContainer: {
    padding: 10,
    height: 350,
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    borderRadius: 10
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
    left: '50%',
    transform: [{ translateX: -20 }],
    alignItems: 'center',
    zIndex: 10
  },
  topNavigationWrapper: {
    top: 12
  },

  bottomNavigationWrapper: {
    bottom: -150
  },
  navigationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    zIndex: 20
  },
  exerciseImage: {
    width: '91%',
    height: 330,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative'
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: 'Lexend',
    padding: 5
  },
  muscleName: {
    fontSize: 14,
    fontFamily: 'Lexend',
    paddingLeft: 5
  },

  exerciseGif: {
    width: '100%',
    height: '100%',
    borderRadius: 10
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#444',
    borderRadius: 10
  },
  setControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 5,
    maxHeight: '30%'
  },

  keyboardAvoidingView: {
    flex: 1
  },

  setsScrollView: {
    maxHeight: 150
  },

  setsScrollContent: {
    gap: 2
  },
  noSetsText: {
    textAlign: 'center',
    fontFamily: 'Lexend',
    marginTop: 10
  },

  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 25,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginBottom: 2
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
  addSetButton: {
    marginTop: 6,
    marginBottom: 6,
    marginLeft: 5,
    height: 25
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5
  },
  bottomButton: {
    flex: 1,
    height: 35,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10
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
    top: 10,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 30,
    padding: 4,
    zIndex: 10
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

export default StartWorkoutView;
