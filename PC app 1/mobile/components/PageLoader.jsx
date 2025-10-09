import { View, Text, StyleSheet } from "react-native";
import Animated from 'react-native-reanimated';
import { useFadeIn, useScaleIn } from "../hooks/useAnimations";
import AnimatedSpinner from "./loaders/AnimatedSpinner";
import { COLORS } from "../constants/colors";

/**
 * Enhanced PageLoader with smooth animations
 * @param {string} message - Loading message (optional)
 */
const PageLoader = ({ message = "Loading..." }) => {
  const fadeStyle = useFadeIn(true);
  const scaleStyle = useScaleIn(true, 0.8, 1, 400, 100);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={[styles.content, fadeStyle, scaleStyle]}>
        <AnimatedSpinner size={48} color={COLORS.primary} duration={1200} />
        <Animated.Text style={[styles.message, fadeStyle]}>{message}</Animated.Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default PageLoader;
