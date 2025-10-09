import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useCardPress } from '../../hooks/useAnimations';
import { COLORS } from '../../constants/colors';

/**
 * AnimatedCard - Card with press animation and elevation change
 * Perfect for tappable cards with smooth feedback
 * @param {ReactNode} children - Card content
 * @param {function} onPress - Press handler (optional)
 * @param {object} style - Additional styles
 * @param {boolean} disabled - Disabled state
 */
export default function AnimatedCard({ children, onPress, style, disabled = false }) {
  const { animatedStyle, onPressIn, onPressOut } = useCardPress();

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <Animated.View style={[styles.card, animatedStyle, style]}>
      <CardWrapper
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        activeOpacity={0.95}
        style={styles.touchable}
      >
        {children}
      </CardWrapper>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  touchable: {
    padding: 16,
  },
});
