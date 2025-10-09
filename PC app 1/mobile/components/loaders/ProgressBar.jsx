import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useProgress } from '../../hooks/useAnimations';
import { COLORS } from '../../constants/colors';

/**
 * ProgressBar - Animated progress bar
 * @param {number} progress - Progress value (0-1)
 * @param {string} label - Label text (optional)
 * @param {string} color - Bar color
 * @param {number} height - Bar height
 */
export default function ProgressBar({ 
  progress = 0, 
  label, 
  color = COLORS.primary,
  height = 8 
}) {
  const progressStyle = useProgress(progress);

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.percentage}>{Math.round(progress * 100)}%</Text>
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.bar,
            { backgroundColor: color, height },
            progressStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  track: {
    backgroundColor: COLORS.borderLight,
    borderRadius: 100,
    overflow: 'hidden',
  },
  bar: {
    borderRadius: 100,
  },
});
