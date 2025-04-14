import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../src/styles/globalStyles';

const ToggleSwitch = ({
  leftLabel,
  rightLabel,
  isRightSelected,
  onToggle,
  themedStyles
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.toggleWrapper}>
        <TouchableOpacity
          style={[
            styles.toggleOption,
            styles.leftOption,
            !isRightSelected && styles.activeOption,
            !isRightSelected && { backgroundColor: themedStyles.accentColor }
          ]}
          onPress={() => onToggle(false)}
        >
          <Text
            style={[
              styles.toggleText,
              {
                color: !isRightSelected
                  ? colors.flatBlack
                  : themedStyles.textColor
              }
            ]}
          >
            {leftLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleOption,
            styles.rightOption,
            isRightSelected && styles.activeOption,
            isRightSelected && { backgroundColor: themedStyles.accentColor }
          ]}
          onPress={() => onToggle(true)}
        >
          <Text
            style={[
              styles.toggleText,
              {
                color: isRightSelected
                  ? colors.flatBlack
                  : themedStyles.textColor
              }
            ]}
          >
            {rightLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2C', // Darker background for inactive state
    borderRadius: 28, // More rounded pill shape
    padding: 2, // Add padding for inner elements
    position: 'relative'
  },
  toggleOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120, // Wider buttons
    zIndex: 1 // Ensure text is above the background
  },
  leftOption: {
    borderRadius: 28 // Match parent's border radius
  },
  rightOption: {
    borderRadius: 28 // Match parent's border radius
  },
  activeOption: {
    // The active styling will be applied through the inline style for the background color
    borderRadius: 28, // Fully rounded ends
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3
  },
  toggleText: {
    fontFamily: 'Lexend',
    fontSize: 14,
    fontWeight: '500'
  }
});

export default ToggleSwitch;
