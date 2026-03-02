import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import COLORS from '../utils/colors';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    console.log('=== STARTING LOGIN PROCESS ===');
    setIsLoading(true);
    try {
      const response = await fetch('https://signup.roostapp.io/admin/login', {
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
            const profileUrl = `https://signup.roostapp.io/admin/mortgage-broker/${brokerId}/profile`;
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
          Alert.alert('Login Failed', 'This account is not a mortgage broker account');
        }
      } else {
        Alert.alert('Login Failed', data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo Area */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>ROOST</Text>
          <Text style={styles.subtitle}>Mortgage Broker</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.description}>Sign in to continue</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.gray}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.gray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
    fontFamily: 'futura',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    marginTop: 5,
    fontFamily: 'futura',
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 5,
    fontFamily: 'futura',
  },
  description: {
    fontSize: 14,
    color: COLORS.slate,
    marginBottom: 25,
    fontFamily: 'futura',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: COLORS.black,
    fontFamily: 'futura',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'futura',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: 'futura',
  },
});

export default LoginScreen;
