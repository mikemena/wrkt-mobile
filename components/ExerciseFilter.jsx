import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableWithoutFeedback
} from 'react-native';
import { config } from '../src/utils/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomPicker from './CustomPicker';
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
      const response = await fetch(`${config.apiUrl}/api/muscles`);
      const data = await response.json();
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
      const response = await fetch(`${config.apiUrl}/api/equipments`);

      const data = await response.json();

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
      // Load muscles
      let muscles = await getCachedData(CACHE_KEYS.MUSCLES);

      if (!muscles || !Array.isArray(muscles) || muscles.length === 0) {
        muscles = await fetchMuscles();
        if (muscles.length > 0) {
          // Only cache if we got data
          await setCachedData(CACHE_KEYS.MUSCLES, muscles);
        }
      }

      setMuscleOptions([
        { label: 'All Muscles', value: '' },
        ...(muscles || [])
      ]);

      // Load equipment
      let equipment = await getCachedData(CACHE_KEYS.EQUIPMENT);

      if (!equipment || !Array.isArray(equipment) || equipment.length === 0) {
        equipment = await fetchEquipment();
        if (equipment.length > 0) {
          // Only cache if we got data
          await setCachedData(CACHE_KEYS.EQUIPMENT, equipment);
        }
      }

      setEquipmentOptions([
        { label: 'All Equipment', value: '' },
        ...(equipment || [])
      ]);
    } catch (error) {
      console.error('Error in loadCatalogData:', error);
    }
  };

  if (!isVisible) return null;

  return (
    // This outer TouchableWithoutFeedback captures taps outside the filter
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        {/* This inner TouchableWithoutFeedback prevents taps on the filter from bubbling up */}
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

              {/* Exercise Name Input */}
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
                  placeholderTextColor={themedStyles.textColor}
                />
              </View>

              <View style={styles.pickerRow}>
                {/* Muscle Picker */}
                <View style={styles.pickerItem}>
                  <Text
                    style={[
                      styles.pickerLabel,
                      { color: themedStyles.textColor }
                    ]}
                  >
                    Muscle
                  </Text>
                  <CustomPicker
                    options={muscleOptions}
                    selectedValue={filterValues.muscle}
                    onValueChange={value => onFilterChange('muscle', value)}
                    placeholder='Select Muscle'
                  />
                </View>

                {/* Equipment Picker */}
                <View style={styles.pickerItem}>
                  <Text
                    style={[
                      styles.pickerLabel,
                      { color: themedStyles.textColor }
                    ]}
                  >
                    Equipment
                  </Text>
                  <CustomPicker
                    options={equipmentOptions}
                    selectedValue={filterValues.equipment}
                    onValueChange={value => onFilterChange('equipment', value)}
                    placeholder='Select Equipment'
                  />
                </View>
              </View>
            </View>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    // This ensures the overlay covers the full screen
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Semi-transparent background
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    // Center filter vertically if needed
    justifyContent: 'flex-start',
    paddingTop: 100
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
    borderRadius: 30,
    paddingHorizontal: 15,
    fontFamily: 'Lexend'
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10
  },
  pickerItem: {
    flex: 1
  },
  pickerLabel: {
    fontFamily: 'Lexend',
    marginBottom: 5,
    fontSize: 14
  }
});

export default ExerciseFilter;
