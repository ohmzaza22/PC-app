import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeIn, useSlideIn } from '../../hooks/useAnimations';
import { COLORS } from '../../constants/colors';

/**
 * AnimatedPage - Page wrapper with entrance animations
 * Wrap your page content with this for smooth transitions
 * @param {ReactNode} children - Page content
 * @param {string} animation - 'fade', 'slideRight', 'slideLeft', 'slideUp', 'slideDown'
 * @param {number} duration - Animation duration
 * @param {object} style - Additional styles
 */
export default function AnimatedPage({
  children,
  animation = 'slideRight',
  duration = 300,
  style,
}) {
  let animatedStyle;

  switch (animation) {
    case 'fade':
      animatedStyle = useFadeIn(true, duration);
      break;
    case 'slideRight':
      animatedStyle = useSlideIn(true, 'right', 30, duration);
      break;
    case 'slideLeft':
      animatedStyle = useSlideIn(true, 'left', 30, duration);
      break;
    case 'slideUp':
      animatedStyle = useSlideIn(true, 'up', 30, duration);
      break;
    case 'slideDown':
      animatedStyle = useSlideIn(true, 'down', 30, duration);
      break;
    default:
      animatedStyle = useFadeIn(true, duration);
  }

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
