import { colors } from '../styles/globalStyles';

export const getThemedStyles = (theme, accentColor) => ({
  primaryBackgroundColor: theme === 'light' ? colors.offWhite : colors.black,
  secondaryBackgroundColor:
    theme === 'light' ? colors.eggShell : colors.flatBlack,
  textColor: theme === 'light' ? colors.flatBlack : colors.offWhite,
  altTextColor: theme === 'light' ? colors.flatBlack : colors.eggShell,
  accentColor: accentColor,
  overlayOpacity: theme === 'light' ? 0.1 : 0.6
});
