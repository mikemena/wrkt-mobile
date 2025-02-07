import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { config } from '../src/utils/config';
import { useAuth, loading } from '../src/context/authContext';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import Header from '../components/Header';
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

  const handleSignUp = async () => {
    console.log('========== SIGNUP PROCESS STARTED ==========');
    console.log('Initial Config State:', {
      apiUrl,
      isLoadingConfig,
      email: email || 'not provided',
      hasPassword: !!password
    });

    if (isLoadingConfig) {
      console.log('❌ Config still loading, aborting signup');
      return;
    }

    // Clear previous errors and set loading
    setGeneralError('');
    setIsSigningUp(true);

    // Validate fields
    const newEmailError = validateEmail(email);
    const newPasswordError = validatePassword(password);
    console.log('Validation Results:', {
      emailError: newEmailError || 'none',
      passwordError: newPasswordError || 'none'
    });

    setEmailError(newEmailError);
    setPasswordError(newPasswordError);

    if (newEmailError || newPasswordError) {
      console.log('❌ Validation failed, aborting signup');
      setIsSigningUp(false);
      return;
    }

    try {
      // Prepare request details
      const signupUrl = `${config.apiUrl}/api/auth/signup`;
      const requestBody = {
        auth_provider: 'email',
        email,
        password
      };

      console.log('📤 Attempting signup request:', {
        url: signupUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        bodyKeys: Object.keys(requestBody)
      });

      // Make signup request
      const signupResponse = await fetch(signupUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }).catch(error => {
        console.error('🔴 Fetch Error:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        throw error;
      });

      console.log('📥 Received Response:', {
        status: signupResponse.status,
        ok: signupResponse.ok,
        statusText: signupResponse.statusText
      });

      // Get raw response first
      const responseText = await signupResponse.text();
      console.log('Raw Response Text:', responseText);

      // Parse response
      let userData;
      try {
        userData = JSON.parse(responseText);
        console.log('✅ Parsed User Data:', {
          hasToken: !!userData.token,
          hasUser: !!userData.user,
          userId: userData.user?.id
        });
      } catch (parseError) {
        console.error('🔴 JSON Parse Error:', {
          error: parseError.message,
          responseText
        });
        throw new Error('Invalid response format from server');
      }

      if (!signupResponse.ok) {
        console.error('🔴 Signup Response Not OK:', userData);
        throw new Error(userData.message || 'Sign up failed');
      }

      // Create user settings
      console.log('📤 Creating user settings...');
      const settingsUrl = `${config.apiUrl}/api/settings/${userData.user.id}`;
      const settingsBody = {
        theme_mode: 'dark',
        accent_color: '#D93B56'
      };

      console.log('Making settings request:', {
        url: settingsUrl,
        method: 'POST',
        body: settingsBody
      });

      const settingsResponse = await fetch(settingsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settingsBody)
      });

      console.log('Settings Response:', {
        status: settingsResponse.status,
        ok: settingsResponse.ok
      });

      if (!settingsResponse.ok) {
        console.warn('⚠️ Failed to create default settings:', {
          status: settingsResponse.status,
          statusText: settingsResponse.statusText
        });
      }

      // Sign in user
      console.log('🔑 Attempting auto sign-in...');
      await signIn(userData.token, userData.user);
      console.log('✅ Signup process completed successfully');
    } catch (err) {
      console.error('🔴 Signup Process Error:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      setGeneralError(err.message || 'Failed to sign up');
    } finally {
      setIsSigningUp(false);
      console.log('========== SIGNUP PROCESS ENDED ==========');
    }
  };

  const handleSocialSignUp = async provider => {
    try {
      let authData;

      if (provider === 'google') {
        // Use Google Sign-In SDK
        authData = await Google.logInAsync({
          // your config
        });
      } else if (provider === 'apple') {
        // Use Apple Sign-In SDK
        authData = await AppleAuthentication.signInAsync({
          // your config
        });
      }

      if (authData) {
        // Send to your backend
        const response = await fetch(`${config.apiUrl}/api/auth/social`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: authData.email,
            auth_provider: provider,
            authProviderId: authData.id,
            name: authData.name
          })
        });

        const data = await response.json();
        // Handle the response similar to email signup
        signIn(data.token, data.user);
      }
    } catch (error) {
      console.error('Social auth error:', error);
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

        <TouchableOpacity
          style={[
            styles.socialButton,
            { backgroundColor: themedStyles.secondaryBackgroundColor }
          ]}
          onPress={handleSocialSignUp}
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
            Sign up with Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.socialButton,
            { backgroundColor: themedStyles.secondaryBackgroundColor }
          ]}
          onPress={handleSocialSignUp}
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
            Sign up with Apple
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
            label='CONTINUE'
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
  }
});

export default SignUpView;
