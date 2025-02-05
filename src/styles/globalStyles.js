import { StyleSheet } from 'react-native';

export const colors = {
  orange: '#F99C57',
  voltGreen: '#A6E221',
  green: '#159651',
  red: '#D93B56',
  blue: '#3F75DF',
  pink: '#FC63D2',
  black: '#2A2A2A',
  flatBlack: '#3D3E43',
  offWhite: '#DBD7D5',
  eggShell: '#EAE9E9',
  gray: '#7A7978',
  babyBlue: '#cadae5',
  background: {
    dark: '#2A2A2A',
    light: '#DBD7D5'
  },
  text: {
    dark: '#DBD7D5',
    light: '#2A2A2A'
  }
};

export const typography = {
  fontSizes: {
    small: 12,
    medium: 16,
    large: 20,
    extraLarge: 24
  },
  fontWeights: {
    normal: '400',
    bold: '700'
  }
};

export const spacing = {
  small: 5,
  medium: 10,
  large: 20
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.small
  },
  header: {
    fontSize: typography.fontSizes.large
  },
  section: {
    marginBottom: 20,
    overflow: 'hidden'
  },
  sectionContent: {
    padding: 10,
    marginBottom: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10
  },
  sectionTitle: {
    fontFamily: 'Lexend',
    fontSize: typography.fontSizes.medium,
    marginLeft: spacing.medium
  },
  input: {
    fontFamily: 'Lexend',
    fontSize: typography.fontSizes.medium,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    height: 50,
    paddingHorizontal: 15,
    justifyContent: 'center'
  },
  centeredButtonContainer: {
    width: '100%',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center'
  },

  label: {
    fontFamily: 'Lexend',
    fontSize: 16,
    marginBottom: 5,
    marginLeft: 10
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0)'
  },
  iconLeft: {
    alignSelf: 'flex-start'
  },
  iconRight: {
    alignSelf: 'flex-end'
  },
  icon: {
    fontSize: 20
  }
});
