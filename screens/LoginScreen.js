import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import COLORS from '../utils/colors';
import API_BASE_URL from '../config/api';
import Logo from '../components/Logo';
import { StatusBar } from 'expo-status-bar';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();

  // Create refs for form inputs
  const passwordInputRef = useRef(null);
  const emailInputRef = useRef(null);

  // Handle input submission and focus next field
  const focusNextInput = (nextInput) => {
    if (nextInput && nextInput.current) {
      try {
        if (typeof nextInput.current.focus === 'function') {
          nextInput.current.focus();
        }
      } catch (error) {
        console.log('Error focusing input:', error);
      }
    }
  };

  const handleResetPassword = () => {
    // Navigate to password reset or show alert
    Alert.alert(
      'Reset Password',
      'Password reset functionality will be implemented soon. Please contact support for assistance.',
      [{ text: 'OK' }]
    );
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password required.');
      return;
    }

    console.log('=== STARTING LOGIN PROCESS ===');
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('=== LOGIN RESPONSE ===', JSON.stringify(data.admin, null, 2));

      if (response.ok) {
        // Check if user is a sub-admin (mortgage broker)
        if (data.admin && data.admin.role === 'sub-admin') {
          // Fetch full broker profile to get all fields including profilePicture
          try {
            const brokerId = data.admin.id || data.admin._id;
            const profileUrl = `${API_BASE_URL}/admin/mortgage-broker/${brokerId}/profile`;
            console.log('Fetching broker profile from:', profileUrl);
            console.log('Using token:', data.accessToken);
            
            const profileResponse = await fetch(profileUrl, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.accessToken}`,
              },
            });

            console.log('Profile fetch response status:', profileResponse.status);
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              console.log('=== FULL BROKER PROFILE ===', JSON.stringify(profileData.broker, null, 2));
              
              // Use full profile data with normalized _id
              const fullBrokerData = {
                ...profileData.broker,
                _id: profileData.broker._id || profileData.broker.id,
              };
              await login(fullBrokerData, data.accessToken);
            } else {
              const errorText = await profileResponse.text();
              console.error('Profile fetch failed:', profileResponse.status, errorText);
              // Fallback to admin data from login if profile fetch fails
              const adminData = {
                ...data.admin,
                _id: data.admin.id || data.admin._id,
              };
              await login(adminData, data.accessToken);
            }
          } catch (profileError) {
            console.error('Error fetching broker profile:', profileError);
            console.error('Profile error details:', profileError.message);
            // Fallback to admin data from login
            const adminData = {
              ...data.admin,
              _id: data.admin.id || data.admin._id,
            };
            await login(adminData, data.accessToken);
          }
          // Navigation will be handled automatically by App.js
        } else {
          setError('This account is not a mortgage broker account');
        }
      } else {
        setError('Check the account information you entered and try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 0.8 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          style={styles.scrollView}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          accessible={true}
        >
          {/* Brand Logo */}
          <Logo
            width={120}
            height={42}
            variant="black"
            style={styles.brandLogo}
          />

          {/* Error Message */}
          {error && (
            <Text
              style={styles.errorText}
              accessible={true}
              accessibilityLabel={`Error: ${error}`}
            >
              {error}
            </Text>
          )}

          {/* Email Input */}
          <TextInput
            ref={emailInputRef}
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.gray}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (error) setError(null);
            }}
            textContentType="username"
            autoComplete="username"
            autoCorrect={false}
            accessible={true}
            accessibilityLabel="Email input"
            returnKeyType="next"
            onSubmitEditing={() => focusNextInput(passwordInputRef)}
            blurOnSubmit={false}
            editable={!isLoading}
          />

          {/* Password Input */}
          <TextInput
            ref={passwordInputRef}
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.gray}
            secureTextEntry
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) setError(null);
            }}
            textContentType="password"
            autoComplete="password"
            autoCorrect={false}
            accessible={true}
            accessibilityLabel="Password input"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            editable={!isLoading}
          />

          {/* Reset Password */}
          <TouchableOpacity
            onPress={handleResetPassword}
            accessible={true}
            accessibilityLabel="Reset password"
            accessibilityRole="button"
            style={styles.resetPasswordButton}
          >
            <Text style={styles.resetPasswordText}>RESET PASSWORD</Text>
          </TouchableOpacity>

          {/* Log In Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            accessible={true}
            accessibilityLabel="Log in"
            accessibilityRole="button"
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer (dark background) */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
          By logging in, you agree to Roost's{' '}
          <Text
            style={styles.linkText}
            onPress={() => {
              Linking.openURL('https://roostapp.io/terms-of-service');
            }}
            accessibilityRole="link"
          >
            Terms of Use
          </Text>{' '}
          and{' '}
          <Text
            style={styles.linkText}
            onPress={() => {
              Linking.openURL('https://roostapp.io/privacy');
            }}
            accessibilityRole="link"
          >
            Privacy&nbsp;Policy
          </Text>
          .
        </Text>
        <Text style={styles.footerText}>
          By providing your email & phone number, you consent to receive
          communications from Roost. You can opt-out anytime.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
    alignItems: 'center',
    minHeight: '100%',
    backgroundColor: COLORS.background,
  },
  brandLogo: {
    marginBottom: 64,
    alignSelf: 'center',
    marginTop: 64,
    backgroundColor: COLORS.background,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    backgroundColor: COLORS.white,
    fontFamily: 'Futura',
  },
  resetPasswordButton: {
    alignSelf: 'flex-end',
  },
  resetPasswordText: {
    alignSelf: 'flex-end',
    color: COLORS.slate,
    marginBottom: 24,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Futura',
  },
  loginButton: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.green,
    borderRadius: 50,
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Futura',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: COLORS.red,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Futura',
  },
  footerContainer: {
    height: 120,
    position: 'absolute',
    alignItems: 'center',
    width: '100%',
    bottom: 0,
    backgroundColor: COLORS.black,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray,
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 15,
    fontFamily: 'Futura',
  },
  linkText: {
    color: COLORS.gray,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
