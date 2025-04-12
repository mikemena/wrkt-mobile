import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { colors } from '../src/styles/globalStyles';
import Constants from 'expo-constants';

const Header = ({ pageName }) => {
  const { state } = useTheme();
  const themedStyles = getThemedStyles(state.theme, state.accentColor);

  const appVersion = Constants.expoConfig?.version;

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <Text style={[styles.logo, { color: themedStyles.accentColor }]}>
        WRKT
      </Text>
      <Text style={[styles.footerInfo, { color: themedStyles.textColor }]}>
        {appVersion}
      </Text>

      <Text style={[styles.pageName]}>{pageName.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 10,
    paddingTop: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'Tiny5'
  },
  pageName: {
    fontFamily: 'Teko',
    fontSize: 24,
    color: colors.gray
  },
  appVersion: {
    fontFamily: 'Teko',
    fontSize: 20
  }
});

export default Header;
