import React, { useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ProgramContext } from '../src/context/programContext';
import ParallelogramButton from '../components/ParallelogramButton';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { programService } from '../src/services/programService';
import { globalStyles } from '../src/styles/globalStyles';
import Header from '../components/Header';
import Workout from '../components/Workout';
import useExpandedItems from '../src/hooks/useExpandedItems';

const ProgramDetails = () => {
  const { setMode, state, initializeEditProgramState, deleteProgram } =
    useContext(ProgramContext);
  const navigation = useNavigation();
  const route = useRoute();
  const workouts = state.workout.workouts;
  const { toggleItem, isItemExpanded } = useExpandedItems(workouts);
  const { program } = route.params;
  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  useEffect(() => {
    setMode('view');
  }, []);

  const handleEditProgram = () => {
    initializeEditProgramState(program, program.workouts);
    navigation.navigate('EditProgram', { program });
  };

  const handleDeleteProgram = async programId => {
    await programService.deleteProgram(programId);
    navigation.goBack();
  };

  const formatDuration = (duration, unit) => {
    const capitalizedUnit = unit.charAt(0).toUpperCase() + unit.slice(1);
    const formattedUnit =
      duration === 1 ? capitalizedUnit.slice(0, -1) : capitalizedUnit;
    return `${duration} ${formattedUnit}`;
  };

  const renderWorkout = workout => (
    <View key={workout.id} style={styles.workoutContainer}>
      <Workout
        key={workout.id}
        workout={workout}
        isExpanded={isItemExpanded(workout.id)}
        onToggleExpand={() => toggleItem(workout.id)}
        swipeEnabled={false}
        variant='program-details'
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[
        globalStyles.container,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <Header pageName='Program Details' />
      <View style={globalStyles.container}>
        <ScrollView
          style={[{ backgroundColor: themedStyles.primaryBackgroundColor }]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[
                { backgroundColor: themedStyles.secondaryBackgroundColor },
                globalStyles.iconCircle
              ]}
            >
              <Ionicons
                name={'arrow-back-outline'}
                style={[globalStyles.icon, { color: themedStyles.textColor }]}
                size={24}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.programItem,
              { backgroundColor: themedStyles.secondaryBackgroundColor }
            ]}
          >
            <Text
              style={[styles.programTitle, { color: themedStyles.accentColor }]}
            >
              {program.name}
            </Text>
            <View>
              <View style={styles.detailRow}>
                <Text
                  style={[
                    styles.detailLabel,
                    { color: themedStyles.textColor }
                  ]}
                >
                  Main Goal
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: themedStyles.textColor }
                  ]}
                >
                  {program.mainGoal.charAt(0).toUpperCase() +
                    program.mainGoal.slice(1)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text
                  style={[
                    styles.detailLabel,
                    { color: themedStyles.textColor }
                  ]}
                >
                  Duration
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: themedStyles.textColor }
                  ]}
                >
                  {formatDuration(
                    program.programDuration,
                    program.durationUnit
                  )}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text
                  style={[
                    styles.detailLabel,
                    { color: themedStyles.textColor }
                  ]}
                >
                  Days Per Week
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: themedStyles.textColor }
                  ]}
                >
                  {program.daysPerWeek}
                </Text>
              </View>
            </View>
          </View>

          {program.workouts.map(renderWorkout)}

          <View style={styles.buttonContainer}>
            <ParallelogramButton
              label='EDIT'
              style={[{ width: 150, alignItems: 'center' }]}
              onPress={handleEditProgram}
            />
            <ParallelogramButton
              label='DELETE'
              style={[{ width: 150, alignItems: 'center' }]}
              onPress={() => handleDeleteProgram(program.id)}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  programItem: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 5
  },
  programTitle: {
    fontFamily: 'Lexend',
    fontSize: 16,
    marginBottom: 5
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 5
  },
  detailLabel: {
    fontFamily: 'Lexend',
    fontSize: 14,
    width: 120,
    marginRight: 10
  },
  detailValue: {
    fontFamily: 'Lexend-Bold',
    fontWeight: '600',
    fontSize: 14,
    flex: 1
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginHorizontal: 20
  },
  workoutContainer: {
    paddingBottom: 5
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
    fontFamily: 'Lexend-Bold',
    fontSize: 16,
    flex: 1
  },
  exerciseCount: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  exerciseCountText: {
    fontFamily: 'Lexend',
    fontSize: 12,
    marginRight: 10,
    marginTop: 5
  },
  addText: {
    fontFamily: 'Lexend-Bold',
    fontSize: 12
  },
  workoutContent: {
    padding: 16
  },
  exerciseItem: {
    marginBottom: 10
  },
  exerciseName: {
    fontFamily: 'Lexend-Bold',
    fontSize: 14
  },
  exerciseDetails: {
    fontFamily: 'Lexend',
    fontSize: 12
  }
});

export default ProgramDetails;
