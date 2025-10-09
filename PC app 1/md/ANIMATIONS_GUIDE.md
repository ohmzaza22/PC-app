# 🎨 Animation System Guide

## Overview

This app now features a comprehensive animation system built with **React Native Reanimated** for optimal performance and smooth, premium user experiences. All animations are:

- ✨ **Fluid & Fast** - 60fps animations using native drivers
- 🎯 **Consistent** - Unified timing and easing across the app
- 📱 **Mobile-First** - Optimized for iOS and Android
- ⚡ **Performant** - Lightweight and won't impact app performance
- 🎨 **Modern** - Clean, soft, and premium aesthetic

---

## 🎣 Animation Hooks

All custom hooks are located in `/hooks/useAnimations.js`

### Basic Animations

#### `useFadeIn(trigger, duration, delay)`
Smooth fade-in animation
```jsx
import { useFadeIn } from '@/hooks/useAnimations';

const fadeStyle = useFadeIn(true, 300, 0);
<Animated.View style={fadeStyle}>
  <Text>Fades in smoothly</Text>
</Animated.View>
```

#### `useSlideIn(trigger, direction, distance, duration, delay)`
Slide animation from any direction
```jsx
const slideStyle = useSlideIn(true, 'right', 30, 300);
// Directions: 'left', 'right', 'up', 'down'
```

#### `useScaleIn(trigger, from, to, duration, delay)`
Scale animation with fade
```jsx
const scaleStyle = useScaleIn(true, 0.8, 1, 300);
```

### Interactive Animations

#### `usePressAnimation(scaleValue)`
Button press feedback
```jsx
const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.95);

<Animated.View style={animatedStyle}>
  <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut}>
    <Text>Press Me</Text>
  </TouchableOpacity>
</Animated.View>
```

#### `useCardPress()`
Card press with elevation change
```jsx
const { animatedStyle, onPressIn, onPressOut } = useCardPress();
```

### Loading Animations

#### `useShimmer(isLoading)`
Pulse/shimmer effect for skeletons
```jsx
const shimmerStyle = useShimmer(true);
```

#### `useRotation(spinning, duration)`
Continuous rotation for spinners
```jsx
const rotationStyle = useRotation(true, 1000);
```

### List Animations

#### `useStaggeredFade(index, staggerDelay)`
Staggered entrance for list items
```jsx
const staggeredStyle = useStaggeredFade(index, 50);
// Each item appears 50ms after the previous one
```

### Special Effects

#### `useBounce(trigger)`
Bounce animation (for notifications)
```jsx
const bounceStyle = useBounce(hasNewNotification);
```

#### `useProgress(progress, duration)`
Animated progress bar
```jsx
const progressStyle = useProgress(0.75, 500); // 75% progress
```

---

## 🧩 Animated Components

### Buttons

#### `<AnimatedButton>`
Button with press animation and loading state
```jsx
import { AnimatedButton } from '@/components/animated';

<AnimatedButton
  title="Submit"
  onPress={handleSubmit}
  loading={isLoading}
  variant="primary" // 'primary', 'secondary', 'outline', 'danger'
  icon="checkmark" // Optional Ionicon name
/>
```

### Cards

#### `<AnimatedCard>`
Tappable card with press feedback
```jsx
import { AnimatedCard } from '@/components/animated';

<AnimatedCard onPress={() => navigate('/details')}>
  <Text>Card Content</Text>
</AnimatedCard>
```

### Lists

#### `<AnimatedListItem>`
List item with stagger and press animation
```jsx
import { AnimatedListItem } from '@/components/animated';

<FlatList
  data={items}
  renderItem={({ item, index }) => (
    <AnimatedListItem
      index={index}
      onPress={() => handlePress(item)}
      icon="person"
    >
      <Text>{item.name}</Text>
    </AnimatedListItem>
  )}
/>
```

### Pages

#### `<AnimatedPage>`
Page wrapper with entrance animation
```jsx
import { AnimatedPage } from '@/components/animated';

export default function MyScreen() {
  return (
    <AnimatedPage animation="slideRight">
      {/* Your page content */}
    </AnimatedPage>
  );
}
```

Animations: `'fade'`, `'slideRight'`, `'slideLeft'`, `'slideUp'`, `'slideDown'`

### Modals

#### `<AnimatedModal>`
Modal with fade + slide animations
```jsx
import { AnimatedModal } from '@/components/animated';

<AnimatedModal
  visible={isVisible}
  onClose={handleClose}
  position="center" // or 'bottom'
>
  <Text>Modal Content</Text>
</AnimatedModal>
```

### Badges

#### `<AnimatedBadge>`
Badge with bounce animation
```jsx
import { AnimatedBadge } from '@/components/animated';

<AnimatedBadge
  value={5}
  variant="error" // 'primary', 'success', 'error', 'warning', 'info'
  bounce={hasNewItems}
/>
```

---

## 📦 Loader Components

### Spinners

#### `<AnimatedSpinner>`
Rotating spinner
```jsx
import { AnimatedSpinner } from '@/components/loaders';

<AnimatedSpinner size={32} color={COLORS.primary} duration={1000} />
```

### Skeleton Loaders

#### `<ShimmerPlaceholder>`
Basic shimmer block
```jsx
import { ShimmerPlaceholder } from '@/components/loaders';

<ShimmerPlaceholder width="100%" height={20} borderRadius={8} />
```

#### `<SkeletonCard>`
Card-shaped skeleton
```jsx
import { SkeletonCard } from '@/components/loaders';

<SkeletonCard showImage={true} lines={3} />
```

#### `<SkeletonList>`
List skeleton loader
```jsx
import { SkeletonList } from '@/components/loaders';

<SkeletonList count={5} showAvatar={true} />
```

### Overlays

#### `<LoadingOverlay>`
Full-screen loading overlay
```jsx
import { LoadingOverlay } from '@/components/loaders';

<LoadingOverlay
  visible={isLoading}
  message="Loading data..."
  transparent={true}
/>
```

#### `<ProgressBar>`
Animated progress bar
```jsx
import { ProgressBar } from '@/components/loaders';

<ProgressBar
  progress={0.65} // 0 to 1
  label="Uploading..."
  color={COLORS.primary}
/>
```

---

## 🎯 Animation Configuration

All timing and easing presets are in `/hooks/useAnimations.js`

### Duration Presets
```javascript
duration.fast = 200ms
duration.normal = 300ms
duration.slow = 500ms
duration.verySlow = 800ms
```

### Easing Functions
```javascript
easing.smooth // Cubic bezier for natural motion
easing.bounce // Overshoot for playful effects
easing.easeInOut // Standard ease in/out
```

### Spring Presets
```javascript
spring.gentle // Smooth spring
spring.bouncy // More bounce
spring.snappy // Quick response
```

---

## 💡 Best Practices

### 1. **Use Staggered Animations for Lists**
```jsx
renderItem={({ item, index }) => {
  const staggeredStyle = useStaggeredFade(index, 50);
  return <Animated.View style={staggeredStyle}>...</Animated.View>
}}
```

### 2. **Combine Animations for Rich Effects**
```jsx
const fadeStyle = useFadeIn(true);
const slideStyle = useSlideIn(true, 'up', 20);
<Animated.View style={[fadeStyle, slideStyle]}>...</Animated.View>
```

### 3. **Use Skeleton Loaders for Better UX**
```jsx
{isLoading ? (
  <SkeletonList count={5} />
) : (
  <FlatList data={data} />
)}
```

### 4. **Add Micro-interactions to Buttons**
```jsx
// Always wrap interactive elements with press animations
const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();
```

### 5. **Keep Animations Fast**
- Use 200-300ms for most UI transitions
- Reserve 500ms+ for dramatic entrances
- Avoid animations longer than 1 second

---

## 🚀 Quick Start Examples

### Example 1: Animated Dashboard Card
```jsx
import { AnimatedCard } from '@/components/animated';
import { useStaggeredFade } from '@/hooks/useAnimations';

function DashboardCard({ data, index }) {
  const staggeredStyle = useStaggeredFade(index, 80);
  
  return (
    <Animated.View style={staggeredStyle}>
      <AnimatedCard onPress={() => handleCardPress()}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.value}>{data.value}</Text>
      </AnimatedCard>
    </Animated.View>
  );
}
```

### Example 2: Animated Form Button
```jsx
import { AnimatedButton } from '@/components/animated';

function MyForm() {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    setLoading(true);
    await submitForm();
    setLoading(false);
  };
  
  return (
    <AnimatedButton
      title="Submit Form"
      onPress={handleSubmit}
      loading={loading}
      variant="primary"
      icon="checkmark-circle"
    />
  );
}
```

### Example 3: Page with Entrance Animation
```jsx
import { AnimatedPage } from '@/components/animated';
import { AnimatedListItem } from '@/components/animated';

export default function MyScreen() {
  return (
    <AnimatedPage animation="slideRight">
      <ScrollView>
        <Text style={styles.title}>My Screen</Text>
        {items.map((item, index) => (
          <AnimatedListItem
            key={item.id}
            index={index}
            icon="star"
            onPress={() => handlePress(item)}
          >
            <Text>{item.name}</Text>
          </AnimatedListItem>
        ))}
      </ScrollView>
    </AnimatedPage>
  );
}
```

### Example 4: Loading State with Skeleton
```jsx
import { SkeletonCard } from '@/components/loaders';
import { AnimatedCard } from '@/components/animated';

function ProductList() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  
  if (loading) {
    return (
      <View>
        <SkeletonCard showImage={true} lines={3} />
        <SkeletonCard showImage={true} lines={3} />
        <SkeletonCard showImage={true} lines={3} />
      </View>
    );
  }
  
  return products.map((product, index) => (
    <AnimatedCard key={product.id} onPress={() => {}}>
      <Image source={product.image} />
      <Text>{product.name}</Text>
    </AnimatedCard>
  ));
}
```

---

## 🎨 Design Philosophy

### Soft & Premium Aesthetic
- **Rounded Corners**: 12-16px border radius
- **Soft Shadows**: Low opacity, subtle elevation
- **Pastel Colors**: Uses emerald green theme
- **Smooth Timing**: Cubic bezier easing for natural motion

### Performance-First
- All animations run on the **native thread** via Reanimated
- No JavaScript thread blocking
- Optimized for 60fps on all devices

### Consistent Behavior
- All buttons scale to 0.95-0.98 on press
- Cards have subtle elevation changes
- Lists use staggered entrance (50-80ms delay)
- Page transitions are 300ms

---

## 📝 Migration Tips

### Before
```jsx
<TouchableOpacity style={styles.button} onPress={handlePress}>
  <Text>Click Me</Text>
</TouchableOpacity>
```

### After (With Animation)
```jsx
<AnimatedButton
  title="Click Me"
  onPress={handlePress}
  variant="primary"
/>
```

---

## 🔧 Troubleshooting

### Animation not appearing?
- Ensure `trigger` prop is `true` for entrance animations
- Check that Reanimated is properly installed
- Verify the component is wrapped in `<Animated.View>`

### Performance issues?
- Reduce stagger delay in lists (use 30-50ms)
- Limit number of simultaneous animations
- Use `useNativeDriver: true` for transform/opacity

### Animations feel too slow/fast?
- Adjust duration in `ANIMATION_CONFIG`
- Use duration presets: `duration.fast`, `duration.normal`, `duration.slow`

---

## 📚 Additional Resources

- [React Native Reanimated Docs](https://docs.swmansion.com/react-native-reanimated/)
- [Animation Timing Functions](https://easings.net/)
- [Material Motion Guidelines](https://m3.material.io/styles/motion/overview)

---

**Built with ❤️ using React Native Reanimated**
