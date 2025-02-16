import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { api } from '../src/services/api';
import { useAuth } from '../src/context/authContext';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import handleAppleAuth from '../src/utils/appleAuth';
import Header from '../components/Header';
import ParallelogramButton from '../components/ParallelogramButton';
import { Ionicons } from '@expo/vector-icons';

const SignInView = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signIn } = useAuth();
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

  const handleSignIn = async () => {
    // Clear any previous general error
    setGeneralError('');
    if (!password) {
      setGeneralError('Enter a password');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting signin...');

      const data = await api.post('/api/auth/signin', {
        email,
        password
      });

      await signIn(data.token, data.user);
    } catch (err) {
      console.error('Sign in error:', err);
      setGeneralError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = handleAppleAuth({
    api,
    signIn,
    setGeneralError
  });

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <Header pageName='SIGN IN' />
      <View style={styles.content}>
        <Text style={[styles.title, { color: themedStyles.textColor }]}>
          Sign in to your account
        </Text>

        <TouchableOpacity
          style={[
            styles.socialButton,
            { backgroundColor: themedStyles.secondaryBackgroundColor }
          ]}
          onPress={handleAppleSignIn}
        >
          <Ionicons
            name='logo-apple'
            size={20}
            color={themedStyles.accentColor}
          />
          <Text
            style={[
              styles.socialButtonText,
              { color: themedStyles.accentColor }
            ]}
          >
            Sign in with Apple
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View
            style={[
              styles.divider,
              { backgroundColor: themedStyles.textColor }
            ]}
          />
          <Text style={[styles.dividerText, { color: themedStyles.textColor }]}>
            Or continue with
          </Text>
          <View
            style={[
              styles.divider,
              { backgroundColor: themedStyles.textColor }
            ]}
          />
        </View>

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
            onChangeText={setPassword}
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
        {generalError ? (
          <Text style={styles.errorText}>{generalError}</Text>
        ) : null}
        <View style={styles.buttonContainer}>
          <ParallelogramButton
            style={[{ width: 300, alignItems: 'center' }]}
            label='SIGN IN'
            onPress={handleSignIn}
            disabled={loading}
          />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text
            style={[styles.forgotPassword, { color: themedStyles.textColor }]}
          >
            Forgot password?
          </Text>
        </TouchableOpacity>
        <View style={styles.signUpContainer}>
          <Text style={[styles.signUpText, { color: themedStyles.textColor }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text
              style={[styles.signUpLink, { color: themedStyles.accentColor }]}
            >
              Sign up
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.buttonContainer}></View>
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
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  signUpText: {
    fontSize: 14,
    fontFamily: 'Lexend'
  },
  signUpLink: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '600'
  }
});

export default SignInView;
