import { View, Text, StyleSheet, Modal } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeIn } from '../../hooks/useAnimations';
import AnimatedSpinner from './AnimatedSpinner';
import { COLORS } from '../../constants/colors';

/**
 * LoadingOverlay - Full-screen loading overlay
 * Use for navigation transitions or global loading states
 * @param {boolean} visible - Show/hide overlay
 * @param {string} message - Loading message (optional)
 * @param {boolean} transparent - Semi-transparent background
 */
export default function LoadingOverlay({ 
  visible = false, 
  message = 'Loading...', 
  transparent = true 
}) {
  const fadeStyle = useFadeIn(visible, 300);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        style={[
          styles.overlay,
          transparent ? styles.transparentBg : styles.solidBg,
          fadeStyle,
        ]}
      >
        <View style={styles.content}>
          <AnimatedSpinner size={40} color={COLORS.primary} />
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transparentBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  solidBg: {
    backgroundColor: COLORS.background,
  },
  content: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 150,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
});
