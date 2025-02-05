import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated
} from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { colors } from '../src/styles/globalStyles';

const ParallelogramButton = ({
  label,
  icon,
  onPress,
  style,
  iconStyle,
  iconSpacing = 8, // Default spacing between icon and label
  iconPosition = 'left', // Could be extended to support 'right' in the future
  contentContainerStyle // Additional styling for the content container
}) => {
  const { state } = useTheme();
  const themedStyles = getThemedStyles(state.theme, state.accentColor);

  const offsetAnim = React.useRef(new Animated.ValueXY({ x: 2, y: 2 })).current;

  const animatePress = () => {
    Animated.spring(offsetAnim, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true
    }).start();
  };

  const animateRelease = () => {
    Animated.spring(offsetAnim, {
      toValue: { x: 2, y: 2 },
      useNativeDriver: true
    }).start();
  };

  // Compute padding based on whether there's an icon
  const contentPadding = React.useMemo(() => {
    const basePadding = 20;
    if (!icon) return { paddingHorizontal: basePadding };

    return {
      paddingLeft: iconPosition === 'left' ? basePadding / 2 : basePadding,
      paddingRight: iconPosition === 'left' ? basePadding : basePadding / 2
    };
  }, [icon, iconPosition]);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={animatePress}
      onPressOut={animateRelease}
      style={[styles.buttonContainer, style]}
      activeOpacity={1}
    >
      <View
        style={[
          styles.parallelogramBase,
          {
            backgroundColor: themedStyles.accentColor
          }
        ]}
      />

      <Animated.View
        style={[
          styles.parallelogramTop,
          {
            backgroundColor:
              state.theme === 'dark' ? colors.flatBlack : colors.eggShell,
            transform: [
              { translateX: offsetAnim.x },
              { translateY: offsetAnim.y },
              { skewX: '-12deg' }
            ]
          }
        ]}
      />

      <View
        style={[styles.contentContainer, contentPadding, contentContainerStyle]}
      >
        {icon && iconPosition === 'left' && (
          <View
            style={[
              styles.iconContainer,
              { marginRight: iconSpacing },
              iconStyle
            ]}
          >
            {icon}
          </View>
        )}

        <Text style={[styles.label, { color: themedStyles.textColor }]}>
          {label}
        </Text>

        {icon && iconPosition === 'right' && (
          <View
            style={[
              styles.iconContainer,
              { marginLeft: iconSpacing },
              iconStyle
            ]}
          >
            {icon}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    height: 40,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    marginVertical: 10,
    marginHorizontal: 10
  },
  parallelogramBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transform: [{ skewX: '-12deg' }]
  },
  parallelogramTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ skewX: '-12deg' }]
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  label: {
    fontWeight: '500',
    fontSize: 15
  }
});

export default ParallelogramButton;
