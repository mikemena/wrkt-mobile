import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConfig } from '../src/context/configContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomPicker from './CustomPicker';
import PillButton from './PillButton';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { colors } from '../src/styles/globalStyles';

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_KEYS = {
  MUSCLES: 'muscles_cache',
  EQUIPMENT: 'equipment_cache'
};

const Filter = ({
  isVisible,
  onClose,
  filterOptions,
  filterValues,
  onFilterChange,
  onClearFilters,
  getTotalMatches,
  filterType // 'exercises' or 'programs'
}) => {
  const { state } = useTheme();
  const themedStyles = getThemedStyles(state.theme, state.accentColor);
  const [muscleOptions, setMuscleOptions] = useState([]);
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const { apiUrl, isLoadingConfig } = useConfig();

  useEffect(() => {
    if (filterType === 'exercises') {
      loadCatalogData();
    }
  }, [filterType]);

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
      const response = await fetch(`${apiUrl}/api/muscles`);
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
      const response = await fetch(`${apiUrl}/api/equipment`);
      const data = await response.json();
      return data.map(equipment => ({
        label: equipment.name,
        value: equipment.name
      }));
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return [];
    }
  };

  const loadCatalogData = async () => {
    if (filterType === 'exercises') {
      // Load muscles
      let muscles = await getCachedData(CACHE_KEYS.MUSCLES);
      if (!muscles) {
        muscles = await fetchMuscles();
        await setCachedData(CACHE_KEYS.MUSCLES, muscles);
      }
      setMuscleOptions([{ label: 'All Muscles', value: '' }, ...muscles]);

      // Load equipment
      let equipment = await getCachedData(CACHE_KEYS.EQUIPMENT);
      if (!equipment) {
        equipment = await fetchEquipment();
        await setCachedData(CACHE_KEYS.EQUIPMENT, equipment);
      }
      setEquipmentOptions([
        { label: 'All Equipment', value: '' },
        ...equipment
      ]);
    }
  };

  const getFilterOptions = () => {
    if (filterType === 'exercises') {
      return [
        { key: 'exerciseName', label: 'Exercise Name', type: 'text' },
        {
          key: 'muscle',
          label: 'Muscle',
          type: 'picker',
          options: muscleOptions
        },
        {
          key: 'equipment',
          label: 'Equipment',
          type: 'picker',
          options: equipmentOptions
        }
      ];
    }
    return filterOptions;
  };

  const totalMatches = getTotalMatches(filterValues);

  if (!isVisible) return null;

  const currentFilterOptions = getFilterOptions();
  const textInputs = currentFilterOptions.filter(
    option => option.type === 'text'
  );
  const pickerInputs = currentFilterOptions.filter(
    option => option.type === 'picker'
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <PillButton
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
          <PillButton
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

        {textInputs.map(input => (
          <View key={input.key} style={styles.filterItem}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themedStyles.secondaryBackgroundColor,
                  color: themedStyles.textColor
                }
              ]}
              value={localFilters[input.key] || ''}
              onChangeText={text => handleFilterChange(input.key, text)}
              placeholder={input.label}
              placeholderTextColor={themedStyles.textColor}
            />
          </View>
        ))}

        <View style={styles.pickerRow}>
          {pickerInputs.map(input => (
            <View key={input.key} style={styles.pickerItem}>
              <Text
                style={[styles.pickerLabel, { color: themedStyles.textColor }]}
              >
                {input.label}
              </Text>
              <CustomPicker
                options={option.options}
                selectedValue={filterValues[option.key]}
                onValueChange={value => onFilterChange(option.key, value)}
                placeholder={option.label}
              />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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

export default Filter;
