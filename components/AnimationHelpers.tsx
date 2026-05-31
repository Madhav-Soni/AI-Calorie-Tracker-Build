import React, { useEffect, useRef } from "react";
import { Animated, TouchableWithoutFeedback, Easing } from "react-native";

// ─── FADE IN & SLIDE UP TRANSITION ───────────────────────────────────────────
interface FadeInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: any;
}

export function FadeIn({ children, duration = 500, delay = 0, style }: FadeInProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, duration]);

  return (
    <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ─── SCALE ON PRESS INTERACTION ─────────────────────────────────────────────
interface ScalePressProps {
  children: React.ReactNode;
  onPress?: () => void;
  scaleTo?: number;
  style?: any;
}

export function ScalePress({ children, onPress, scaleTo = 0.95, style }: ScalePressProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: scaleTo,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

// ─── INFINITE PULSE GLOW ─────────────────────────────────────────────────────
interface PulseProps {
  children: React.ReactNode;
  scaleTo?: number;
  duration?: number;
  style?: any;
}

export function Pulse({ children, scaleTo = 1.06, duration = 1000, style }: PulseProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: scaleTo,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleTo, duration]);

  return (
    <Animated.View style={[{ transform: [{ scale: pulseAnim }] }, style]}>
      {children}
    </Animated.View>
  );
}
