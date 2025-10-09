# 🎨 Animation Quick Reference

> **TL;DR**: Import from `@/components/animated` or `@/components/loaders`, use hooks from `@/hooks/useAnimations`

---

## 🚀 Most Common Use Cases

### 1. Animated Button
```jsx
import { AnimatedButton } from '@/components/animated';

<AnimatedButton
  title="Submit"
  variant="primary"
  icon="checkmark"
  loading={isLoading}
  onPress={handlePress}
/>
```
**Variants**: `primary`, `secondary`, `outline`, `danger`

---

### 2. Animated List
```jsx
import { AnimatedListItem } from '@/components/animated';

<FlatList
  data={items}
  renderItem={({ item, index }) => (
    <AnimatedListItem
      index={index}
      icon="star"
      onPress={() => {}}
    >
      <Text>{item.name}</Text>
    </AnimatedListItem>
  )}
/>
```

---

### 3. Loading State
```jsx
import { SkeletonList } from '@/components/loaders';

{isLoading ? (
  <SkeletonList count={5} showAvatar={true} />
) : (
  <FlatList data={data} />
)}
```

---

### 4. Custom Animation
```jsx
import { usePressAnimation } from '@/hooks/useAnimations';
import Animated from 'react-native-reanimated';

const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();

<Animated.View style={animatedStyle}>
  <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut}>
    <Text>Press me</Text>
  </TouchableOpacity>
</Animated.View>
```

---

### 5. Page Wrapper
```jsx
import { AnimatedPage } from '@/components/animated';

export default function MyScreen() {
  return (
    <AnimatedPage animation="slideRight">
      <ScrollView>
        {/* content */}
      </ScrollView>
    </AnimatedPage>
  );
}
```

---

## 📦 Import Cheatsheet

```jsx
// Animated Components
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedListItem,
  AnimatedPage,
  AnimatedModal,
  AnimatedBadge
} from '@/components/animated';

// Loaders
import {
  AnimatedSpinner,
  ShimmerPlaceholder,
  SkeletonCard,
  SkeletonList,
  LoadingOverlay,
  ProgressBar
} from '@/components/loaders';

// Hooks
import {
  useFadeIn,
  useSlideIn,
  useScaleIn,
  usePressAnimation,
  useCardPress,
  useShimmer,
  useRotation,
  useStaggeredFade,
  useBounce,
  useProgress,
  ANIMATION_CONFIG
} from '@/hooks/useAnimations';
```

---

## ⚡ Hook Usage

| Hook | Use Case | Example |
|------|----------|---------|
| `useFadeIn(trigger)` | Fade in entrance | `const style = useFadeIn(true)` |
| `useSlideIn(trigger, dir)` | Slide entrance | `const style = useSlideIn(true, 'right')` |
| `useScaleIn(trigger)` | Scale entrance | `const style = useScaleIn(true)` |
| `usePressAnimation()` | Button press | `const { animatedStyle, onPressIn, onPressOut } = usePressAnimation()` |
| `useStaggeredFade(index)` | List stagger | `const style = useStaggeredFade(index, 50)` |
| `useShimmer(loading)` | Pulse effect | `const style = useShimmer(true)` |
| `useRotation(spinning)` | Spinner | `const style = useRotation(true)` |

---

## 🎯 Common Patterns

### Pattern: Replace ActivityIndicator
```jsx
// ❌ Old
<ActivityIndicator size="large" color={COLORS.primary} />

// ✅ New
import { AnimatedSpinner } from '@/components/loaders';
<AnimatedSpinner size={48} color={COLORS.primary} />
```

### Pattern: Loading Screen
```jsx
// ❌ Old
{isLoading && <ActivityIndicator />}

// ✅ New
import { SkeletonCard } from '@/components/loaders';
{isLoading ? <SkeletonCard /> : <Content />}
```

### Pattern: List Item
```jsx
// ❌ Old
<TouchableOpacity style={styles.item}>
  <Text>{item.name}</Text>
</TouchableOpacity>

// ✅ New
import { AnimatedListItem } from '@/components/animated';
<AnimatedListItem index={index} onPress={() => {}}>
  <Text>{item.name}</Text>
</AnimatedListItem>
```

### Pattern: Button
```jsx
// ❌ Old
<TouchableOpacity style={styles.button} onPress={onPress}>
  <Text>Submit</Text>
</TouchableOpacity>

// ✅ New
import { AnimatedButton } from '@/components/animated';
<AnimatedButton title="Submit" variant="primary" onPress={onPress} />
```

---

## 🎨 Timing Reference

```javascript
ANIMATION_CONFIG.duration.fast      // 200ms - Quick interactions
ANIMATION_CONFIG.duration.normal    // 300ms - Standard (recommended)
ANIMATION_CONFIG.duration.slow      // 500ms - Dramatic
ANIMATION_CONFIG.duration.verySlow  // 800ms - Loading states
```

---

## 💡 Pro Tips

1. **Always stagger lists**: Use `useStaggeredFade(index, 50)`
2. **Keep animations under 300ms** for snappy feel
3. **Use skeleton loaders** instead of blank screens
4. **Add press animations** to all interactive elements
5. **Wrap pages** with `<AnimatedPage>` for transitions

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Animation not working | Ensure component is wrapped in `<Animated.View>` |
| Jerky animations | Check if running on physical device (simulators can be slower) |
| No entrance animation | Make sure `trigger` prop is `true` |
| Slow performance | Reduce number of simultaneous animations |

---

## 📖 Full Documentation

For complete documentation, see:
- **[ANIMATIONS_GUIDE.md](./ANIMATIONS_GUIDE.md)** - Full guide with examples
- **[ANIMATION_CHANGELOG.md](./ANIMATION_CHANGELOG.md)** - Implementation details
- **`/animation-demo`** route - Interactive demo

---

**Last Updated**: 2025-10-09  
**Version**: 1.0.0
