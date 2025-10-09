import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useFadeIn, usePressAnimation } from '../hooks/useAnimations';

export default function PageHeader({ 
  title, 
  onBack, 
  rightComponent,
  showBackButton = true 
}) {
  const router = useRouter();
  const fadeStyle = useFadeIn(true, 250);
  const { animatedStyle: backButtonStyle, onPressIn, onPressOut } = usePressAnimation(0.9);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <Animated.View style={[styles.header, fadeStyle]}>
      {showBackButton ? (
        <Animated.View style={backButtonStyle}>
          <TouchableOpacity 
            onPress={handleBack}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <View style={{ width: 24 }} />
      )}
      
      <Animated.Text style={[styles.headerTitle, fadeStyle]}>{title}</Animated.Text>
      
      {rightComponent || <View style={{ width: 24 }} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    padding: 4,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
});
