import { Modal, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeIn, useSlideIn } from '../../hooks/useAnimations';
import { COLORS } from '../../constants/colors';

const { height } = Dimensions.get('window');

/**
 * AnimatedModal - Modal with smooth fade + slide animations
 * @param {boolean} visible - Show/hide modal
 * @param {function} onClose - Close handler
 * @param {ReactNode} children - Modal content
 * @param {string} position - 'center', 'bottom'
 */
export default function AnimatedModal({ 
  visible, 
  onClose, 
  children, 
  position = 'center' 
}) {
  const fadeStyle = useFadeIn(visible, 250);
  const slideStyle = useSlideIn(
    visible, 
    position === 'bottom' ? 'down' : 'up', 
    position === 'bottom' ? height * 0.5 : 30, 
    300
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, fadeStyle]}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.content,
            position === 'bottom' ? styles.bottomPosition : styles.centerPosition,
            slideStyle,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    maxWidth: '90%',
    maxHeight: '80%',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerPosition: {
    alignSelf: 'center',
  },
  bottomPosition: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
});
