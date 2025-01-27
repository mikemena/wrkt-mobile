import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

const withKeyboardAvoidingView = WrappedComponent => {
  return props => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 500 })} // Adjust this value as needed
    >
      <WrappedComponent {...props} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent'
  }
});

export default withKeyboardAvoidingView;
