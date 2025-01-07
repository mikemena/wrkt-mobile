import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useConfig } from '../src/context/configContext';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';

const ForgotPasswordView = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResetButtonVisible, setIsResetButtonVisible] = useState(true);
  const { apiUrl, isLoadingConfig } = useConfig();

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
      const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to request password reset');
      }

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
      <View style={styles.header}>
        <Text style={[styles.logo, { color: themedStyles.accentColor }]}>
          POW
        </Text>
        <Text style={[styles.headerText, { color: themedStyles.textColor }]}>
          RESET PASSWORD
        </Text>
      </View>

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
          <TouchableOpacity
            style={[
              styles.resetButton,
              { opacity: loading ? 0.7 : 1 },
              { backgroundColor: themedStyles.accentColor }
            ]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color='#000' />
            ) : (
              <Text style={styles.resetButtonText}>RESET PASSWORD</Text>
            )}
          </TouchableOpacity>
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
  logo: {
    fontSize: 36,
    fontFamily: 'Tiny5'
  },
  headerText: {
    fontSize: 16,
    fontFamily: 'Lexend'
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
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Lexend'
  },
  resetButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  resetButtonText: {
    color: '#2A2A2A',
    fontSize: 16,
    fontFamily: 'Lexend'
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
