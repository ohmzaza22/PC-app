import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from './ShimmerPlaceholder';
import { COLORS } from '../../constants/colors';

/**
 * SkeletonList - List item skeleton loader
 * Use in FlatList while loading
 * @param {number} count - Number of skeleton items to show
 * @param {boolean} showAvatar - Show avatar placeholder
 */
export default function SkeletonList({ count = 5, showAvatar = false }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.item}>
          {showAvatar && (
            <ShimmerPlaceholder width={48} height={48} borderRadius={24} style={styles.avatar} />
          )}
          <View style={styles.content}>
            <ShimmerPlaceholder width="80%" height={18} borderRadius={8} style={styles.title} />
            <ShimmerPlaceholder width="60%" height={14} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  avatar: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 8,
  },
});
