import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useStaggeredFade, usePressAnimation } from '../../hooks/useAnimations';
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

/**
 * AnimatedListItem - List item with staggered entrance and press animation
 * Use in FlatList with renderItem
 * @param {ReactNode} children - Item content
 * @param {function} onPress - Press handler
 * @param {number} index - Item index (for stagger effect)
 * @param {string} icon - Leading icon (optional)
 * @param {string} rightIcon - Trailing icon (default 'chevron-forward')
 * @param {object} style - Additional styles
 */
export default function AnimatedListItem({
  children,
  onPress,
  index = 0,
  icon,
  rightIcon = 'chevron-forward',
  style,
}) {
  const staggeredStyle = useStaggeredFade(index, 50);
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.98);

  return (
    <Animated.View style={[staggeredStyle, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.item, style]}
        activeOpacity={0.95}
      >
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={24} color={COLORS.primary} />
          </View>
        )}
        <View style={styles.content}>{children}</View>
        {rightIcon && (
          <Ionicons name={rightIcon} size={20} color={COLORS.textMuted} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
});
