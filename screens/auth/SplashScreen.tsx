import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  withRepeat, 
  withSequence 
} from 'react-native-reanimated';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfileStore } from '../../store/userProfileStore';
import { colors, typography } from '../../components/DesignSystem';

export default function SplashScreen({ navigation }: any) {
  const { user, loading } = useAuth();
  const profile = useUserProfileStore((s) => s.profile);
  
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
    scale.value = withDelay(200, withTiming(1, { duration: 800 }));
  }, []);

  useEffect(() => {
    if (!loading) {
      const checkNavigation = async () => {
        if (user) {
          // Fetch profile to check onboarding status
          const unsubscribe = useUserProfileStore.getState().subscribeToProfile(user.uid);
          
          // Give profile time to load
          setTimeout(() => {
            unsubscribe();
            
            const onboardingComplete = profile?.onboardingCompleted || false;
            if (onboardingComplete) {
              navigation.replace('Tabs');
            } else {
              navigation.replace('OnboardingStep1');
            }
          }, 500);
        } else {
          navigation.replace('Welcome');
        }
      };
      
      const timer = setTimeout(checkNavigation, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, loading, profile]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.container, animatedStyle]}>
        <Text style={styles.logo}>⚡</Text>
        <Text style={styles.title}>AI Calorie Tracker</Text>
        <Text style={styles.subtitle}>Personalized Nutrition</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#080813',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    ...typography.hero,
    fontSize: 32,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.sectionLabel,
    color: colors.textDim,
  },
});
