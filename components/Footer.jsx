import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import Constants from 'expo-constants';

const Footer = () => {
  const { state } = useTheme();
  const themedStyles = getThemedStyles(state.theme, state.accentColor);
  const appVersion = Constants.expoConfig?.version;
  const apiUrl = Constants.expoConfig?.extra?.apiUrl;
  const appEnv = Constants.expoConfig?.extra?.env;

  return (
    <View
      style={[
        styles.footer,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <Text style={[styles.footerInfo, { color: themedStyles.textColor }]}>
        v{appVersion}
      </Text>
      <Text style={[styles.footerInfo, { color: themedStyles.textColor }]}>
        `Env: {appEnv}`
      </Text>
      <Text style={[styles.footerInfo, { color: themedStyles.textColor }]}>
        {apiUrl}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  footerInfo: {
    textAlign: 'center',
    fontSize: 12
  }
});

export default Footer;
