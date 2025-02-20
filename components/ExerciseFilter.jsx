import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableWithoutFeedback,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { api } from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ParallelogramButton from './ParallelogramButton';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { colors } from '../src/styles/globalStyles';

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_KEYS = {
  MUSCLES: 'muscles_cache',
  EQUIPMENT: 'equipment_cache'
};

const SelectionChip = ({ label, selected, onPress, themedStyles }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.chip,
      {
        backgroundColor: selected
          ? themedStyles.accentColor
          : themedStyles.secondaryBackgroundColor
      }
    ]}
  >
    <Text
      style={[
        styles.chipText,
        { color: selected ? colors.flatBlack : themedStyles.textColor }
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const ExerciseFilter = ({
  isVisible,
  onClose,
  filterValues,
  onFilterChange,
  onClearFilters,
  totalMatches
}) => {
  const { state } = useTheme();
  const themedStyles = getThemedStyles(state.theme, state.accentColor);
  const [muscleOptions, setMuscleOptions] = useState([]);
  const [equipmentOptions, setEquipmentOptions] = useState([]);

  useEffect(() => {
    loadCatalogData();
  }, []);

  const getCachedData = async key => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  };

  const setCachedData = async (key, data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  };

  const fetchMuscles = async () => {
    try {
      const data = await api.get('/api/muscles');
      return data.map(muscle => ({
        label: `${muscle.muscle} (${muscle.muscle_group})`,
        value: muscle.muscle
      }));
    } catch (error) {
      console.error('Error fetching muscles:', error);
      return [];
    }
  };

  const fetchEquipment = async () => {
    try {
      const data = await api.get('/api/equipments');
      return data.map(equipment => ({
        label: equipment.name,
        value: equipment.name
      }));
    } catch (error) {
      console.error('Equipment fetch error:', error);
      return [];
    }
  };

  const loadCatalogData = async () => {
    try {
      let muscles = await getCachedData(CACHE_KEYS.MUSCLES);
      if (!muscles || !Array.isArray(muscles) || muscles.length === 0) {
        muscles = await fetchMuscles();
        if (muscles.length > 0) {
          await setCachedData(CACHE_KEYS.MUSCLES, muscles);
        }
      }
      setMuscleOptions(muscles || []);

      let equipment = await getCachedData(CACHE_KEYS.EQUIPMENT);
      if (!equipment || !Array.isArray(equipment) || equipment.length === 0) {
        equipment = await fetchEquipment();
        if (equipment.length > 0) {
          await setCachedData(CACHE_KEYS.EQUIPMENT, equipment);
        }
      }
      setEquipmentOptions(equipment || []);
    } catch (error) {
      console.error('Error in loadCatalogData:', error);
    }
  };

  const handleMuscleToggle = muscleValue => {
    const currentMuscles = filterValues.muscles || [];
    const newMuscles = currentMuscles.includes(muscleValue)
      ? currentMuscles.filter(m => m !== muscleValue)
      : [...currentMuscles, muscleValue];
    onFilterChange('muscles', newMuscles);
  };

  const handleEquipmentToggle = equipmentValue => {
    const currentEquipment = filterValues.equipment || [];
    const newEquipment = currentEquipment.includes(equipmentValue)
      ? currentEquipment.filter(e => e !== equipmentValue)
      : [...currentEquipment, equipmentValue];
    onFilterChange('equipment', newEquipment);
  };

  if (!isVisible) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
          <SafeAreaView
            style={[
              styles.safeArea,
              { backgroundColor: themedStyles.primaryBackgroundColor }
            ]}
          >
            <View style={styles.container}>
              <View style={styles.header}>
                <ParallelogramButton
                  label='Close'
                  icon={
                    <Ionicons
                      name='close-outline'
                      size={16}
                      color={colors.eggShell}
                    />
                  }
                  onPress={onClose}
                />
                <View>
                  <Text style={{ color: themedStyles.accentColor }}>
                    {totalMatches === 0
                      ? 'No Matches'
                      : totalMatches === 1
                      ? '1 Match'
                      : `${totalMatches} Matches`}
                  </Text>
                </View>
                <ParallelogramButton
                  label='Clear'
                  icon={
                    <Ionicons
                      name='refresh-outline'
                      size={16}
                      color={colors.eggShell}
                    />
                  }
                  onPress={onClearFilters}
                />
              </View>

              <View style={styles.filterItem}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: themedStyles.secondaryBackgroundColor,
                      color: themedStyles.textColor
                    }
                  ]}
                  value={filterValues.exerciseName}
                  onChangeText={text => onFilterChange('exerciseName', text)}
                  placeholder='Exercise Name'
                  placeholderTextSize='18'
                  placeholderTextColor={themedStyles.textColor}
                />
              </View>

              <ScrollView style={styles.scrollContainer}>
                <View style={styles.filterSection}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: themedStyles.textColor }
                    ]}
                  >
                    Muscles
                  </Text>
                  <View style={styles.chipContainer}>
                    {muscleOptions.map(muscle => (
                      <SelectionChip
                        key={muscle.value}
                        label={muscle.label}
                        selected={(filterValues.muscles || []).includes(
                          muscle.value
                        )}
                        onPress={() => handleMuscleToggle(muscle.value)}
                        themedStyles={themedStyles}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: themedStyles.textColor }
                    ]}
                  >
                    Equipment
                  </Text>
                  <View style={styles.chipContainer}>
                    {equipmentOptions.map(equipment => (
                      <SelectionChip
                        key={equipment.value}
                        label={equipment.label}
                        selected={(filterValues.equipment || []).includes(
                          equipment.value
                        )}
                        onPress={() => handleEquipmentToggle(equipment.value)}
                        themedStyles={themedStyles}
                      />
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 60 // Reduced top padding to show more content
  },
  safeArea: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden'
  },
  container: {
    padding: 10,
    marginBottom: 40
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  filterItem: {
    marginBottom: 15
  },
  input: {
    height: 50,
    borderRadius: 5,
    paddingHorizontal: 15,
    fontFamily: 'Lexend'
  },
  filterSection: {
    marginTop: 15
  },
  sectionTitle: {
    fontFamily: 'Lexend',
    fontSize: 14,
    marginBottom: 10
  },
  scrollContainer: {
    maxHeight: 550 // Fixed height to show both sections
  },
  filterSection: {
    marginTop: 12,
    marginBottom: 12
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingBottom: 6
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 6,
    minWidth: 100
  },
  chipText: {
    fontFamily: 'Lexend',
    fontSize: 12
  }
});

export default ExerciseFilter;
