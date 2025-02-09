import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (userToken && userData) {
        const parsedUser = JSON.parse(userData);
        setUser({
          ...parsedUser,
          id: Number(parsedUser.id)
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const signIn = async (token, userData) => {
    try {
      if (!userData || !userData.id) {
        throw new Error('Invalid user data');
      }
      console.log('Received user data in signIn:', userData);

      const normalizedUserData = {
        ...userData,
        id: Number(userData.id)
      };

      console.log('Normalized user data in AuthContext:', normalizedUserData);

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem(
        'userData',
        JSON.stringify(normalizedUserData)
      );
      setUser(normalizedUserData);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
