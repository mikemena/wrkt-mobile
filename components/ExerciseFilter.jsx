import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ParallelogramButton from './ParallelogramButton';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { colors } from '../src/styles/globalStyles';
import { useUserEquipment } from '../src/context/userEquipmentContext';
import { useStaticData } from '../src/context/staticDataContext';

// Equipment filter toggle component
const EquipmentToggle = ({ isMyEquipment, onToggle, themedStyles }) => {
  return (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[
          styles.toggleOption,
          isMyEquipment && { backgroundColor: themedStyles.accentColor }
        ]}
        onPress={() => onToggle(true)}
      >
        <Text
          style={[
            styles.toggleText,
            { color: isMyEquipment ? colors.flatBlack : themedStyles.textColor }
          ]}
        >
          My Equipment
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.toggleOption,
          !isMyEquipment && { backgroundColor: themedStyles.accentColor }
        ]}
        onPress={() => onToggle(false)}
      >
        <Text
          style={[
            styles.toggleText,
            {
              color: !isMyEquipment ? colors.flatBlack : themedStyles.textColor
            }
          ]}
        >
          All Equipment
        </Text>
      </TouchableOpacity>
    </View>
  );
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

  // Get static data from context
  const { isLoaded, getFormattedMuscles, getFormattedEquipment } =
    useStaticData();

  // Get user equipment from context
  const { userEquipment } = useUserEquipment();

  const [muscleOptions, setMuscleOptions] = useState([]);
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [showMyEquipment, setShowMyEquipment] = useState(false);
  const [displayedEquipment, setDisplayedEquipment] = useState([]);
  const { loadUserEquipment } = useUserEquipment();

  // Load data from static context when component mounts
  useEffect(() => {
    if (isLoaded) {
      setMuscleOptions(getFormattedMuscles());
      setEquipmentOptions(getFormattedEquipment());
    }
  }, [isLoaded]);

  useEffect(() => {
    if (showMyEquipment && userEquipment && userEquipment.length > 0) {
      // Get current equipment selections
      const currentEquipment = filterValues.equipment || [];

      // Create a set of new equipment (include both current selections and user equipment)
      const newEquipment = [
        ...new Set([...currentEquipment, ...userEquipment])
      ];

      // Update the filter with the combined equipment
      onFilterChange('equipment', newEquipment);
    }
  }, [showMyEquipment, userEquipment]);

  useEffect(() => {
    // This will run whenever userEquipment changes
    if (userEquipment && userEquipment.length > 0) {
      console.log('User equipment changed in context, updating filter');

      // If we're in "My Equipment" mode, update the selections
      if (showMyEquipment) {
        // Update the filter with the user's equipment
        onFilterChange('equipment', userEquipment);
      }

      // Update the displayed equipment options based on current toggle state
      if (showMyEquipment) {
        setDisplayedEquipment(
          equipmentOptions.filter(item => userEquipment.includes(item.value))
        );
      }
    }
  }, [userEquipment]);

  // Default to "My Equipment" if user has equipment
  useEffect(() => {
    if (userEquipment && userEquipment.length > 0) {
      setShowMyEquipment(true);
    }
  }, []);

  // Update displayed equipment when the toggle state changes or when userEquipment changes
  useEffect(() => {
    if (showMyEquipment && userEquipment && userEquipment.length > 0) {
      // Filter equipment to only show user's equipment
      setDisplayedEquipment(
        equipmentOptions.filter(item => userEquipment.includes(item.value))
      );
    } else {
      // Show all equipment
      setDisplayedEquipment(equipmentOptions);
    }
  }, [showMyEquipment, equipmentOptions, userEquipment]);

  useEffect(() => {
    if (isVisible) {
      refreshUserEquipment();
    }
  }, [isVisible]);

  const refreshUserEquipment = async () => {
    try {
      await loadUserEquipment();
      console.log('User equipment refreshed in filter');
    } catch (error) {
      console.error('Error refreshing user equipment:', error);
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

  const handleEquipmentFilterToggle = showOnlyUserEquipment => {
    setShowMyEquipment(showOnlyUserEquipment);
  };

  if (!isVisible) return null;

  // Check if user has equipment to determine whether to show the toggle
  const hasUserEquipment = userEquipment && userEquipment.length > 0;

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
                  <View style={styles.sectionHeader}>
                    <Text
                      style={[
                        styles.sectionTitleNoMargin,
                        { color: themedStyles.textColor }
                      ]}
                    >
                      Equipment
                    </Text>

                    {/* Only show toggle if user has equipment */}
                    {hasUserEquipment && (
                      <EquipmentToggle
                        isMyEquipment={showMyEquipment}
                        onToggle={handleEquipmentFilterToggle}
                        themedStyles={themedStyles}
                      />
                    )}
                  </View>

                  <View style={styles.chipContainer}>
                    {displayedEquipment.map(equipment => (
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionTitle: {
    fontFamily: 'Lexend',
    fontSize: 14,
    marginBottom: 10
  },
  sectionTitleNoMargin: {
    fontFamily: 'Lexend',
    fontSize: 14
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
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#2A2A2C',
    height: 32
  },
  toggleOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80
  },
  toggleText: {
    fontFamily: 'Lexend',
    fontSize: 12
  }
});

export default ExerciseFilter;
