import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { Lock, Phone, User, Landmark, Eye, EyeOff } from 'lucide-react-native';
import { AuthService, AUTH_TOKEN_KEY } from '../../services/api';

const screenWidth = Dimensions.get('window').width;

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

export const IS_LOGGED_IN_KEY = '@rjv_metal_is_logged_in';

const AuthScreen = ({ onLoginSuccess }: AuthScreenProps) => {
  const { language, t, setLanguage } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form inputs
  const [businessName, setBusinessName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{ businessName?: string; mobileNumber?: string; password?: string }>({});

  // Animated values for smooth tab transition
  const fadeAnim = useState(new Animated.Value(1))[0];
  const slideAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Clear forms and errors when switching tab
    setBusinessName('');
    setMobileNumber('');
    setPassword('');
    setErrors({});
    setShowPassword(false);
  }, [isLogin]);

  const switchTab = (toLogin: boolean) => {
    if (toLogin === isLogin) return;
    
    // Animate out, toggle, animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: toLogin ? 50 : -50,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsLogin(toLogin);
      slideAnim.setValue(toLogin ? -50 : 50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  // Keystroke handlers that proactively clear specific field errors
  const handleBusinessNameChange = (val: string) => {
    setBusinessName(val);
    if (errors.businessName) {
      setErrors(prev => ({ ...prev, businessName: undefined }));
    }
  };

  const handleMobileNumberChange = (val: string) => {
    // Enforce digit-only input at character level
    const cleanVal = val.replace(/[^0-9]/g, '');
    setMobileNumber(cleanVal);
    if (errors.mobileNumber) {
      setErrors(prev => ({ ...prev, mobileNumber: undefined }));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  // Validation rules for Register
  const validateRegister = (): boolean => {
    const tempErrors: typeof errors = {};
    
    // Business Name validation
    if (!businessName.trim()) {
      tempErrors.businessName = t.authErrBusinessRequired;
    } else if (businessName.trim().length < 3) {
      tempErrors.businessName = t.authErrBusinessLength;
    }
    
    // Mobile Number validation
    if (!mobileNumber.trim()) {
      tempErrors.mobileNumber = t.authErrMobileRequired;
    } else if (mobileNumber.trim().length !== 10) {
      tempErrors.mobileNumber = t.authErrMobileLength;
    } else if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      tempErrors.mobileNumber = t.authErrMobileInvalid;
    }
    
    // Password validation
    if (!password.trim()) {
      tempErrors.password = t.authErrPasswordRequired;
    } else if (password.length < 6) {
      tempErrors.password = t.authErrPasswordLength;
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Validation rules for Login
  const validateLogin = (): boolean => {
    const tempErrors: typeof errors = {};
    
    // Mobile Number validation
    if (!mobileNumber.trim()) {
      tempErrors.mobileNumber = t.authErrMobileRequired;
    } else if (mobileNumber.trim().length !== 10) {
      tempErrors.mobileNumber = t.authErrMobileLength;
    }
    
    // Password validation
    if (!password.trim()) {
      tempErrors.password = t.authErrPasswordRequired;
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateRegister()) {
      Toast.show({
        type: 'error',
        text1: t.validationError,
        text2: t.authRequiredFields,
      });
      return;
    }

    try {
      setLoading(true);
      
      // Request registration from remote API
      await AuthService.register({
        businessName: businessName.trim(),
        mobileNumber: mobileNumber.trim(),
        password: password.trim()
      });
      
      Toast.show({
        type: 'success',
        text1: t.success,
        text2: t.authSuccessRegister,
      });

      // Switch to login view with pre-populated phone number
      const registeredPhone = mobileNumber.trim();
      setTimeout(() => {
        setIsLogin(true);
        setMobileNumber(registeredPhone);
        setPassword('');
        setErrors({});
        setLoading(false);
      }, 1000);

    } catch (error: any) {
      console.error('Registration API error:', error);
      const errMsg = error?.response?.data?.message || t.couldNotLoad;
      Toast.show({
        type: 'error',
        text1: t.saveFailed,
        text2: errMsg,
      });
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validateLogin()) {
      Toast.show({
        type: 'error',
        text1: t.validationError,
        text2: t.authRequiredFields,
      });
      return;
    }

    try {
      setLoading(true);
      
      // Perform remote API check
      const response = await AuthService.login({
        mobileNumber: mobileNumber.trim(),
        password: password.trim(),
      });
      
      const { token, role } = response.data;
      
      // Persist auth token, logged in flag, and user role
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(IS_LOGGED_IN_KEY, 'true');
      await AsyncStorage.setItem('@rjv_metal_user_role', role || 'customer');
      
      Toast.show({
        type: 'success',
        text1: t.success,
        text2: t.authSuccessLogin,
      });

      setTimeout(() => {
        onLoginSuccess();
        setLoading(false);
      }, 800);

    } catch (error: any) {
      console.error('Login API error:', error);
      const errMsg = error?.response?.data?.message || t.authInvalidCredentials;
      Toast.show({
        type: 'error',
        text1: t.validationError,
        text2: errMsg,
      });
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Language Toggle */}
          <View style={styles.header}>
            <View style={styles.langToggle}>
              <TouchableOpacity
                style={[styles.langOption, language === 'en' && styles.langOptionActive]}
                onPress={() => setLanguage('en')}
                activeOpacity={0.8}
              >
                <Text style={[styles.langOptionText, language === 'en' && styles.langOptionTextActive]}>
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langOption, language === 'gu' && styles.langOptionActive]}
                onPress={() => setLanguage('gu')}
                activeOpacity={0.8}
              >
                <Text style={[styles.langOptionText, language === 'gu' && styles.langOptionTextActive]}>
                  ગુ
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logo & Headline */}
          <View style={styles.logoSection}>
            <View style={styles.logoBadge}>
              <Landmark size={36} color={theme.colors.accent} />
            </View>
            <Text style={styles.appName}>RJV Metal</Text>
            <Text style={styles.appSub}>{language === 'gu' ? 'ઇન્વેન્ટરી અને વેપાર મેનેજર' : 'Inventory & Trade Manager'}</Text>
          </View>

          {/* Tab Selection */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, isLogin && styles.activeTab]}
              onPress={() => switchTab(true)}
              activeOpacity={0.9}
            >
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                {t.authLoginBtn}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, !isLogin && styles.activeTab]}
              onPress={() => switchTab(false)}
              activeOpacity={0.9}
            >
              <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
                {t.authRegisterBtn}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Animating Form Block */}
          <Animated.View 
            style={[
              styles.formCard, 
              { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }
            ]}
          >
            <Text style={styles.formTitle}>
              {isLogin ? t.authWelcomeBack : t.authRegisterTitle}
            </Text>

            {/* Inputs */}
            {!isLogin && (
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>{t.authBusinessName}</Text>
                <View style={[styles.inputContainer, errors.businessName && styles.inputErrorContainer]}>
                  <User size={20} color={errors.businessName ? theme.colors.error : theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.textInput}
                    placeholder={language === 'gu' ? 'દા.ત. આઇટી મેટલ્સ' : 'e.g. IT Metals'}
                    placeholderTextColor={theme.colors.textSecondary}
                    value={businessName}
                    onChangeText={handleBusinessNameChange}
                    autoCapitalize="words"
                  />
                </View>
                {errors.businessName && (
                  <Text style={styles.errorText}>{errors.businessName}</Text>
                )}
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{t.authMobileNumber}</Text>
              <View style={[styles.inputContainer, errors.mobileNumber && styles.inputErrorContainer]}>
                <Phone size={20} color={errors.mobileNumber ? theme.colors.error : theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="10-digit number"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  value={mobileNumber}
                  onChangeText={handleMobileNumberChange}
                  maxLength={10}
                />
              </View>
              {errors.mobileNumber && (
                <Text style={styles.errorText}>{errors.mobileNumber}</Text>
              )}
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{t.authPassword}</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputErrorContainer]}>
                <Lock size={20} color={errors.password ? theme.colors.error : theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={handlePasswordChange}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={theme.colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, loading && { opacity: 0.8 }]}
              onPress={isLogin ? handleLogin : handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitText}>
                  {isLogin ? t.authLoginBtn : t.authRegisterBtn}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Footer Helper */}
            <TouchableOpacity 
              style={styles.footerToggle}
              onPress={() => switchTab(!isLogin)}
            >
              <Text style={styles.footerToggleText}>
                {isLogin ? t.authNoAccount : t.authAlreadyAccount}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 3,
    gap: 2,
  },
  langOption: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  langOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  langOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  langOptionTextActive: {
    color: '#FFF',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: theme.spacing.md,
  },
  appName: {
    ...theme.typography.h1,
    fontSize: 28,
    color: theme.colors.primary,
  },
  appSub: {
    ...theme.typography.caption,
    fontSize: 13,
    letterSpacing: 1,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 6,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: '#FFF',
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  formTitle: {
    ...theme.typography.h2,
    fontSize: 20,
    color: theme.colors.primary,
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 20,
    gap: 2,
  },
  inputLabel: {
    ...theme.typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 54,
    marginTop: 6,
  },
  inputErrorContainer: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.error + '05',
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    height: '100%',
    ...theme.typography.body,
    color: theme.colors.text,
  },
  eyeButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 11,
    color: theme.colors.error,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerToggle: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  footerToggleText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
});

export default AuthScreen;
