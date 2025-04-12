import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomPicker from './CustomPicker';
import SecondaryButton from './SecondaryButton';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';

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
                <SecondaryButton
                  label='Close'
                  iconName='close-outline'
                  onPress={onClose}
                />
                <Text style={{ color: themedStyles.accentColor }}>
                  {totalMatches === 0
                    ? 'No Programs'
                    : totalMatches === 1
                      ? '1 Program'
                      : `${totalMatches} Programs`}
                </Text>
                <SecondaryButton
                  label='Clear'
                  iconName='refresh-outline'
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 100
  },
  safeArea: {
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
    paddingHorizontal: 15,
    fontFamily: 'Lexend',
    borderRadius: 5
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
