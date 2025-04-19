// components/ExerciseSelection.jsx (Debugged version)
import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
  useMemo
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet
} from 'react-native';
import debounce from 'lodash/debounce';
import { ProgramContext } from '../src/context/programContext';
import { WorkoutContext } from '../src/context/workoutContext';
import { useUserEquipment } from '../src/context/userEquipmentContext';
import { useStaticData } from '../src/context/staticDataContext';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { globalStyles, colors } from '../src/styles/globalStyles';
import SecondaryButton from './SecondaryButton';
import ExerciseFilter from './ExerciseFilter';
import ExerciseImage from './ExerciseImage';

const ExerciseSelection = ({ navigation, route }) => {
  const { addExercise, state: programState } = useContext(ProgramContext);
  const { addExerciseToWorkout, state: workoutState } =
    useContext(WorkoutContext);
  const { userEquipment } = useUserEquipment();
  const { isLoaded, filterExercises, getFormattedExercises } = useStaticData();

  // Add logging to debug
  console.log('ExerciseSelection rendered, isLoaded:', isLoaded);
  console.log('UserEquipment:', userEquipment);

  const programAction = programState.mode;
  const contextType = route.params?.contextType;
  const programId = route.params?.programId;

  // Refs
  const initialLoadRef = useRef(true);
  const flatListRef = useRef(null);
  const hasAppliedUserEquipmentRef = useRef(false);

  // State
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterValues, setFilterValues] = useState({
    exerciseName: '',
    muscles: [],
    equipment: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  // Create debounced filter function
  const debouncedFilterChange = useMemo(
    () =>
      debounce((key, value) => {
        console.log(`Debounced filter change: ${key} = ${value}`);
        setFilterValues(prev => {
          const newValues = { ...prev, [key]: value };
          return newValues;
        });
      }, 300),
    []
  );

  // Apply user equipment filter once when component mounts
  useEffect(() => {
    if (
      !hasAppliedUserEquipmentRef.current &&
      userEquipment &&
      userEquipment.length > 0
    ) {
      console.log(
        'Applying user equipment filter automatically:',
        userEquipment
      );

      // Update filter values with user equipment
      setFilterValues(prev => {
        const updated = {
          ...prev,
          equipment: userEquipment
        };
        console.log('Updated filter values with equipment:', updated);
        return updated;
      });

      // Mark that we've applied the user equipment filter
      hasAppliedUserEquipmentRef.current = true;
    }
  }, [userEquipment]);

  // Apply filters when they change
  useEffect(() => {
    // Skip first render
    if (initialLoadRef.current) {
      console.log('Skipping first render for filter');
      initialLoadRef.current = false;
      return;
    }

    if (isLoaded) {
      console.log('Applying filter changes, isLoaded:', isLoaded);
      setIsLoading(true);

      // Get filtered exercises from static data context
      console.log('Filtering with:', filterValues);
      const filtered = filterExercises(filterValues);
      console.log('Got filtered exercises:', filtered?.length);

      setExercises(filtered);
      setFilteredExercises(filtered);

      // Scroll back to the top when filter changes
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }

      setIsLoading(false);
    } else {
      console.log('Not applying filters because data is not loaded yet');
    }
  }, [filterValues, isLoaded]);

  // Initial data load
  useEffect(() => {
    console.log('Initial data load effect triggered, isLoaded:', isLoaded);

    if (isLoaded) {
      console.log('Data is loaded, initializing exercises');

      // Check if we should wait for equipment filter
      if (userEquipment && userEquipment.length > 0) {
        console.log(
          'User has equipment, will wait for equipment filter to trigger'
        );
        return;
      }

      console.log('No user equipment, fetching all exercises');
      // If no user equipment, do the initial fetch as normal
      const initialExercises = filterExercises({});
      console.log('Initial exercise count:', initialExercises?.length);

      setExercises(initialExercises || []);
      setFilteredExercises(initialExercises || []);
      setIsLoading(false);
    } else {
      console.log('Static data not loaded yet, waiting...');
    }
  }, [isLoaded]);

  // Set selected exercises based on context
  useEffect(() => {
    if (contextType === 'workout') {
      // For workout context, use the exercises from workoutState
      setSelectedExercises(workoutState.activeWorkout?.exercises || []);
    } else if (contextType === 'program') {
      // For program context, use the exercises from active workout
      const activeWorkout = programState.workout.workouts.find(
        w => w.id === programState.workout.activeWorkout
      );
      if (activeWorkout) {
        setSelectedExercises(activeWorkout.exercises || []);
      }
    }
  }, [contextType, workoutState.activeWorkout, programState.workout]);

  // Force reload exercise data - backup if other methods fail
  useEffect(() => {
    // This is a fallback for if the exercises aren't loading properly
    const timer = setTimeout(() => {
      if (isLoaded && filteredExercises.length === 0 && !isLoading) {
        console.log(
          'No exercises loaded after timeout, trying direct approach'
        );
        const allExercises = getFormattedExercises();
        console.log('Direct exercises count:', allExercises?.length);

        if (allExercises?.length > 0) {
          setExercises(allExercises);
          setFilteredExercises(allExercises);
        }
      }
    }, 1000); // Check after 1 second

    return () => clearTimeout(timer);
  }, [isLoaded, filteredExercises.length, isLoading]);

  // Handlers
  const handleFilterChange = (key, value) => {
    console.log(`Filter change: ${key} = ${value}`);
    debouncedFilterChange.cancel();
    debouncedFilterChange(key, value);
  };

  const clearFilters = () => {
    console.log('Clearing all filters');
    debouncedFilterChange.cancel();
    setFilterValues({
      exerciseName: '',
      muscles: [],
      equipment: []
    });

    // Immediately apply empty filters
    if (isLoaded) {
      console.log('Applying empty filters');
      const initialExercises = filterExercises({});
      console.log(
        'Got exercises after clearing filters:',
        initialExercises?.length
      );
      setExercises(initialExercises || []);
      setFilteredExercises(initialExercises || []);
    }
  };

  const toggleExerciseSelection = exercise => {
    const isSelected = selectedExercises.some(
      e => e.catalogExerciseId === exercise.id
    );

    if (!isSelected) {
      try {
        const newExercise = {
          ...exercise,
          id: Crypto.randomUUID(),
          catalogExerciseId: exercise.id,
          sets: [{ id: Crypto.randomUUID(), weight: '', reps: '', order: 1 }]
        };
        setSelectedExercises(prev => [...prev, newExercise]);
      } catch (error) {
        console.error('Error toggling exercise selection:', error);
      }
    } else {
      setSelectedExercises(prev =>
        prev.filter(e => e.catalogExerciseId !== exercise.id)
      );
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAdd = () => {
    try {
      if (!selectedExercises?.length) {
        console.warn('No exercises selected for addition');
        return;
      }

      const activeWorkoutId =
        contextType === 'workout'
          ? workoutState.activeWorkout?.id
          : programState.workout.activeWorkout;

      if (!activeWorkoutId) {
        console.error('No active workout selected');
        return;
      }

      // Get current exercises based on context type
      const currentExercises =
        contextType === 'workout'
          ? workoutState.activeWorkout?.exercises || []
          : programState.workout.workouts.find(w => w.id === activeWorkoutId)
              ?.exercises || [];

      // Enhanced duplicate detection
      const newExercises = selectedExercises.filter(newExercise => {
        const isDuplicate = currentExercises.some(
          existingExercise =>
            existingExercise.catalogExerciseId ===
              newExercise.catalogExerciseId ||
            (existingExercise.name === newExercise.name &&
              existingExercise.muscle === newExercise.muscle)
        );

        if (isDuplicate) {
          console.log(`Filtered out duplicate exercise: ${newExercise.name}`);
        }
        return !isDuplicate;
      });

      if (newExercises.length === 0) {
        console.log('No new exercises to add - all selections were duplicates');
        return;
      }

      const standardizedExercises = newExercises.map(exercise => ({
        ...exercise,
        id: exercise.id || Crypto.randomUUID(),
        catalogExerciseId: exercise.catalogExerciseId || exercise.id,
        imageUrl: exercise.imageUrl,
        sets: exercise.sets || [
          {
            id: Crypto.randomUUID(),
            weight: '',
            reps: '',
            order: 1
          }
        ]
      }));

      if (contextType === 'workout') {
        standardizedExercises.forEach(exercise => {
          addExerciseToWorkout(exercise);
        });
        setSelectedExercises([]); // Reset selected exercises
        navigation.navigate('StartWorkout');
      } else if (contextType === 'program') {
        if (!programId) {
          console.error(
            'ExerciseSelection.js - Could not determine program ID'
          );
          return;
        }
        addExercise(activeWorkoutId, standardizedExercises);
        setSelectedExercises([]); // Reset selected exercises

        if (programAction === 'create') {
          navigation.navigate('CreateProgram');
        } else if (programAction === 'edit') {
          navigation.navigate('EditProgram', {
            programId,
            shouldRefresh: true
          });
        }
      }
    } catch (error) {
      console.error('Error in handleAdd:', error);
    }
  };

  // Reset selected exercises when unmounting
  useEffect(() => {
    return () => {
      setSelectedExercises([]);
      debouncedFilterChange.cancel();
    };
  }, []);

  const renderExerciseItem = ({ item }) => {
    if (!item) return null;

    return (
      <TouchableOpacity
        style={[
          styles.exerciseItem,
          { borderBottomColor: themedStyles.secondaryBackgroundColor },
          selectedExercises.some(e => e.catalogExerciseId === item.id) && {
            backgroundColor: themedStyles.accentColor + '33'
          }
        ]}
        onPress={() => toggleExerciseSelection(item)}
      >
        <View style={styles.imageContainer}>
          <ExerciseImage
            exercise={{
              id: item.id,
              catalog_exercise_id: item.id,
              catalogExerciseId: item.id,
              imageUrl: item.imageUrl
            }}
            style={styles.exerciseImage}
            resizeMode='cover'
            showOverlay={true}
          />
        </View>

        <View style={styles.exerciseDetails}>
          <Text
            style={[styles.exerciseName, { color: themedStyles.accentColor }]}
          >
            {item.name}
          </Text>
          <Text
            style={[styles.exerciseInfo, { color: themedStyles.textColor }]}
          >
            {`${item.muscle || 'Unknown'} - ${item.equipment || 'Any Equipment'}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  console.log('Rendering with:', {
    exercisesLength: filteredExercises?.length || 0,
    isLoading,
    isLoaded
  });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <View style={{ backgroundColor: themedStyles.primaryBackgroundColor }}>
        <View
          style={[
            styles.header,
            { backgroundColor: themedStyles.primaryBackgroundColor }
          ]}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={[
              { backgroundColor: themedStyles.secondaryBackgroundColor },
              globalStyles.iconCircle
            ]}
          >
            <Ionicons
              name={'arrow-back-outline'}
              style={[globalStyles.icon, { color: themedStyles.textColor }]}
            />
          </TouchableOpacity>
          <Text
            style={[
              globalStyles.sectionTitle,
              { color: themedStyles.textColor }
            ]}
          >
            {selectedExercises.length === 0
              ? 'NO EXERCISES SELECTED'
              : `${selectedExercises.length} EXERCISE${
                  selectedExercises.length > 1 ? 'S' : ''
                } SELECTED`}
          </Text>
          <TouchableOpacity
            onPress={handleAdd}
            style={[
              { backgroundColor: themedStyles.secondaryBackgroundColor },
              globalStyles.iconCircle
            ]}
          >
            <Ionicons
              name={'add-outline'}
              style={[globalStyles.icon, { color: themedStyles.textColor }]}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.filterRow}>
          <SecondaryButton
            label='Filter'
            iconName='options-outline'
            onPress={() => setIsFilterVisible(true)}
          />
        </View>
      </View>

      <Modal
        visible={isFilterVisible}
        animationType='slide'
        transparent={true}
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <ExerciseFilter
          isVisible={isFilterVisible}
          onClose={() => setIsFilterVisible(false)}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          totalMatches={filteredExercises?.length || 0}
        />
      </Modal>
      <FlatList
        ref={flatListRef}
        data={filteredExercises}
        renderItem={renderExerciseItem}
        keyExtractor={item =>
          item.id ? item.id.toString() : `item-${Math.random()}`
        }
        style={styles.exerciseList}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={100}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={() => (
          <View style={styles.emptyList}>
            <Text style={[styles.emptyText, { color: themedStyles.textColor }]}>
              {!isLoaded
                ? 'Loading exercise data...'
                : isLoading
                  ? 'Loading exercises...'
                  : 'No exercises found. Try removing filters.'}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10
  },
  filterRow: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    alignItems: 'flex-start'
  },
  exerciseList: { flex: 1 },
  exerciseItem: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 1,
    alignItems: 'center',
    height: 90
  },
  imageContainer: {
    width: 85,
    height: 85,
    marginRight: 10,
    overflow: 'hidden'
  },
  exerciseImage: {
    width: '100%',
    height: '100%'
  },
  exerciseDetails: {
    flex: 1,
    justifyContent: 'center'
  },
  exerciseName: {
    fontFamily: 'Lexend',
    fontSize: 16,
    marginBottom: 4
  },
  exerciseInfo: {
    fontFamily: 'Lexend',
    fontSize: 14
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    fontFamily: 'Lexend',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20
  }
});

export default ExerciseSelection;
