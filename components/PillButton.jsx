import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { colors } from '../src/styles/globalStyles';

const PillButton = ({ label, icon, onPress, style }) => {
  const { state } = useTheme();
  const themedStyles = getThemedStyles(state.theme, state.accentColor);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor:
            state.theme === 'dark' ? themedStyles.accentColor : colors.eggShell
        },
        style
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor:
              state.theme === 'dark'
                ? colors.flatBlack
                : themedStyles.accentColor
          }
        ]}
      >
        {icon}
      </View>
      <Text
        style={[
          styles.label,
          {
            color:
              state.theme === 'dark'
                ? colors.flatBlack
                : themedStyles.accentColor
          }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingVertical: 1,
    // paddingLeft: 0,
    paddingRight: 12,
    borderRadius: 25,
    alignSelf: 'flex-start'
  },
  iconContainer: {
    marginRight: 8,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14
  },
  label: {
    fontWeight: '600',
    fontSize: 16
  }
});

export default PillButton;
