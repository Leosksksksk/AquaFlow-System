import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types/report';

interface Props {
  initialRole?: UserRole;
  onBack?: () => void;
  onLoginSuccess: (role: UserRole, fullName: string) => void;
}

export default function AuthScreen({
  initialRole = 'Resident',
  onBack,
  onLoginSuccess,
}: Props) {
  const [selectedRole] = useState<UserRole>(initialRole);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Forgot Password state ---
  const [forgotVisible, setForgotVisible] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer for Resend Code button
  useEffect(() => {
   let timer: ReturnType<typeof setInterval>;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (isSignUp) {
      if (!fullName.trim()) {
        Alert.alert('Error', 'Please enter your full name.');
        return;
      }
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
              full_name: fullName,
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
        let fullName: string = data.user?.user_metadata?.full_name ?? '';
        if ((!userRole || !fullName) && data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', data.user.id)
            .single();

          if (profile?.role) {
            userRole = profile.role as UserRole;
          }
          if (profile?.full_name) {
            fullName = profile.full_name;
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

        onLoginSuccess(userRole || selectedRole, fullName);
      }
    } catch (error: any) {
      Alert.alert('Authentication Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot Password handlers ---

  const openForgotPassword = () => {
    setResetStep('email');
    setResetEmail(email); // pre-fill with whatever they typed in the login email field
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotVisible(true);
  };

  const sendResetCode = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());
    setResetLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    Alert.alert('Check your email', 'We sent a reset code to your email address.');
    setResetStep('code');
    setResendCooldown(60); // start cooldown after initial code sent
  };

  const handleResendCode = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Error', 'Email address is missing.');
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());
    setResetLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Code Sent', 'A new password reset code has been sent to your email.');
      setResendCooldown(60); // start 60s timer to prevent rate limits
    }
  };

  const confirmPasswordReset = async () => {
    if (!resetCode.trim()) {
      Alert.alert('Error', 'Please enter the code from your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setResetLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: resetEmail.trim(),
        token: resetCode.trim(),
        type: 'recovery',
      });
      if (verifyError) throw verifyError;

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      // Sign out so they log in fresh with the new password
      await supabase.auth.signOut();

      Alert.alert('Success', 'Your password has been reset. Please log in.');
      setForgotVisible(false);
      setPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setResetLoading(false);
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
                {isSignUp && (
                  <>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        placeholderTextColor="#94a3b8"
                        value={fullName}
                        onChangeText={setFullName}
                      />
                    </View>
                  </>
                )}

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

                {!isSignUp && (
                  <TouchableOpacity onPress={openForgotPassword} style={styles.forgotLink}>
                    <Text style={styles.forgotLinkText}>Forgot Password?</Text>
                  </TouchableOpacity>
                )}

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

      {/* Forgot Password Modal */}
      <Modal visible={forgotVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Reset Password</Text>

              {resetStep === 'email' ? (
                <>
                  <Text style={styles.modalSubtitle}>
                    Enter your email address and we'll send you a reset code.
                  </Text>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#94a3b8"
                      value={resetEmail}
                      onChangeText={setResetEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <TouchableOpacity onPress={sendResetCode} disabled={resetLoading}>
                    <LinearGradient
                      colors={['#0284c7', '#0ea5e9']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.button}
                    >
                      {resetLoading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.buttonText}>Send Reset Code</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.modalSubtitle}>
                    Enter the code we sent to {resetEmail}, plus your new password.
                  </Text>

                  <Text style={styles.label}>Reset Code</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter code from email"
                      placeholderTextColor="#94a3b8"
                      value={resetCode}
                      onChangeText={setResetCode}
                      autoCapitalize="characters"
                    />
                  </View>

                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new password"
                      placeholderTextColor="#94a3b8"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                    />
                  </View>

                  <Text style={styles.label}>Confirm New Password</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter new password"
                      placeholderTextColor="#94a3b8"
                      value={confirmNewPassword}
                      onChangeText={setConfirmNewPassword}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity onPress={confirmPasswordReset} disabled={resetLoading}>
                    <LinearGradient
                      colors={['#0284c7', '#0ea5e9']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.button}
                    >
                      {resetLoading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.buttonText}>Reset Password</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={resetLoading || resendCooldown > 0}
                    style={styles.forgotLink}
                  >
                    <Text
                      style={[
                        styles.forgotLinkText,
                        resendCooldown > 0 && { color: '#94a3b8' },
                      ]}
                    >
                      {resendCooldown > 0
                        ? `Resend code (${resendCooldown}s)`
                        : 'Resend code'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setForgotVisible(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginBottom: 8,
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

  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  forgotLinkText: {
    color: '#0369a1',
    fontSize: 13,
    fontWeight: '600',
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

  // Forgot password modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0369a1', marginBottom: 8 },
  modalSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 18, lineHeight: 18 },
  modalCloseBtn: { marginTop: 16, alignItems: 'center', padding: 12 },
  modalCloseText: { color: '#dc2626', fontWeight: '600', fontSize: 14 },
});