import React, { createContext, useReducer, useEffect } from 'react';
import { useUser } from '../context/userContext.js';
import { api } from '../services/api.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themeReducer, initialState } from '../reducers/themeReducer';

export const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  const { userId } = useUser();
  const [state, dispatch] = useReducer(themeReducer, initialState);

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (userId) {
        try {
          const settings = await api.get(`/api/settings/${userId}`);

          dispatch({
            type: 'SET_THEME',
            payload: settings.theme_mode
          });
          dispatch({
            type: 'SET_ACCENT_COLOR',
            payload: settings.accent_color
          });
        } catch (error) {
          console.error('Error fetching user settings:', error);
        }
      }
    };

    fetchUserSettings();
  }, [userId]);
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem('theme', state.theme);
        await AsyncStorage.setItem('accentColor', state.accentColor);
      } catch (e) {
        console.error('Failed to save theme settings', e);
      }
    };
    saveTheme();
  }, [state.theme, state.accentColor]);

  return (
    <ThemeContext.Provider value={{ state, dispatch }}>
      {children}
    </ThemeContext.Provider>
  );
};
