import React, { useState } from 'react';
import Header from '../components/Header';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet
} from 'react-native';
import { useConfig } from '../src/context/configContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../src/hooks/useTheme';
import { useAuth } from '../src/context/authContext';

import { getThemedStyles } from '../src/utils/themeUtils';
import { globalStyles, colors } from '../src/styles/globalStyles';

const ProfileView = ({ navigation, route }) => {
  const {
    initialUserName = '',
    initialEmail = '',
    initialDarkMode = false,
    initialAccentColor = ''
  } = route?.params || {};

  const { user, signOut } = useAuth();
  const { apiUrl, isLoadingConfig } = useConfig();
  const [userName, setUserName] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [darkMode, setDarkMode] = useState(initialDarkMode);
  const [accentColor, setAccentColor] = useState(initialAccentColor);
  const [userDataChanged, setUserDataChanged] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const { state, dispatch } = useTheme();
  const themedStyles = getThemedStyles(state.theme, state.accentColor);

  console.log('Full user object in ProfileView:', user);

  const accentColors = [
    '#F99C57', //orange
    '#A6E221', //volt green
    '#159651', // green
    '#D93B56', //red
    '#3F75DF', //blue
    '#FC63D2' //pink
  ];

  // Update these when respective fields change
  const handleUserNameChange = value => {
    setUserName(value);
    setUserDataChanged(true);
  };

  const handleEmailChange = value => {
    setEmail(value);
    setUserDataChanged(true);
  };

  const handleSave = async () => {
    try {
      const updates = [];

      if (userDataChanged) {
        updates.push(
          fetch(`${apiUrl}/api/users/${user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({ username: userName, email })
          })
        );
      }

      if (settingsChanged) {
        updates.push(
          fetch(`${apiUrl}/api/settings/${user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({
              theme_mode: darkMode ? 'dark' : 'light',
              accent_color: accentColor
            })
          })
        );
      }

      const responses = await Promise.all(updates);

      // Check if all responses were successful
      for (const response of responses) {
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          throw new Error(`Server error: ${response.status}`);
        }
      }

      setUserDataChanged(false);
      setSettingsChanged(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      // Add error handling UI feedback here
    }
  };

  const handleCancel = () => {
    setUserName(initialUserName);
    setEmail(initialEmail);
    setIsEditing(false);
  };

  const handleDarkModeToggle = value => {
    setDarkMode(value);
    dispatch({ type: 'SET_THEME', payload: value ? 'dark' : 'light' });
    setSettingsChanged(true);
  };

  const handleAccentColorChange = newColor => {
    setAccentColor(newColor);
    dispatch({ type: 'SET_ACCENT_COLOR', payload: newColor });
    setSettingsChanged(true);
  };

  const handleSectionToggle = section => {
    if (section === 'profile') {
      setIsProfileExpanded(!isProfileExpanded);
      setIsSettingsExpanded(false);
    } else {
      setIsSettingsExpanded(!isSettingsExpanded);
      setIsProfileExpanded(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }]
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <Header pageName='Profile' />

      <View style={globalStyles.container}>
        <View
          style={[
            globalStyles.section,
            { backgroundColor: themedStyles.secondaryBackgroundColor }
          ]}
        >
          <TouchableOpacity onPress={() => handleSectionToggle('profile')}>
            <View
              style={[
                globalStyles.sectionHeader,
                { backgroundColor: themedStyles.secondaryBackgroundColor }
              ]}
            >
              <Ionicons
                name='person-outline'
                style={[globalStyles.icon, { color: themedStyles.textColor }]}
              />

              <Text
                style={[
                  globalStyles.sectionTitle,
                  { color: themedStyles.textColor, flex: 1 }
                ]}
              >
                Profile Details
              </Text>
              <View
                style={[
                  globalStyles.iconCircle,
                  { backgroundColor: themedStyles.primaryBackgroundColor }
                ]}
              >
                <Ionicons
                  name={
                    isProfileExpanded
                      ? 'chevron-up-outline'
                      : 'chevron-down-outline'
                  }
                  style={[globalStyles.icon, { color: themedStyles.textColor }]}
                />
              </View>
            </View>
          </TouchableOpacity>

          {isProfileExpanded && (
            <View
              style={[
                globalStyles.sectionContent,
                { backgroundColor: themedStyles.secondaryBackgroundColor }
              ]}
            >
              <Text
                style={[globalStyles.label, { color: themedStyles.textColor }]}
              >
                User Name
              </Text>
              <TextInput
                style={[
                  globalStyles.input,
                  { backgroundColor: themedStyles.primaryBackgroundColor },
                  { color: themedStyles.textColor }
                ]}
                autoCapitalize='none'
                value={userName}
                onChangeText={handleUserNameChange}
                editable={isEditing}
              />
              <Text
                style={[globalStyles.label, { color: themedStyles.textColor }]}
              >
                Email
              </Text>
              <TextInput
                style={[
                  globalStyles.input,
                  { backgroundColor: themedStyles.primaryBackgroundColor },
                  { color: themedStyles.textColor }
                ]}
                value={email}
                onChangeText={handleEmailChange}
                editable={isEditing}
                keyboardType='email-address'
              />
            </View>
          )}
        </View>

        <View
          style={[
            globalStyles.section,
            { backgroundColor: themedStyles.secondaryBackgroundColor }
          ]}
        >
          <TouchableOpacity onPress={() => handleSectionToggle('settings')}>
            <View
              style={[
                globalStyles.sectionHeader,
                { backgroundColor: themedStyles.secondaryBackgroundColor }
              ]}
            >
              <Ionicons
                name='settings-outline'
                style={[globalStyles.icon, { color: themedStyles.textColor }]}
              />

              <Text
                style={[
                  globalStyles.sectionTitle,
                  { color: themedStyles.textColor, flex: 1 }
                ]}
              >
                Settings
              </Text>
              <View
                style={[
                  globalStyles.iconCircle,
                  { backgroundColor: themedStyles.primaryBackgroundColor }
                ]}
              >
                <Ionicons
                  name={
                    isSettingsExpanded
                      ? 'chevron-up-outline'
                      : 'chevron-down-outline'
                  }
                  style={[globalStyles.icon, { color: themedStyles.textColor }]}
                />
              </View>
            </View>
          </TouchableOpacity>

          {isSettingsExpanded && (
            <View
              style={[
                globalStyles.sectionContent,
                { backgroundColor: themedStyles.secondaryBackgroundColor }
              ]}
            >
              <View style={styles.settingRow}>
                <Ionicons
                  name='moon-outline'
                  style={[globalStyles.icon, { color: themedStyles.textColor }]}
                />

                <Text
                  style={[
                    styles.settingLabel,
                    { color: themedStyles.textColor }
                  ]}
                >
                  Dark Mode
                </Text>
                <Switch
                  value={darkMode}
                  onValueChange={handleDarkModeToggle}
                  trackColor={{ false: colors.offWhite, true: colors.green }}
                  thumbColor={darkMode ? colors.black : '#f4f3f4'}
                />
              </View>
              <View style={styles.settingRow}>
                <Ionicons
                  name='color-wand-outline'
                  style={[globalStyles.icon, { color: themedStyles.textColor }]}
                />

                <Text
                  style={[
                    styles.settingLabel,
                    { color: themedStyles.textColor }
                  ]}
                >
                  Accent Color
                </Text>
              </View>

              <View style={styles.colorPicker}>
                {accentColors.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorOption, { backgroundColor: color }]}
                    onPress={() => handleAccentColorChange(color)}
                  >
                    {color === state.accentColor && (
                      <View>
                        <Ionicons
                          name='checkmark-sharp'
                          size={20}
                          color={colors.black}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {!isEditing ? (
          <View style={globalStyles.centeredButtonContainer}>
            <TouchableOpacity
              style={[
                globalStyles.button,
                { backgroundColor: themedStyles.secondaryBackgroundColor }
              ]}
              onPress={() => setIsEditing(true)}
            >
              <Text
                style={[
                  globalStyles.buttonText,
                  { color: themedStyles.accentColor }
                ]}
              >
                EDIT
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                globalStyles.button,
                styles.saveButton,
                { backgroundColor: themedStyles.secondaryBackgroundColor }
              ]}
              onPress={handleSave}
            >
              <Text
                style={[
                  globalStyles.buttonText,
                  { color: themedStyles.accentColor }
                ]}
              >
                SAVE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                globalStyles.button,
                styles.cancelButton,
                { backgroundColor: themedStyles.secondaryBackgroundColor }
              ]}
              onPress={handleCancel}
            >
              <Text
                style={[
                  globalStyles.buttonText,
                  { color: themedStyles.accentColor }
                ]}
              >
                CANCEL
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={[globalStyles.section]}>
        <View style={globalStyles.centeredButtonContainer}>
          <TouchableOpacity
            style={[
              globalStyles.button,
              { backgroundColor: themedStyles.accentColor }
            ]}
            onPress={handleSignOut}
          >
            <Text style={[globalStyles.buttonText, { color: colors.black }]}>
              SIGN OUT
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
    borderStyle: 'solid',
    borderColor: colors.red
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderStyle: 'solid',
    borderColor: colors.red
  },
  settingLabel: {
    fontFamily: 'Lexend',
    flex: 1,
    marginLeft: 10
  },
  colorPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  saveButton: {
    flex: 1,
    marginRight: 10
  },
  cancelButton: {
    flex: 1,
    marginLeft: 10
  }
});

export default ProfileView;
