// components/AddButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../src/styles/globalStyles';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';

const SecondaryButton = ({
  label = 'label',
  onPress,
  style,
  textStyle,
  iconName,
  iconSize = 18,
  containerStyle
}) => {
  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  return (
    <TouchableOpacity
      style={[
        globalStyles.button,
        styles.button,
        { backgroundColor: themedStyles.secondaryBackgroundColor },
        containerStyle,
        style
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={iconName}
        size={iconSize}
        style={{
          color: themedStyles.accentColor,
          marginRight: 8
        }}
      />
      <Text
        style={[
          globalStyles.buttonText,
          styles.buttonText,
          {
            color: themedStyles.textColor
          },
          textStyle
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: 30,
    marginTop: 1,
    paddingHorizontal: 10,
    marginHorizontal: 5,
    alignSelf: 'flex-start',
    borderRadius: 5
  },
  buttonText: {
    fontFamily: 'Lexend',
    fontSize: 16,
    fontWeight: 'semibold',
    paddingRight: 5
  }
});

export default SecondaryButton;
