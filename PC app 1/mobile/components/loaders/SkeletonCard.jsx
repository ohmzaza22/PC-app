import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from './ShimmerPlaceholder';
import { COLORS } from '../../constants/colors';

/**
 * SkeletonCard - Card-shaped skeleton loader
 * Use while loading card content
 * @param {boolean} showImage - Show image placeholder
 * @param {number} lines - Number of text lines
 */
export default function SkeletonCard({ showImage = true, lines = 3 }) {
  return (
    <View style={styles.card}>
      {showImage && (
        <ShimmerPlaceholder width="100%" height={120} borderRadius={12} style={styles.image} />
      )}
      <View style={styles.content}>
        {Array.from({ length: lines }).map((_, index) => (
          <ShimmerPlaceholder
            key={index}
            width={index === lines - 1 ? '60%' : '100%'}
            height={16}
            borderRadius={8}
            style={{ marginBottom: 8 }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    marginBottom: 12,
  },
  content: {
    padding: 16,
  },
});
