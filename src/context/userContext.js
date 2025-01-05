// userContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './authContext';

const initialState = {
  userId: null,
  email: null,
  isLoading: true
};

export const UserContext = createContext();

const userReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER_DATA':
      return {
        ...state,
        userId: action.payload.id,
        email: action.payload.email,
        username: action.payload.username,
        isLoading: false
      };
    case 'CLEAR_USER_DATA':
      return initialState;
    default:
      return state;
  }
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return {
    userId: context.userId,
    userName: context.userName,
    email: context.email
  };
};

export const UserProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(userReducer, initialState);

  useEffect(() => {
    if (user?.id) {
      dispatch({ type: 'SET_USER_DATA', payload: user });
    } else {
      dispatch({ type: 'CLEAR_USER_DATA' });
    }
  }, [user]);

  return (
    <UserContext.Provider
      value={{
        userId: state.userId,
        email: state.email,
        username: state.username,
        dispatch
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
