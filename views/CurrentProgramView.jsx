import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { WorkoutContext } from '../src/context/workoutContext';
import { ProgramContext } from '../src/context/programContext';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import Header from '../components/Header';
import { globalStyles, colors } from '../src/styles/globalStyles';
import {
  getPrograms,
  createActiveProgram,
  deleteActiveProgram
} from '../src/services/api';
import SecondaryButton from '../components/SecondaryButton';
import { Ionicons } from '@expo/vector-icons';
import ProgramFilter from '../components/ProgramFilter';
import { useUser } from '../src/context/userContext';

const CurrentProgramView = () => {
  const { userId } = useUser();
  const navigation = useNavigation();
  const { state: programState, setPrograms } = useContext(ProgramContext);

  const { state: workoutState, setActiveProgram } = useContext(WorkoutContext);

  const programs = programState.programs;

  const activeProgram = workoutState;

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    programName: '',
    selectedGoal: '',
    durationType: '',
    daysPerWeek: ''
  });

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  // Fetch users programs
  const fetchPrograms = useCallback(async () => {
    try {
      const data = await getPrograms(userId);
      setPrograms(data);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  }, [setPrograms]);

  // First, ensure we have programs
  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms, userId]);

  // Define fetchInitialData as a memoized callback
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      await fetchPrograms();
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPrograms]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData, , userId]);

  const handleSetActiveProgram = useCallback(
    async program => {
      if (!program?.id) {
        console.error('Invalid program object:', program);
        Alert.alert('Error', 'Invalid program data. Please try again.');
        return;
      }

      try {
        setIsLoading(true);

        if (activeProgram?.programId === program.id) {
          navigation.navigate('CurrentProgramDetails');
          return;
        }

        // Delete existing active program
        try {
          await deleteActiveProgram(userId);
        } catch (deleteError) {
          console.log('Error deleting active program:', deleteError);
        }

        // Create new active program
        const payload = {
          userId: userId,
          programId: program.id,
          startDate: new Date().toISOString().split('T')[0]
        };

        const data = await createActiveProgram(payload);

        if (data?.activeProgram) {
          // Combine the API response with the full program details
          const fullActiveProgram = {
            ...data.activeProgram,
            name: program.name,
            workouts: program.workouts,
            main_goal: program.mainGoal,
            program_duration: program.programDuration,
            duration_unit: program.durationUnit,
            days_per_week: program.daysPerWeek
          };

          setActiveProgram(fullActiveProgram);
          navigation.navigate('CurrentProgramDetails');
        } else {
          console.error('Invalid response data:', data);
          throw new Error('No active program data received from server');
        }
      } catch (error) {
        console.error('Error setting active program:', error);
        Alert.alert(
          'Error',
          `Failed to update program status: ${error.message}`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeProgram, navigation, setActiveProgram]
  );

  const filteredPrograms = useMemo(() => {
    return (programs || []).filter(program => {
      const matchesName =
        !filters.programName ||
        program.name.toLowerCase().includes(filters.programName.toLowerCase());
      const matchesGoal =
        !filters.selectedGoal || program.mainGoal === filters.selectedGoal;
      const matchesDurationUnit =
        !filters.durationType ||
        program.durationUnit.toLowerCase() ===
          filters.durationType.toLowerCase();
      const matchesDaysPerWeek =
        !filters.daysPerWeek ||
        program.daysPerWeek === parseInt(filters.daysPerWeek);

      return (
        matchesName && matchesGoal && matchesDurationUnit && matchesDaysPerWeek
      );
    });
  }, [programs, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prevFilters => ({ ...prevFilters, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      programName: '',
      selectedGoal: '',
      durationType: '',
      daysPerWeek: ''
    });
  };

  const handleBack = () => {
    navigation.navigate('WorkoutMain');
  };

  const formatDuration = (duration, unit) => {
    const capitalizedUnit = unit.charAt(0).toUpperCase() + unit.slice(1);
    const formattedUnit =
      duration === 1 ? capitalizedUnit.slice(0, -1) : capitalizedUnit;
    return `${duration} ${formattedUnit}`;
  };

  const renderProgramItem = ({ item }) => {
    return (
      <TouchableOpacity onPress={() => handleSetActiveProgram(item)}>
        <View
          style={[
            styles.programItem,
            { backgroundColor: themedStyles.secondaryBackgroundColor },
            activeProgram?.programId === item.id && styles.activeProgramBorder,
            activeProgram?.programId === item.id && {
              borderColor: themedStyles.accentColor
            }
          ]}
        >
          <Text
            style={[styles.programTitle, { color: themedStyles.accentColor }]}
          >
            {item.name}
          </Text>
          <View style={styles.programDetails}>
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, { color: themedStyles.textColor }]}
              >
                Main Goal
              </Text>
              <Text
                style={[styles.detailValue, { color: themedStyles.textColor }]}
              >
                {item.mainGoal.charAt(0).toUpperCase() + item.mainGoal.slice(1)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, { color: themedStyles.textColor }]}
              >
                Duration
              </Text>
              <Text
                style={[styles.detailValue, { color: themedStyles.textColor }]}
              >
                {formatDuration(item.programDuration, item.durationUnit)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, { color: themedStyles.textColor }]}
              >
                Days Per Week
              </Text>
              <Text
                style={[styles.detailValue, { color: themedStyles.textColor }]}
              >
                {item.daysPerWeek}
              </Text>
            </View>
          </View>
          {activeProgram?.programId === item.id && (
            <Text
              style={[
                styles.currentProgramText,
                { color: themedStyles.accentColor }
              ]}
            >
              CURRENT PROGRAM
            </Text>
          )}
          <View style={globalStyles.iconContainer}></View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[
        globalStyles.container,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <Header pageName='Workout' />
      <View style={globalStyles.container}>
        <View style={styles.controlsContainer}>
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
          {programs?.length > 0 && (
            <SecondaryButton
              label='Filter'
              iconName='options-outline'
              onPress={() => {
                setIsFilterVisible(!isFilterVisible);
              }}
            />
          )}
        </View>
        <Modal
          visible={isFilterVisible}
          animationType='slide'
          transparent={true}
          onRequestClose={() => setIsFilterVisible(false)}
        >
          <ProgramFilter
            isVisible={isFilterVisible}
            onClose={() => setIsFilterVisible(false)}
            programs={programs}
            filterValues={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            totalMatches={filteredPrograms.length}
          />
        </Modal>

        {isLoading ? (
          <View style={styles.noPrograms}>
            <Text
              style={[
                styles.noProgramsText,
                { color: themedStyles.accentColor }
              ]}
            >
              Loading programs...
            </Text>
          </View>
        ) : programs?.length > 0 ? (
          <View style={globalStyles.container}>
            <FlatList
              data={filteredPrograms}
              renderItem={renderProgramItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContainer}
            />
          </View>
        ) : (
          <View style={styles.noPrograms}>
            <Text
              style={[
                styles.noProgramsText,
                { color: themedStyles.accentColor }
              ]}
            >
              You don't have any programs yet. Let's create one!
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingTop: 20
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 100
  },
  modalContent: {
    backgroundColor: 'transparent'
  },

  programItem: {
    padding: 16,
    marginBottom: 10,
    borderRadius: 5
  },
  programTitle: {
    fontFamily: 'Lexend',
    fontSize: 16,
    marginBottom: 5
  },
  programDetails: {
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

  noPrograms: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  noProgramsText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24
  },
  activeProgramBorder: {
    borderWidth: 1,
    borderColor: colors.accent
  },
  currentProgramIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.accent,
    paddingVertical: 5,
    alignItems: 'center'
  },
  currentProgramText: {
    fontFamily: 'Lexend',
    fontSize: 12,
    textAlign: 'center'
  }
});

export default CurrentProgramView;
