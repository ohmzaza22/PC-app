import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, withSpring, withRepeat, withSequence, Easing } from 'react-native-reanimated';

/**
 * Custom animation hooks for consistent animations across the app
 * All animations use React Native Reanimated for optimal performance
 */

// Animation timing configurations
export const ANIMATION_CONFIG = {
  // Duration presets
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },
  // Easing presets for natural movement
  easing: {
    smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
    bounce: Easing.bezier(0.68, -0.55, 0.265, 1.55),
    linear: Easing.linear,
    easeIn: Easing.in(Easing.ease),
    easeOut: Easing.out(Easing.ease),
    easeInOut: Easing.inOut(Easing.ease),
  },
  // Spring presets
  spring: {
    gentle: { damping: 20, stiffness: 90 },
    bouncy: { damping: 10, stiffness: 100 },
    snappy: { damping: 30, stiffness: 200 },
  },
};

/**
 * Hook for fade-in animation
 * @param {boolean} trigger - When true, animation starts
 * @param {number} duration - Animation duration in ms
 * @param {number} delay - Delay before animation starts
 * @returns {object} Animated style object
 */
export function useFadeIn(trigger = true, duration = ANIMATION_CONFIG.duration.normal, delay = 0) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      opacity.value = withTiming(1, {
        duration,
        delay,
        easing: ANIMATION_CONFIG.easing.smooth,
      });
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return animatedStyle;
}

/**
 * Hook for slide-in animation (from any direction)
 * @param {boolean} trigger - When true, animation starts
 * @param {string} direction - 'left', 'right', 'up', 'down'
 * @param {number} distance - Distance to slide (default 50)
 * @param {number} duration - Animation duration
 * @param {number} delay - Delay before animation
 * @returns {object} Animated style object
 */
export function useSlideIn(
  trigger = true,
  direction = 'right',
  distance = 50,
  duration = ANIMATION_CONFIG.duration.normal,
  delay = 0
) {
  const translateX = useSharedValue(direction === 'right' ? distance : direction === 'left' ? -distance : 0);
  const translateY = useSharedValue(direction === 'down' ? distance : direction === 'up' ? -distance : 0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      translateX.value = withSpring(0, { ...ANIMATION_CONFIG.spring.gentle, delay });
      translateY.value = withSpring(0, { ...ANIMATION_CONFIG.spring.gentle, delay });
      opacity.value = withTiming(1, { duration, delay, easing: ANIMATION_CONFIG.easing.smooth });
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
}

/**
 * Hook for scale animation
 * @param {boolean} trigger - When true, animation starts
 * @param {number} from - Starting scale (default 0.8)
 * @param {number} to - Ending scale (default 1)
 * @param {number} duration - Animation duration
 * @param {number} delay - Delay before animation
 * @returns {object} Animated style object
 */
export function useScaleIn(
  trigger = true,
  from = 0.8,
  to = 1,
  duration = ANIMATION_CONFIG.duration.normal,
  delay = 0
) {
  const scale = useSharedValue(from);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      scale.value = withSpring(to, { ...ANIMATION_CONFIG.spring.bouncy, delay });
      opacity.value = withTiming(1, { duration, delay, easing: ANIMATION_CONFIG.easing.smooth });
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
}

/**
 * Hook for button press animation
 * Returns animated style and press handlers
 * @param {number} scaleValue - Scale value on press (default 0.95)
 * @returns {object} { animatedStyle, onPressIn, onPressOut }
 */
export function usePressAnimation(scaleValue = 0.95) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(scaleValue, { damping: 15, stiffness: 300 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return { animatedStyle, onPressIn, onPressOut };
}

/**
 * Hook for shimmer/pulse animation (for loading states)
 * @param {boolean} isLoading - Controls animation
 * @returns {object} Animated style object
 */
export function useShimmer(isLoading = true) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (isLoading) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: ANIMATION_CONFIG.easing.smooth }),
          withTiming(0.3, { duration: 1000, easing: ANIMATION_CONFIG.easing.smooth })
        ),
        -1,
        false
      );
    } else {
      opacity.value = 1;
    }
  }, [isLoading]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return animatedStyle;
}

/**
 * Hook for continuous rotation (for spinners)
 * @param {boolean} spinning - Controls animation
 * @param {number} duration - Duration for one full rotation
 * @returns {object} Animated style object
 */
export function useRotation(spinning = true, duration = 1000) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (spinning) {
      rotation.value = withRepeat(
        withTiming(360, { duration, easing: ANIMATION_CONFIG.easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [spinning]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return animatedStyle;
}

/**
 * Hook for staggered list animations
 * Use with FlatList items for entrance animations
 * @param {number} index - Index of the item
 * @param {number} staggerDelay - Delay between each item (ms)
 * @returns {object} Animated style object
 */
export function useStaggeredFade(index, staggerDelay = 50) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = index * staggerDelay;
    opacity.value = withTiming(1, {
      duration: ANIMATION_CONFIG.duration.normal,
      delay,
      easing: ANIMATION_CONFIG.easing.smooth,
    });
    translateY.value = withSpring(0, {
      ...ANIMATION_CONFIG.spring.gentle,
      delay,
    });
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
}

/**
 * Hook for card hover/press animation
 * Includes scale, elevation, and border color changes
 * @returns {object} { animatedStyle, onPressIn, onPressOut }
 */
export function useCardPress() {
  const scale = useSharedValue(1);
  const elevation = useSharedValue(2);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: elevation.value / 10,
    shadowRadius: elevation.value * 2,
    elevation: elevation.value,
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.98, ANIMATION_CONFIG.spring.snappy);
    elevation.value = withTiming(1, { duration: 150 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, ANIMATION_CONFIG.spring.snappy);
    elevation.value = withTiming(2, { duration: 150 });
  };

  return { animatedStyle, onPressIn, onPressOut };
}

/**
 * Hook for bouncing animation (for notifications, badges)
 * @param {boolean} trigger - When true, animation plays once
 * @returns {object} Animated style object
 */
export function useBounce(trigger = false) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (trigger) {
      scale.value = withSequence(
        withSpring(1.2, ANIMATION_CONFIG.spring.bouncy),
        withSpring(1, ANIMATION_CONFIG.spring.gentle)
      );
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
}

/**
 * Hook for progress bar animation
 * @param {number} progress - Progress value (0-1)
 * @param {number} duration - Animation duration
 * @returns {object} Animated style object
 */
export function useProgress(progress = 0, duration = ANIMATION_CONFIG.duration.slow) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress * 100, {
      duration,
      easing: ANIMATION_CONFIG.easing.smooth,
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return animatedStyle;
}
