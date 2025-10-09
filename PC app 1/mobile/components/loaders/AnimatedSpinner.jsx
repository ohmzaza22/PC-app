import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRotation } from '../../hooks/useAnimations';
import { COLORS } from '../../constants/colors';

/**
 * AnimatedSpinner - Smooth rotating spinner
 * @param {number} size - Icon size
 * @param {string} color - Icon color
 * @param {number} duration - Rotation duration (ms)
 */
export default function AnimatedSpinner({ 
  size = 32, 
  color = COLORS.primary,
  duration = 1000 
}) {
  const animatedStyle = useRotation(true, duration);

  return (
    <View style={styles.container}>
      <Animated.View style={animatedStyle}>
        <Ionicons name="sync" size={size} color={color} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
