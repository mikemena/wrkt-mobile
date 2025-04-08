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
import { api } from '../src/services/api';
import debounce from 'lodash/debounce';
import { ProgramContext } from '../src/context/programContext';
import { WorkoutContext } from '../src/context/workoutContext';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { transformResponseData } from '../src/utils/apiTransformers';
import { globalStyles, colors } from '../src/styles/globalStyles';
import SecondaryButton from './SecondaryButton';
import ExerciseFilter from './ExerciseFilter';
import ExerciseImage from './ExerciseImage';

const ExerciseSelection = ({ navigation, route }) => {
  const { addExercise, state: programState } = useContext(ProgramContext);
  const { addExerciseToWorkout, state: workoutState } =
    useContext(WorkoutContext);

  const programAction = programState.mode;
  const contextType = route.params?.contextType;
  const programId = route.params?.programId;

  // Refs
  const abortController = useRef(null);
  const initialLoadRef = useRef(true);
  const flatListRef = useRef(null);

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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  // Fetch exercises function
  const fetchExercises = async (page = 1, shouldAppend = false) => {
    if (!hasMore && page > 1) return;

    try {
      setIsLoading(page === 1);
      setIsLoadingMore(page > 1);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');

      if (filterValues.exerciseName?.trim()) {
        params.append('name', filterValues.exerciseName.trim());
      }

      // Add multiple muscles
      if (filterValues.muscles?.length > 0) {
        filterValues.muscles.forEach(muscle => {
          params.append('muscles[]', muscle);
        });
      }

      // Add multiple equipment
      if (filterValues.equipment?.length > 0) {
        filterValues.equipment.forEach(equip => {
          params.append('equipment[]', equip);
        });
      }

      const response = await api.get(
        `/api/exercise-catalog?${params.toString()}`
      );

      // Transform the data right after receiving it from the API
      const transformedData = transformResponseData(response);

      // Reset data when applying new filters
      if (!shouldAppend) {
        setExercises(transformedData.exercises);
        setFilteredExercises(transformedData.exercises);
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      } else {
        setExercises(prev => [...prev, ...transformedData.exercises]);
        setFilteredExercises(prev => [...prev, ...transformedData.exercises]);
      }

      setHasMore(transformedData.pagination.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('Fetch error:', error);
      setHasMore(false);
      if (!shouldAppend) {
        setExercises([]);
        setFilteredExercises([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Create debounced filter function
  const debouncedFilterChange = useMemo(
    () =>
      debounce((key, value) => {
        setFilterValues(prev => {
          const newValues = { ...prev, [key]: value };

          return newValues;
        });
      }, 300),
    []
  );

  useEffect(() => {
    if (Object.values(filterValues).some(value => value !== '')) {
      // Reset pagination when filters change
      setCurrentPage(1);
      setHasMore(true);
      // Fetch with new filters
      fetchExercises(1, false);
    }
  }, [filterValues]);

  useEffect(() => {
    // Initial load
    fetchExercises(1, false);

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      debouncedFilterChange.cancel();
    };
  }, []);

  useEffect(() => {
    if (
      !initialLoadRef.current &&
      Object.values(filterValues).some(value => value !== '')
    ) {
      setCurrentPage(1);
      fetchExercises(1, false);
    }
  }, [filterValues]);

  useEffect(() => {
    if (contextType === 'workout') {
      // For workout context, use the exercises from workoutState
      setSelectedExercises(workoutState.activeWorkout.exercises || []);
    } else if (contextType === 'program') {
      // For program context, use the exercises from active workout
      const activeWorkout = programState.workout.workouts.find(
        w => w.id === programState.workout.activeWorkout
      );
      if (activeWorkout) {
        setSelectedExercises(activeWorkout.exercises || []);
      }
    }
  }, [contextType, workoutState.exercises, programState.workout]);

  // Handlers
  const handleFilterChange = (key, value) => {
    debouncedFilterChange.cancel();
    debouncedFilterChange(key, value);
  };

  const clearFilters = () => {
    debouncedFilterChange.cancel();
    if (abortController.current) {
      abortController.current.abort();
    }
    setFilterValues({
      exerciseName: '',
      muscle: [],
      equipment: []
    });
    setCurrentPage(1);
    fetchExercises(1, false);
  };

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      fetchExercises(currentPage + 1, true);
    }
  }, [currentPage, hasMore, isLoadingMore, isLoading]);

  const toggleExerciseSelection = async exercise => {
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

  const handleAdd = async () => {
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
        await addExercise(activeWorkoutId, standardizedExercises);
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

  // Also add a cleanup effect to reset selected exercises when unmounting
  useEffect(() => {
    return () => {
      setSelectedExercises([]);
    };
  }, []);

  const renderExerciseItem = ({ item }) => {
    console.log(
      'Rendering exercise item:',
      JSON.stringify(
        {
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
          muscle: item.muscle,
          equipment: item.equipment
        },
        null,
        2
      )
    );

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
            {`${item.muscle} - ${item.equipment}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
          totalMatches={filteredExercises.length}
        />
      </Modal>
      <FlatList
        ref={flatListRef}
        data={filteredExercises}
        renderItem={renderExerciseItem}
        keyExtractor={item => item.id.toString()}
        style={styles.exerciseList}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.25}
        initialNumToRender={5}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={100}
        windowSize={3}
        removeClippedSubviews={true}
        key={JSON.stringify(filterValues)}
        ListEmptyComponent={() => (
          <View style={styles.emptyList}>
            <Text style={[styles.emptyText, { color: themedStyles.textColor }]}>
              {isLoading ? 'Loading exercises...' : 'No exercises found'}
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
    // borderRadius: 5,
    overflow: 'hidden'
  },
  exerciseImage: {
    width: '100%',
    height: '100%'
    //borderRadius: 5
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
  }
});

export default ExerciseSelection;
