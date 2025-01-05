import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableWithoutFeedback
} from 'react-native';
import CustomPicker from './CustomPicker';
import PillButton from './PillButton';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { colors } from '../src/styles/globalStyles';

const ProgramFilter = ({
  isVisible,
  onClose,
  programs,
  filterValues,
  onFilterChange,
  onClearFilters,
  totalMatches
}) => {
  const { state } = useTheme();
  const themedStyles = getThemedStyles(state.theme, state.accentColor);

  const goalOptions = [
    { label: 'All', value: '' },
    ...Array.from(new Set(programs.map(p => p.mainGoal)))
      .sort()
      .map(goal => ({
        label: goal.charAt(0).toUpperCase() + goal.slice(1),
        value: goal
      }))
  ];

  const durationOptions = [
    { label: 'All', value: '' },
    ...Array.from(new Set(programs.map(p => p.durationUnit)))
      .sort()
      .map(unit => ({
        label: unit.charAt(0).toUpperCase() + unit.slice(1),
        value: unit
      }))
  ];

  const daysPerWeekOptions = [
    { label: 'All', value: '' },
    ...Array.from(new Set(programs.map(p => p.daysPerWeek)))
      .sort((a, b) => a - b)
      .map(days => ({
        label: days.toString(),
        value: days.toString()
      }))
  ];

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
              {/* Header with match count */}
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
                <Text style={{ color: themedStyles.accentColor }}>
                  {totalMatches === 0
                    ? 'No Programs'
                    : totalMatches === 1
                    ? '1 Program'
                    : `${totalMatches} Programs`}
                </Text>
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

              {/* Program name input */}
              <View style={styles.filterItem}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: themedStyles.secondaryBackgroundColor,
                      color: themedStyles.textColor
                    }
                  ]}
                  value={filterValues.programName}
                  onChangeText={text => onFilterChange('programName', text)}
                  placeholder='Program Name'
                  placeholderTextColor={themedStyles.textColor}
                />
              </View>

              {/* Program-specific pickers */}
              <View style={styles.pickerRow}>
                <View style={styles.pickerItem}>
                  <Text
                    style={[
                      styles.pickerLabel,
                      { color: themedStyles.textColor }
                    ]}
                  >
                    Goal
                  </Text>
                  <CustomPicker
                    options={goalOptions}
                    selectedValue={filterValues.selectedGoal}
                    onValueChange={value =>
                      onFilterChange('selectedGoal', value)
                    }
                    placeholder='Select Goal'
                  />
                </View>

                <View style={styles.pickerItem}>
                  <Text
                    style={[
                      styles.pickerLabel,
                      { color: themedStyles.textColor }
                    ]}
                  >
                    Duration
                  </Text>
                  <CustomPicker
                    options={durationOptions}
                    selectedValue={filterValues.durationType}
                    onValueChange={value =>
                      onFilterChange('durationType', value)
                    }
                    placeholder='Select Duration'
                  />
                </View>

                <View style={styles.pickerItem}>
                  <Text
                    style={[
                      styles.pickerLabel,
                      { color: themedStyles.textColor }
                    ]}
                  >
                    Days Per Week
                  </Text>
                  <CustomPicker
                    options={daysPerWeekOptions}
                    selectedValue={filterValues.daysPerWeek}
                    onValueChange={value =>
                      onFilterChange('daysPerWeek', value)
                    }
                    placeholder='Select Days'
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

export default ProgramFilter;
