import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/services/api';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import Header from '../components/Header';
import ParallelogramButton from '../components/ParallelogramButton';

const ForgotPasswordView = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResetButtonVisible, setIsResetButtonVisible] = useState(true);

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  // Email validation pattern
  const validateEmail = email => {
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!email) {
      return 'Email is required';
    }
    if (!emailPattern.test(email)) {
      return 'Enter a valid email address';
    }
    return '';
  };

  const handleEmailChange = text => {
    setEmail(text);
    setEmailError(validateEmail(text));
  };

  const handleResetPassword = async () => {
    // Clear any previous general error
    setGeneralError('');

    const newEmailError = validateEmail(email);
    setEmailError(newEmailError);

    if (newEmailError) {
      return;
    }

    setLoading(true);
    setSuccess('');

    try {
      const data = await api.post('/api/auth/forgot-password', { email });

      setSuccess(data.message);
      setIsResetButtonVisible(false);
    } catch (err) {
      setGeneralError(err.message || 'Failed to request password reset');
      setIsResetButtonVisible(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <Header pageName='RESET PASSWORD' />
      <View style={styles.content}>
        <Text style={[styles.title, { color: themedStyles.textColor }]}>
          Reset your password
        </Text>

        <Text style={[styles.description, { color: themedStyles.textColor }]}>
          Enter your email address and we'll send you instructions to reset your
          password.
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: themedStyles.secondaryBackgroundColor,
              color: themedStyles.textColor
            }
          ]}
          placeholder='Email'
          placeholderTextColor={themedStyles.textColor}
          value={email}
          onChangeText={handleEmailChange}
          autoCapitalize='none'
          keyboardType='email-address'
        />

        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        {success ? (
          <Text
            style={[styles.successText, { color: themedStyles.accentColor }]}
          >
            {success}
          </Text>
        ) : null}

        {isResetButtonVisible ? (
          <View style={styles.buttonContainer}>
            <ParallelogramButton
              style={[{ width: 300, alignItems: 'center' }]}
              label='RESET PASSWORD'
              onPress={handleResetPassword}
              disabled={loading}
            />
          </View>
        ) : null}
        {generalError ? (
          <Text style={styles.errorText}>{generalError}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text
            style={[styles.backButtonText, { color: themedStyles.textColor }]}
          >
            Back to Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20
  },
  content: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 24,
    fontFamily: 'Lexend',
    marginBottom: 20
  },
  description: {
    fontSize: 16,
    fontFamily: 'Lexend',
    marginBottom: 30,
    opacity: 0.8
  },
  input: {
    height: 50,
    borderRadius: 5,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Lexend'
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    color: '#D93B56',
    fontSize: 14,
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 10,
    fontFamily: 'Lexend'
  },
  successText: {
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'Lexend'
  },
  backButton: {
    marginTop: 20
  },
  backButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Lexend'
  }
});

export default ForgotPasswordView;
