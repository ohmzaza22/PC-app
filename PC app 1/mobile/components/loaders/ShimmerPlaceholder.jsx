import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useShimmer } from '../../hooks/useAnimations';
import { COLORS } from '../../constants/colors';

/**
 * ShimmerPlaceholder - Animated shimmer effect for loading states
 * Perfect for skeleton screens
 * @param {number} width - Width of placeholder
 * @param {number} height - Height of placeholder
 * @param {number} borderRadius - Border radius
 * @param {object} style - Additional styles
 */
export default function ShimmerPlaceholder({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  style 
}) {
  const animatedStyle = useShimmer(true);

  return (
    <Animated.View
      style={[
        styles.shimmer,
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  shimmer: {
    backgroundColor: COLORS.borderLight,
    overflow: 'hidden',
  },
});
