import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import { ProgramContext } from '../src/context/programContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { globalStyles, colors } from '../src/styles/globalStyles';
import { useTheme } from '../src/hooks/useTheme';
import { toUpperCase } from '../src/utils/stringUtils';
import { getThemedStyles } from '../src/utils/themeUtils';
import CustomPicker from './CustomPicker';
import {
  DAYS_PER_WEEK,
  DURATION_TYPES,
  GOAL_TYPES
} from '../src/utils/constants';

const ProgramForm = ({ program, isExpanded, onToggleExpand }) => {
  const { updateProgramField, state } = useContext(ProgramContext);
  const { mode } = state;
  const navigation = useNavigation();
  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  const [formValues, setFormValues] = useState({
    name: program?.name || '',
    mainGoal: program?.mainGoal || '',
    programDuration: program?.programDuration || '',
    durationUnit: program?.durationUnit || '',
    daysPerWeek: program?.daysPerWeek || '',
    workouts: program?.workouts || [],
    programDurationDisplay: `${program?.programDuration || ''} ${
      toUpperCase(program?.durationUnit) || ''
    }`
  });

  const handleChange = useCallback(
    (name, value) => {
      setFormValues(prev => ({
        ...prev,
        [name]: value
      }));
      updateProgramField(name, value);
    },
    [updateProgramField]
  );

  useEffect(() => {
    if (program) {
      setFormValues({
        name: program.name || '',
        mainGoal: program.mainGoal || '',
        programDuration: program.programDuration || '',
        durationUnit: program.durationUnit || '',
        daysPerWeek: program.daysPerWeek || '',
        workouts: program.workouts || [],
        programDurationDisplay: `${program.programDuration || ''} ${
          toUpperCase(program.durationUnit) || ''
        }`
      });
    }
  }, [program]);

  return (
    <View style={styles.container}>
      {/* Form header */}
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
        {!isExpanded && (
          <Text
            style={[
              globalStyles.sectionTitle,
              { color: themedStyles.textColor, flex: 1, textAlign: 'center' }
            ]}
          >
            {formValues.name || ''}
          </Text>
        )}

        <TouchableOpacity
          onPress={onToggleExpand}
          style={[
            { backgroundColor: themedStyles.secondaryBackgroundColor },
            globalStyles.iconCircle
          ]}
        >
          <Ionicons
            name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
            style={[globalStyles.icon, { color: themedStyles.textColor }]}
            size={24}
          />
        </TouchableOpacity>
      </View>

      {/* Program details form */}
      {isExpanded && (
        <ScrollView>
          <View
            style={[
              globalStyles.section,
              { backgroundColor: themedStyles.primaryBackgroundColor }
            ]}
          >
            {/* Program Name */}
            <Text
              style={[globalStyles.label, { color: themedStyles.textColor }]}
            >
              Program Name
            </Text>
            <TextInput
              style={[
                globalStyles.input,
                {
                  backgroundColor: themedStyles.secondaryBackgroundColor,
                  color: themedStyles.textColor
                }
              ]}
              value={formValues.name}
              onChangeText={text => handleChange('name', text)}
              placeholder='Program Name'
            />

            {/* Main Goal */}
            <Text
              style={[globalStyles.label, { color: themedStyles.textColor }]}
            >
              Main Goal
            </Text>
            <CustomPicker
              options={GOAL_TYPES}
              selectedValue={formValues.mainGoal}
              onValueChange={value => {
                handleChange('mainGoal', value);
              }}
              label='Main Goal'
              placeholder='Main Goal'
            />

            {/* Duration */}
            <Text
              style={[globalStyles.label, { color: themedStyles.textColor }]}
            >
              Duration
            </Text>
            <View style={styles.durationContainer}>
              <TextInput
                style={[
                  globalStyles.input,
                  styles.durationInput,
                  {
                    backgroundColor: themedStyles.secondaryBackgroundColor,
                    color: themedStyles.textColor
                  }
                ]}
                value={formValues.programDuration.toString()}
                onChangeText={text => handleChange('programDuration', text)}
                placeholder='Duration'
                keyboardType='numeric'
              />
              <CustomPicker
                options={DURATION_TYPES}
                selectedValue={formValues.durationUnit}
                onValueChange={value => {
                  handleChange('durationUnit', value);
                }}
                label='Duration Unit'
                placeholder='Duration Unit'
              />
            </View>

            {/* Days Per Week */}
            <Text
              style={[globalStyles.label, { color: themedStyles.textColor }]}
            >
              Days Per Week
            </Text>
            <CustomPicker
              options={DAYS_PER_WEEK}
              selectedValue={formValues.daysPerWeek}
              onValueChange={value => {
                handleChange('daysPerWeek', value);
              }}
              label='Days Per Week'
              placeholder='Select days per week'
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  durationInput: {
    flex: 1,
    marginRight: 8
  },
  durationUnitInput: {
    flex: 1
  }
});

export default ProgramForm;
