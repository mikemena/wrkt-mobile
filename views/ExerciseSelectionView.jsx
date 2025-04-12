import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExerciseSelection from '../components/ExerciseSelection';
import Header from '../components/Header';
import { globalStyles } from '../src/styles/globalStyles';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';

const ExerciseSelectionView = ({ route, navigation }) => {
  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  return (
    <SafeAreaView
      style={[
        globalStyles.container,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <Header pageName='Exercises' />
      <View style={{ flex: 1 }}>
        <ExerciseSelection navigation={navigation} route={route} />
      </View>
    </SafeAreaView>
  );
};

export default ExerciseSelectionView;
