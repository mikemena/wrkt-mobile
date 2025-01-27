// withKeyboardAvoidingView.js
import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { getThemedStyles } from '../utils/themeUtils';

const withKeyboardAvoidingView = WrappedComponent => {
  return props => {
    const { state: themeState } = useTheme();
    const themedStyles = getThemedStyles(themeState.theme);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
      const keyboardWillShow = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        e => {
          setKeyboardHeight(e.endCoordinates.height);
          setIsKeyboardVisible(true);
        }
      );

      const keyboardWillHide = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => {
          setKeyboardHeight(0);
          setIsKeyboardVisible(false);
        }
      );
      return () => {
        keyboardWillShow.remove();
        keyboardWillHide.remove();
      };
    }, []);

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={[
          { flex: 1 },
          { backgroundColor: themedStyles.primaryBackgroundColor }
        ]}
      >
        <WrappedComponent
          {...props}
          keyboardHeight={keyboardHeight}
          isKeyboardVisible={isKeyboardVisible}
        />
      </KeyboardAvoidingView>
    );
  };
};

export default withKeyboardAvoidingView;
