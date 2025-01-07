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
import { useConfig } from '../src/context/configContext';
import debounce from 'lodash/debounce';
import { ProgramContext } from '../src/context/programContext';
import { WorkoutContext } from '../src/context/workoutContext';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { transformResponseData } from '../src/utils/apiTransformers';
import { globalStyles, colors } from '../src/styles/globalStyles';
import PillButton from './PillButton';
import ExerciseFilter from './ExerciseFilter';
import ExerciseImage from './ExerciseImage';
import { cacheImage, debugCache } from '../src/utils/imageCache';

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
  const { apiUrl, isLoadingConfig } = useConfig();
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterValues, setFilterValues] = useState({
    exerciseName: '',
    muscle: '',
    equipment: ''
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

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        name: filterValues.exerciseName?.trim() || '',
        muscle: filterValues.muscle?.trim() || '',
        equipment: filterValues.equipment?.trim() || ''
      });

      const response = await fetch(
        `${apiUrl}/api/exercise-catalog?${queryParams}`,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();

      // Transform the data right after receiving it from the API
      const transformedData = transformResponseData(rawData);

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
      muscle: '',
      equipment: ''
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
      // Cache image and log result
      const wasAdded = cacheImage(exercise.id, exercise.imageUrl);

      // Debug current cache state
      debugCache();

      const newExercise = {
        ...exercise,
        id: Crypto.randomUUID(),
        catalogExerciseId: exercise.id,
        sets: [{ id: Crypto.randomUUID(), weight: '0', reps: '0', order: 1 }]
      };
      setSelectedExercises(prev => [...prev, newExercise]);
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
            weight: '0',
            reps: '0',
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
        <ExerciseImage exercise={item} />
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
          <PillButton
            label='Filter'
            icon={
              <Ionicons
                name='options-outline'
                size={16}
                color={
                  themeState.theme === 'dark'
                    ? themedStyles.accentColor
                    : colors.eggShell
                }
              />
            }
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
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
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
    paddingBottom: 1,
    borderBottomWidth: 1,
    borderRadius: 10
  },
  selectedExercise: {
    borderStyle: 'solid',
    borderWidth: 1,
    backgroundColor: colors.voltGreen + '20'
  },
  exerciseImage: {
    width: 90,
    height: 90,
    marginRight: 10,
    borderEndStartRadius: 10,
    borderTopStartRadius: 10
  },
  exerciseDetails: { flex: 1 },
  exerciseName: {
    fontFamily: 'Lexend',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 5
  },
  exerciseInfo: { fontFamily: 'Lexend', fontSize: 16, marginBottom: 10 }
});

export default ExerciseSelection;
