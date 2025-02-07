import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { config } from '../src/utils/config';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import Header from '../components/Header';
import ParallelogramButton from '../components/ParallelogramButton';
import { Ionicons } from '@expo/vector-icons';

const ResetPasswordView = ({ navigation, route }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  // Get the reset token from navigation params
  const resetToken = route.params?.token;

  useEffect(() => {
    if (!resetToken) {
      // Handle invalid or missing token
      navigation.navigate('SignIn');
    }
  }, [resetToken]);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${config.apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: resetToken,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess('Password successfully reset');

      // Wait a moment to show success message before navigating
      setTimeout(() => {
        navigation.navigate('SignIn');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
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
      <Header pageName='NEW PASSWORD' />
      <View style={styles.content}>
        <Text style={[styles.title, { color: themedStyles.textColor }]}>
          Create new password
        </Text>

        <Text style={[styles.description, { color: themedStyles.textColor }]}>
          Your new password must be at least 8 characters long and different
          from your previous password.
        </Text>

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: themedStyles.secondaryBackgroundColor
            }
          ]}
        >
          <TextInput
            style={[
              styles.passwordInput,
              {
                color: themedStyles.textColor
              }
            ]}
            placeholder='New Password'
            placeholderTextColor={themedStyles.textColor}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={themedStyles.textColor}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: themedStyles.secondaryBackgroundColor
            }
          ]}
        >
          <TextInput
            style={[
              styles.passwordInput,
              {
                color: themedStyles.textColor
              }
            ]}
            placeholder='Confirm New Password'
            placeholderTextColor={themedStyles.textColor}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off' : 'eye'}
              size={20}
              color={themedStyles.textColor}
            />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? (
          <Text
            style={[styles.successText, { color: themedStyles.accentColor }]}
          >
            {success}
          </Text>
        ) : null}
        <View style={styles.buttonContainer}>
          <ParallelogramButton
            style={[{ width: 300, alignItems: 'center' }]}
            label='RESET PASSWORD'
            onPress={handleResetPassword}
            disabled={loading}
          />
        </View>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    marginBottom: 15
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: 'Lexend'
  },
  eyeIcon: {
    padding: 10,
    marginRight: 10
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 15,
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

export default ResetPasswordView;
