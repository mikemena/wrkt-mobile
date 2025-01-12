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
import { useAuth } from '../src/context/authContext';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { Ionicons } from '@expo/vector-icons';

const SignInView = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { apiUrl, isLoadingConfig } = useConfig();

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
      const response = await fetch(`${apiUrl}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const textResponse = await response.text();

      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        setGeneralError('Server error - invalid response format');
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Sign in failed');
      }

      await signIn(data.token, data.user);
    } catch (err) {
      console.error('Sign in error:', err);
      setGeneralError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Implement Google Sign In
    console.log('Google Sign In');
  };

  const handleAppleSignIn = () => {
    // Implement Apple Sign In
    console.log('Apple Sign In');
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
          SIGN IN
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: themedStyles.textColor }]}>
          Sign in to your account
        </Text>

        <TouchableOpacity
          style={[
            styles.socialButton,
            { backgroundColor: themedStyles.secondaryBackgroundColor }
          ]}
          onPress={handleGoogleSignIn}
        >
          <Ionicons
            name='logo-google'
            size={20}
            color={themedStyles.accentColor}
          />
          <Text
            style={[
              styles.socialButtonText,
              { color: themedStyles.accentColor }
            ]}
          >
            Sign in with Google
          </Text>
        </TouchableOpacity>

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

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text
            style={[styles.forgotPassword, { color: themedStyles.textColor }]}
          >
            Forgot password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.signInButton,
            { opacity: loading ? 0.7 : 1 },
            { backgroundColor: themedStyles.accentColor }
          ]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color='#000' />
          ) : (
            <Text style={styles.signInButtonText}>CONTINUE</Text>
          )}
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
    marginBottom: 30
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 25,
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
    borderRadius: 25,
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
  signInButton: {
    backgroundColor: '#A5FF32',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  signInButtonText: {
    color: '#2A2A2A',
    fontSize: 16,
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
    borderRadius: 25,
    marginBottom: 15
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
  }
});

export default SignInView;
