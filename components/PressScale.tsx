import React from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

interface PressScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function PressScale({ children, onPress, style, disabled }: PressScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      onPressIn={() => {
        if (disabled) return;
        scale.value = withSpring(0.96, { damping: 10, stiffness: 200 });
      }}
      onPressOut={() => {
        if (disabled) return;
        scale.value = withSpring(1, { damping: 10, stiffness: 200 });
      }}
      style={{ activeOpacity: 1 } as any}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
