import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types/report';

interface Props {
  initialRole?: UserRole;
  onBack?: () => void;
  onLoginSuccess: (role: UserRole) => void;
}

export default function AuthScreen({
  initialRole = 'Resident',
  onBack,
  onLoginSuccess,
}: Props) {
  const [selectedRole] = useState<UserRole>(initialRole);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (isSignUp) {
      if (!contactNumber) {
        Alert.alert('Error', 'Please enter your contact number.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              contact_number: contactNumber,
              role: selectedRole,
            },
          },
        });
        if (error) throw error;
        Alert.alert(
          'Success',
          `Account created successfully as ${selectedRole}! You can now log in.`
        );
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // 1. Check role from user metadata
        let userRole = data.user?.user_metadata?.role as UserRole;

        // 2. Fallback check from profiles table if metadata is missing
        if (!userRole && data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profile?.role) {
            userRole = profile.role as UserRole;
          }
        }

        // 3. Strict Check: Compare registered account role with current dashboard role
        if (userRole && userRole.toLowerCase() !== selectedRole.toLowerCase()) {
          await supabase.auth.signOut();
          Alert.alert(
            'Access Denied',
            `This account is registered as a ${userRole}. You cannot log in to the ${selectedRole} dashboard.`
          );
          return;
        }

        onLoginSuccess(userRole || selectedRole);
      }
    } catch (error: any) {
      Alert.alert('Authentication Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#053a5f', '#0369a1', '#0ea5e9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientRoot}
    >
      {/* Decorative water ripples — purely visual, no logic */}
      <View style={styles.rippleLarge} pointerEvents="none" />
      <View style={styles.rippleMedium} pointerEvents="none" />
      <View style={styles.rippleSmall} pointerEvents="none" />
      <View style={styles.rippleBottom} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {onBack && (
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            )}

            <View style={styles.brandBlock}>
              <View style={styles.dropletBadge}>
                <Text style={styles.dropletEmoji}>💧</Text>
              </View>
              <Text style={styles.brandName}>AquaFlow</Text>
              <Text style={styles.brandTagline}>Barangay Banban Fault Line Reporting</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>Signing in as {selectedRole}</Text>
                </View>
              </View>

              <View style={styles.form}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {isSignUp && (
                  <>
                    <Text style={styles.label}>Contact Number</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your contact number"
                        placeholderTextColor="#94a3b8"
                        value={contactNumber}
                        onChangeText={setContactNumber}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </>
                )}

                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeText}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {isSignUp && (
                  <>
                    <Text style={styles.label}>Re-enter Password</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="Re-enter your password"
                        placeholderTextColor="#94a3b8"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Text style={styles.eyeText}>
                          {showConfirmPassword ? 'Hide' : 'Show'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                <TouchableOpacity
                  onPress={handleAuth}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#0284c7', '#0ea5e9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.button}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.buttonText}>
                        {isSignUp ? 'Sign Up' : 'Log In'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setIsSignUp(!isSignUp)}
                >
                  <Text style={styles.switchText}>
                    {isSignUp
                      ? 'Already have an account? Log In'
                      : "Don't have an account? Sign Up"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientRoot: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },

  // Decorative ripple circles
  rippleLarge: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  rippleMedium: {
    position: 'absolute',
    top: -20,
    right: 10,
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  rippleSmall: {
    position: 'absolute',
    top: 60,
    left: -40,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  rippleBottom: {
    position: 'absolute',
    bottom: -100,
    left: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#e0f2fe',
    fontWeight: '600',
  },

  brandBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  dropletBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dropletEmoji: {
    fontSize: 30,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    textAlign: 'center',
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },

  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369a1',
  },

  form: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    marginBottom: 18,
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#0f172a',
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    marginBottom: 18,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#0f172a',
  },
  eyeButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
  },
  eyeText: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '700',
  },

  button: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#0369a1',
    fontSize: 14,
    fontWeight: '600',
  },
});