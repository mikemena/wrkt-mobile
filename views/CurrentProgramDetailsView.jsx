import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { WorkoutContext } from '../src/context/workoutContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import Header from '../components/Header';
import { globalStyles, colors } from '../src/styles/globalStyles';

const CurrentProgramDetailsView = ({ navigation }) => {
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const { state: workoutState, setActiveWorkout } = useContext(WorkoutContext);

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  const program = workoutState.activeProgram;
  const workouts = program?.workouts || [];

  const totalWorkouts = workouts.length;

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', e => {});
    return unsubscribe;
  }, [navigation]);

  const currentWorkout = workouts[currentWorkoutIndex] || null;

  const handleStartWorkout = () => {
    if (currentWorkout) {
      setActiveWorkout(currentWorkout.id);

      const workoutData = {
        id: currentWorkout.id,
        name: currentWorkout.name,
        exercises: currentWorkout.exercises.map(ex => ({
          ...ex,
          name: ex.name,
          equipment: ex.equipment,
          sets: ex.sets || []
        })),
        programId: currentWorkout.programId
      };

      navigation.navigate('StartWorkout', {
        workout: workoutData
      });
    }
  };

  const handleBack = () => {
    navigation.navigate('CurrentProgram');
  };

  const handlePreviousWorkout = () => {
    if (currentWorkoutIndex > 0) {
      setCurrentWorkoutIndex(prev => prev - 1);
    }
  };

  const handleNextWorkout = () => {
    if (currentWorkoutIndex < totalWorkouts - 1) {
      setCurrentWorkoutIndex(prev => prev + 1);
    }
  };

  if (!program) {
    return (
      <SafeAreaView
        style={[
          globalStyles.container,
          { backgroundColor: themedStyles.primaryBackgroundColor }
        ]}
      >
        <Header pageName='WORKOUT' />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themedStyles.textColor }]}>
            Loading program details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentWorkout) {
    return <Text>Loading...</Text>;
  }

  return (
    <SafeAreaView
      style={[
        globalStyles.container,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <Header pageName='WORKOUT' />
      <ScrollView style={globalStyles.container}>
        <Text style={[styles.title, { color: themedStyles.textColor }]}>
          {program.name}
        </Text>
        <View style={styles.progressContainer}>
          <TouchableOpacity
            onPress={handleBack}
            style={[
              { backgroundColor: themedStyles.secondaryBackgroundColor },
              globalStyles.iconCircle,
              styles.backButton
            ]}
          >
            <Ionicons
              name={'arrow-back-outline'}
              style={[globalStyles.icon, { color: themedStyles.textColor }]}
              size={24}
            />
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${currentWorkout.progress}%` }
              ]}
            />
            <Text style={styles.progressText}>{currentWorkout.progress}%</Text>
          </View>
        </View>

        <View
          style={[
            styles.workoutInfo,
            { backgroundColor: themedStyles.secondaryBackgroundColor }
          ]}
        >
          <TouchableOpacity
            onPress={handlePreviousWorkout}
            disabled={currentWorkoutIndex === 0}
            style={[
              styles.navigationButton,
              currentWorkoutIndex === 0
                ? styles.navigationButtonDisabled
                : styles.navigationButtonEnabled
            ]}
          >
            <Ionicons
              name='chevron-back-outline'
              size={24}
              style={{
                color: themeState.accentColor
              }}
            />
          </TouchableOpacity>
          <View>
            <Text
              style={[
                styles.workoutNumber,
                { color: themedStyles.accentColor }
              ]}
            >
              WORKOUT {currentWorkoutIndex + 1} of {totalWorkouts}
            </Text>
            <Text
              style={[styles.workoutName, { color: themedStyles.textColor }]}
            >
              {currentWorkout?.name}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleNextWorkout}
            disabled={currentWorkoutIndex === totalWorkouts - 1}
            style={[
              styles.navigationButton,
              currentWorkoutIndex === totalWorkouts - 1
                ? styles.navigationButtonDisabled
                : styles.navigationButtonEnabled
            ]}
          >
            <Ionicons
              name='chevron-forward-outline'
              size={24}
              style={{
                color: themeState.accentColor
              }}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: themedStyles.secondaryBackgroundColor }
          ]}
        >
          <Text
            style={[styles.sectionTitle, { color: themedStyles.textColor }]}
          >
            {currentWorkout.exercises.length} EXERCISES
          </Text>
          {currentWorkout.exercises.map((exercise, index) => (
            <Text
              key={index}
              style={[styles.exerciseName, { color: themedStyles.textColor }]}
            >
              {exercise.name}
            </Text>
          ))}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: themedStyles.secondaryBackgroundColor }
          ]}
        >
          <Text
            style={[styles.sectionTitle, { color: themedStyles.textColor }]}
          >
            EQUIPMENT NEEDED
          </Text>
          {/* Get unique equipment from exercises */}
          {[...new Set(currentWorkout.exercises.map(ex => ex.equipment))].map(
            (item, index) => (
              <Text
                key={index}
                style={[
                  styles.equipmentItem,
                  { color: themedStyles.textColor }
                ]}
              >
                {item}
              </Text>
            )
          )}
        </View>

        <View
          style={[
            styles.infoRow,
            { backgroundColor: themedStyles.secondaryBackgroundColor }
          ]}
        >
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: themedStyles.textColor }]}>
              TYPICAL DURATION
            </Text>
            <Text style={[styles.infoValue, { color: themedStyles.textColor }]}>
              {currentWorkout.typicalDuration} MINUTES
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: themedStyles.textColor }]}>
              LAST COMPLETED
            </Text>
            <Text style={[styles.infoValue, { color: themedStyles.textColor }]}>
              {currentWorkout.lastCompleted}
            </Text>
          </View>
        </View>
        <View style={globalStyles.centeredButtonContainer}>
          <TouchableOpacity
            style={[
              globalStyles.button,
              {
                backgroundColor: themedStyles.accentColor
              }
            ]}
            onPress={handleStartWorkout}
          >
            <Text style={[globalStyles.buttonText, { color: colors.black }]}>
              GO TO WORKOUT
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Lexend',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: 'semibold',
    marginBottom: 10
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 5,
    gap: 10
  },
  backButton: {
    marginRight: 5
  },
  progressBar: {
    flex: 1,
    height: 35,
    backgroundColor: '#444',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 10
  },
  progressText: {
    fontFamily: 'Lexend',
    position: 'absolute',
    right: 10,
    color: 'white',
    lineHeight: 35
  },
  workoutInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    padding: 10
  },
  navArrow: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  workoutNumber: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  workoutName: {
    fontFamily: 'Lexend',
    fontSize: 18
  },
  section: {
    marginBottom: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    padding: 10
  },
  sectionTitle: {
    fontFamily: 'Lexend',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  exerciseName: {
    fontFamily: 'Lexend',
    fontSize: 16,
    marginBottom: 10,
    marginLeft: 10
  },
  equipmentItem: {
    fontFamily: 'Lexend',
    fontSize: 16,
    marginBottom: 10,
    marginLeft: 10
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginHorizontal: 5,
    borderRadius: 10,
    padding: 10
  },
  infoItem: {
    flex: 1,
    marginLeft: 10
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 5
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  navigationButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  navigationButtonEnabled: {
    opacity: 1
  },
  navigationButtonDisabled: {
    opacity: 0.2
  },
  navigationIcon: {
    width: 24,
    height: 24
  }
});

export default CurrentProgramDetailsView;
