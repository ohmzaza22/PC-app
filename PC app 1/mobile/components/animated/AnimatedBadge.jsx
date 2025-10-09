import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useBounce, useScaleIn } from '../../hooks/useAnimations';
import { COLORS } from '../../constants/colors';

/**
 * AnimatedBadge - Badge with bounce animation
 * Perfect for notifications, counts, status indicators
 * @param {string|number} value - Badge content
 * @param {string} variant - 'primary', 'success', 'error', 'warning', 'info'
 * @param {boolean} bounce - Trigger bounce animation
 * @param {object} style - Additional styles
 */
export default function AnimatedBadge({ 
  value, 
  variant = 'primary', 
  bounce = false,
  style 
}) {
  const scaleStyle = useScaleIn(true, 0.5, 1, 400);
  const bounceStyle = useBounce(bounce);

  const getVariantColor = () => {
    switch (variant) {
      case 'primary':
        return COLORS.primary;
      case 'success':
        return COLORS.success;
      case 'error':
        return COLORS.error;
      case 'warning':
        return COLORS.warning;
      case 'info':
        return COLORS.info;
      default:
        return COLORS.primary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: getVariantColor() },
        scaleStyle,
        bounceStyle,
        style,
      ]}
    >
      <Text style={styles.text}>{value}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
