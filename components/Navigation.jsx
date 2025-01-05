import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';

const NavigationItem = ({ name, icon, isActive, onPress, accentColor }) => {
  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      {React.cloneElement(icon, {
        style: [
          styles.navIcon,
          { color: themedStyles.textColor },
          isActive && { color: accentColor }
        ]
      })}
      <Text
        style={[
          styles.navText,
          { color: themedStyles.textColor },
          isActive && { color: accentColor }
        ]}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const Navigation = ({ state, descriptors, navigation }) => {
  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  const handleWorkoutPress = async () => {
    try {
      navigation.navigate('Workout', {
        screen: 'WorkoutMain'
      });
    } catch (error) {
      console.error('Error handling workout navigation:', error);
      navigation.navigate('Workout', { screen: 'WorkoutMain' });
    }
  };

  const getIcon = routeName => {
    switch (routeName) {
      case 'Programs':
        return <Ionicons name='clipboard-outline' />;
      case 'Workout':
        return <Ionicons name='barbell-outline' />;
      case 'Progress':
        return <Ionicons name='analytics-outline' />;
      case 'Profile':
        return <Ionicons name='person-outline' />;
      default:
        return <Text>❓</Text>;
    }
  };

  return (
    <View
      style={[
        styles.navigation,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          if (route.name === 'Workout') {
            handleWorkoutPress();
            return;
          }

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <NavigationItem
            key={route.key}
            name={label.toString()}
            icon={getIcon(route.name)}
            isActive={isFocused}
            onPress={onPress}
            accentColor={themedStyles.accentColor}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingVertical: 10
  },
  navItem: {
    alignItems: 'center'
  },
  navIcon: {
    fontSize: 22,
    marginBottom: 2
  },
  navText: {
    fontSize: 12,
    marginBottom: 10
  }
});

export default Navigation;
