import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { PressScale } from '../../components/PressScale';
import { colors, radius, shadow, spacing, typography, ui } from '../../components/DesignSystem';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPasswordScreen({ navigation }: any) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);

  React.useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    slideAnim.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (error: any) {
      Alert.alert('Reset Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.container, animatedStyle]}>
          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {sent 
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive password reset instructions'
            }
          </Text>

          {!sent && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textDim}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>
          )}

          {!sent ? (
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Back to Login</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: ui.screen,
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    fontSize: 18,
    color: colors.textDim,
    fontWeight: '600',
  },
  title: {
    ...typography.hero,
    fontSize: 36,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    fontSize: 15,
    color: colors.textDim,
    marginBottom: 40,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...typography.tiny,
    fontSize: 12,
    color: colors.textDim,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: colors.purpleDeep,
    borderRadius: radius.xxl,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    ...shadow.glowPurple,
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
