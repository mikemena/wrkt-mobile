import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/services/api';
import ParallelogramButton from '../components/ParallelogramButton';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../src/hooks/useTheme';
import { useAuth } from '../src/context/authContext';
import { getThemedStyles } from '../src/utils/themeUtils';
import { globalStyles, colors } from '../src/styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  EQUIPMENT: 'equipment_cache'
};

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const ProfileView = ({ navigation, route }) => {
  const { initialUserName = '', initialEmail = '' } = route?.params || {};

  const { state: themeState, dispatch } = useTheme();
  const { user, signOut } = useAuth();
  const [userName, setUserName] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isEquipmentExpanded, setIsEquipmentExpanded] = useState(false);
  const [darkMode, setDarkMode] = useState(themeState.theme === 'dark');
  const [accentColor, setAccentColor] = useState(themeState.accentColor);
  const [userDataChanged, setUserDataChanged] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [equipmentChanged, setEquipmentChanged] = useState(false);

  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  const accentColors = [
    '#F99C57', //orange
    '#A6E221', //volt green
    '#159651', // green
    '#D93B56', //red
    '#3F75DF', //blue
    '#FC63D2' //pink
  ];

  useEffect(() => {
    setDarkMode(themeState.theme === 'dark');
  }, [themeState.theme]);

  useEffect(() => {
    // Load equipment data when component mounts
    loadEquipmentData();
    // Load user's selected equipment if available
    if (user && user.id) {
      loadUserEquipment();
    }
  }, [user]);

  const getCachedData = async key => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  };

  const setCachedData = async (key, data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  };

  const fetchEquipment = async () => {
    try {
      const data = await api.get('/api/equipments');
      return data.map(equipment => ({
        label: equipment.name,
        value: equipment.name
      }));
    } catch (error) {
      console.error('Equipment fetch error:', error);
      return [];
    }
  };

  const loadEquipmentData = async () => {
    try {
      let equipment = await getCachedData(CACHE_KEYS.EQUIPMENT);
      if (!equipment || !Array.isArray(equipment) || equipment.length === 0) {
        equipment = await fetchEquipment();
        if (equipment.length > 0) {
          await setCachedData(CACHE_KEYS.EQUIPMENT, equipment);
        }
      }
      setEquipmentOptions(equipment || []);
    } catch (error) {
      console.error('Error in loadEquipmentData:', error);
    }
  };

  const loadUserEquipment = async () => {
    try {
      const userData = await api.get(`/api/users/${user.id}/equipment`);
      if (userData && Array.isArray(userData)) {
        setSelectedEquipment(userData);
      } else {
        setSelectedEquipment([]);
      }
    } catch (error) {
      console.error('Error loading user equipment:', error);
      setSelectedEquipment([]);
    }
  };

  // Update these when respective fields change
  const handleUserNameChange = value => {
    setUserName(value);
    setUserDataChanged(true);
  };

  const handleEmailChange = value => {
    setEmail(value);
    setUserDataChanged(true);
  };

  const handleEquipmentToggle = equipmentValue => {
    const newSelectedEquipment = selectedEquipment.includes(equipmentValue)
      ? selectedEquipment.filter(e => e !== equipmentValue)
      : [...selectedEquipment, equipmentValue];

    setSelectedEquipment(newSelectedEquipment);
    setEquipmentChanged(true);
  };

  const handleSave = async () => {
    try {
      const updates = [];

      if (userDataChanged) {
        updates.push(
          api.post(`/api/users/${user.id}`, {
            method: 'PUT',
            body: { username: userName, email }
          })
        );
      }

      if (settingsChanged) {
        // update context
        dispatch({ type: 'SET_THEME', payload: darkMode ? 'dark' : 'light' });
        dispatch({ type: 'SET_ACCENT_COLOR', payload: accentColor });

        //save to server
        updates.push(
          api.post(`/api/settings/${user.id}`, {
            method: 'PUT',
            body: {
              theme_mode: darkMode ? 'dark' : 'light',
              accent_color: accentColor
            }
          })
        );
      }

      if (equipmentChanged) {
        // Debug logging
        console.log('About to save equipment for user:', user.id);
        console.log('Equipment data:', JSON.stringify(selectedEquipment));

        try {
          // Use fetch directly for more control
          const apiUrl = 'https://wrkt-backend-development.up.railway.app'; // replace with your actual API URL
          const endpoint = `/api/users/${user.id}/equipment`;
          const url = `${apiUrl}${endpoint}`;

          console.log('Making request to:', url);
          console.log(
            'Request body:',
            JSON.stringify({ equipment: selectedEquipment })
          );

          const response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({ equipment: selectedEquipment })
          });

          console.log('Response status:', response.status);
          console.log('Response headers:', JSON.stringify(response.headers));

          // Try to read the response as text first
          const responseText = await response.text();
          console.log('Response text:', responseText);

          // If we got a successful response and it looks like JSON, parse it
          if (response.ok && responseText.trim().startsWith('{')) {
            const responseData = JSON.parse(responseText);
            console.log('Parsed response:', responseData);
          }

          if (!response.ok) {
            throw new Error(
              `Server responded with status ${response.status}: ${responseText}`
            );
          }

          // If we got here, the equipment was saved successfully
          console.log('Equipment saved successfully');
        } catch (equipmentError) {
          console.error('Equipment save error:', equipmentError);
          // Don't throw the error so other operations can continue
        }
      }

      try {
        await Promise.all(updates);

        setUserDataChanged(false);
        setSettingsChanged(false);
        setEquipmentChanged(false);
        setIsEditing(false);
      } catch (updateError) {
        console.error('Error in Promise.all updates:', updateError);
      }
    } catch (error) {
      console.error('Overall error saving changes:', error);
      // Add error handling UI feedback here
    }
  };

  const handleCancel = () => {
    setUserName(initialUserName);
    setEmail(initialEmail);
    // Reset equipment selection by reloading user equipment
    loadUserEquipment();
    setIsEditing(false);
    setEquipmentChanged(false);
  };

  const handleDarkModeToggle = value => {
    setDarkMode(value);
    setSettingsChanged(true);

    dispatch({ type: 'SET_THEME', payload: value ? 'dark' : 'light' });
  };

  const handleAccentColorChange = newColor => {
    setAccentColor(newColor);
    setSettingsChanged(true);

    dispatch({ type: 'SET_ACCENT_COLOR', payload: newColor });
  };

  const handleSectionToggle = section => {
    if (section === 'profile') {
      setIsProfileExpanded(!isProfileExpanded);
      setIsSettingsExpanded(false);
      setIsEquipmentExpanded(false);
    } else if (section === 'equipment') {
      setIsEquipmentExpanded(!isEquipmentExpanded);
      setIsSettingsExpanded(false);
      setIsProfileExpanded(false);
    } else {
      setIsSettingsExpanded(!isSettingsExpanded);
      setIsProfileExpanded(false);
      setIsEquipmentExpanded(false);
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

  // Function to chunk equipment options into rows of 2
  const chunkEquipment = (arr, size) => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );
  };

  // Split equipment options into two columns
  const equipmentChunks = chunkEquipment(equipmentOptions, 2);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <Header pageName='Profile' />
      <ScrollView style={globalStyles.container}>
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
                    {color === themeState.accentColor && (
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

        {/* New Equipment Section */}
        <View
          style={[
            globalStyles.section,
            { backgroundColor: themedStyles.secondaryBackgroundColor }
          ]}
        >
          <TouchableOpacity onPress={() => handleSectionToggle('equipment')}>
            <View
              style={[
                globalStyles.sectionHeader,
                { backgroundColor: themedStyles.secondaryBackgroundColor }
              ]}
            >
              <Ionicons
                name='barbell-outline'
                style={[globalStyles.icon, { color: themedStyles.textColor }]}
              />

              <Text
                style={[
                  globalStyles.sectionTitle,
                  { color: themedStyles.textColor, flex: 1 }
                ]}
              >
                Equipment
              </Text>
              <View
                style={[
                  globalStyles.iconCircle,
                  { backgroundColor: themedStyles.primaryBackgroundColor }
                ]}
              >
                <Ionicons
                  name={
                    isEquipmentExpanded
                      ? 'chevron-up-outline'
                      : 'chevron-down-outline'
                  }
                  style={[globalStyles.icon, { color: themedStyles.textColor }]}
                />
              </View>
            </View>
          </TouchableOpacity>

          {isEquipmentExpanded && (
            <View
              style={[
                globalStyles.sectionContent,
                {
                  backgroundColor: themedStyles.secondaryBackgroundColor,
                  paddingHorizontal: 10
                }
              ]}
            >
              <View style={styles.equipmentContainer}>
                {equipmentOptions.length === 0 ? (
                  <Text style={{ color: themedStyles.textColor }}>
                    Loading equipment...
                  </Text>
                ) : (
                  <View style={styles.equipmentGrid}>
                    {equipmentChunks.map((row, rowIndex) => (
                      <View key={`row-${rowIndex}`} style={styles.equipmentRow}>
                        {row.map(equipment => (
                          <View
                            key={equipment.value}
                            style={styles.equipmentItem}
                          >
                            <TouchableOpacity
                              style={styles.checkboxContainer}
                              disabled={!isEditing}
                              onPress={() =>
                                handleEquipmentToggle(equipment.value)
                              }
                            >
                              <View
                                style={[
                                  styles.checkbox,
                                  {
                                    backgroundColor: selectedEquipment.includes(
                                      equipment.value
                                    )
                                      ? themedStyles.accentColor
                                      : 'transparent',
                                    borderColor: themedStyles.textColor
                                  }
                                ]}
                              >
                                {selectedEquipment.includes(
                                  equipment.value
                                ) && (
                                  <Ionicons
                                    name='checkmark'
                                    size={14}
                                    color={colors.black}
                                  />
                                )}
                              </View>
                              <Text
                                style={[
                                  styles.equipmentLabel,
                                  { color: themedStyles.textColor }
                                ]}
                              >
                                {equipment.label}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {!isEditing ? (
          <View style={globalStyles.centeredButtonContainer}>
            <ParallelogramButton
              label='EDIT'
              style={[{ width: 300, alignItems: 'center' }]}
              onPress={() => setIsEditing(true)}
            />
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <ParallelogramButton
              label='SAVE'
              style={[{ width: 150, alignItems: 'center' }]}
              onPress={handleSave}
            />
            <ParallelogramButton
              label='CANCEL'
              style={[{ width: 150, alignItems: 'center' }]}
              onPress={handleCancel}
            />
          </View>
        )}

        <View style={[globalStyles.section]}>
          <View style={globalStyles.centeredButtonContainer}>
            <ParallelogramButton
              label='SIGN OUT'
              style={[{ width: 300, alignItems: 'center' }]}
              onPress={handleSignOut}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
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
    marginTop: 10,
    marginHorizontal: 20
  },
  saveButton: {
    flex: 1,
    marginRight: 10
  },
  cancelButton: {
    flex: 1,
    marginLeft: 10
  },
  equipmentContainer: {
    marginTop: 10,
    marginBottom: 10
  },
  equipmentGrid: {
    width: '100%'
  },
  equipmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  equipmentItem: {
    width: '48%'
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  equipmentLabel: {
    fontFamily: 'Lexend',
    fontSize: 14
  }
});

export default ProfileView;
