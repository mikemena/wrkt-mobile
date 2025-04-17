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
import { useAuth, loading } from '../src/context/authContext';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import handleAppleAuth from '../src/utils/appleAuth';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ParallelogramButton from '../components/ParallelogramButton';
import { Ionicons } from '@expo/vector-icons';

const SignUpView = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const { signIn, onResend } = useAuth();
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

  // Password validation pattern
  const validatePassword = password => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return '';
  };

  const handleEmailChange = text => {
    setEmail(text);
    setEmailError(validateEmail(text));
  };

  const handlePasswordChange = text => {
    setPassword(text);
    setPasswordError(validatePassword(text));
  };

  const handleVerifyEmail = async token => {
    try {
      const response = await api.post('/api/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to verify email'
      );
    }
  };

  const handleResendVerification = async email => {
    if (isResending) return; // Prevent multiple clicks

    try {
      setIsResending(true);
      await api.post('/api/auth/resend-verification', { email });
      setResendSuccess(true);

      // Reset success message after 5 seconds

      setTimeout(() => {
        setResendSuccess(false);
        setIsResending(false);
      }, 5000);
    } catch (error) {
      setGeneralError(
        error.response?.data?.message || 'Failed to resend verification'
      );
      setIsResending(false);
    }
  };
  const handleSignUp = async () => {
    // Clear previous errors and set loading
    setGeneralError('');
    setIsSigningUp(true);

    // Validate fields
    const newEmailError = validateEmail(email);
    const newPasswordError = validatePassword(password);

    setEmailError(newEmailError);
    setPasswordError(newPasswordError);

    if (newEmailError || newPasswordError) {
      setIsSigningUp(false);
      return;
    }

    try {
      // Make signup request
      const userData = await api.post('/api/auth/signup', {
        auth_provider: 'email',
        email,
        password
      });

      // Sign in with limited access
      await signIn(userData.token, userData.user);

      // Show verification sent message
      setVerificationSent(true);

      // Create user settings

      try {
        await api.post(`/api/settings/${userData.user.id}`, {
          theme_mode: 'dark',
          accent_color: '#D93B56'
        });
      } catch (settingsError) {
        console.warn('Failed to create default settings:', settingsError);
        // Continue with sign-in even if settings creation fails
      }

      // Sign in user
      await signIn(userData.token, userData.user);
    } catch (err) {
      setGeneralError(err.message || 'Failed to sign up');
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <Header pageName='SIGN UP' />
      <View style={styles.content}>
        <Text style={[styles.title, { color: themedStyles.textColor }]}>
          Sign up
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: themedStyles.secondaryBackgroundColor,
              color: themedStyles.textColor,
              borderColor: emailError ? '#ff4444' : 'transparent',
              borderWidth: 1
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
            placeholder='Password'
            placeholderTextColor={themedStyles.textColor}
            value={password}
            onChangeText={handlePasswordChange}
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

        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}

        {generalError ? (
          <Text style={styles.errorText}>{generalError}</Text>
        ) : null}
        <View style={styles.buttonContainer}>
          <ParallelogramButton
            style={[{ width: 300, alignItems: 'center' }]}
            label='SIGN UP'
            onPress={handleSignUp}
            disabled={loading}
          />
        </View>

        <TouchableOpacity
          style={styles.switchAuthButton}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text
            style={[styles.switchAuthText, { color: themedStyles.textColor }]}
          >
            Already have an account?{' '}
            <Text style={{ color: themedStyles.accentColor }}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>
      {verificationSent && (
        <View
          style={[
            styles.verificationContainer,
            {
              backgroundColor: themedStyles.secondaryBackgroundColor
            }
          ]}
        >
          <Text
            style={[styles.verificationText, { color: themedStyles.textColor }]}
          >
            Please check your email to verify your account. You have limited
            access until verification is complete.
          </Text>
          {resendSuccess ? (
            <Text
              style={[styles.successText, { color: themedStyles.accentColor }]}
            >
              Verification email sent successfully!
            </Text>
          ) : (
            <TouchableOpacity
              style={[
                styles.resendButton,
                isResending && styles.resendButtonDisabled
              ]}
              onPress={() => handleResendVerification(email)}
              disabled={isResending}
            >
              <Text
                style={[
                  styles.resendButtonText,
                  isResending && styles.resendButtonTextDisabled
                ]}
              >
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <Footer />
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
    marginTop: 20,
    padding: 20
  },
  title: {
    fontSize: 24,
    fontFamily: 'Lexend',
    marginBottom: 30
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15
  },
  socialButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'Lexend'
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20
  },
  divider: {
    flex: 1,
    height: 1,
    opacity: 0.2
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    fontFamily: 'Lexend',
    opacity: 0.6
  },
  input: {
    height: 50,
    borderRadius: 5,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Lexend'
  },
  forgotPassword: {
    textAlign: 'center',
    marginVertical: 15,
    fontSize: 14,
    fontFamily: 'Lexend'
  },
  errorText: {
    color: '#D93B56',
    fontSize: 14,
    marginLeft: 20,
    marginTop: -10,
    marginBottom: 10,
    fontFamily: 'Lexend'
  },
  switchAuthButton: {
    marginTop: 20
  },
  switchAuthText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Lexend'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 5,
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
  verificationContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 100
  },
  verificationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10
  },
  resendButton: {
    padding: 10
  },
  resendButtonText: {
    color: '#D93B56',
    textAlign: 'center',
    fontSize: 14
  }
});

export default SignUpView;
