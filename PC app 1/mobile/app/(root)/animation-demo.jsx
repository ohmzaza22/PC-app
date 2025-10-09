import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import PageHeader from '../../components/PageHeader';
import { AnimatedPage } from '../../components/animated';
import { AnimatedButton } from '../../components/animated';
import { AnimatedCard } from '../../components/animated';
import { AnimatedListItem } from '../../components/animated';
import { AnimatedBadge } from '../../components/animated';
import { AnimatedModal } from '../../components/animated';
import { SkeletonCard, SkeletonList, ProgressBar, AnimatedSpinner } from '../../components/loaders';

/**
 * Animation Demo Screen
 * Showcases all available animations and components
 * This is for demonstration purposes - remove if not needed
 */
export default function AnimationDemoScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSkeletons, setShowSkeletons] = useState(false);
  const [progress, setProgress] = useState(0);
  const [badgeBounce, setBadgeBounce] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const handleSkeletonDemo = () => {
    setShowSkeletons(true);
    setTimeout(() => setShowSkeletons(false), 3000);
  };

  const handleProgressDemo = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          clearInterval(interval);
          return 1;
        }
        return prev + 0.1;
      });
    }, 300);
  };

  const handleBadgeBounce = () => {
    setBadgeBounce(true);
    setTimeout(() => setBadgeBounce(false), 500);
  };

  const demoItems = [
    { id: 1, title: 'List Item 1', icon: 'star' },
    { id: 2, title: 'List Item 2', icon: 'heart' },
    { id: 3, title: 'List Item 3', icon: 'rocket' },
  ];

  return (
    <View style={styles.container}>
      <PageHeader title="Animation Demo" />
      
      <AnimatedPage animation="slideRight">
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          
          {/* Section: Buttons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Animated Buttons</Text>
            <AnimatedButton
              title="Primary Button"
              variant="primary"
              icon="checkmark-circle"
              onPress={() => console.log('Primary')}
            />
            <View style={{ height: 12 }} />
            <AnimatedButton
              title="Secondary Button"
              variant="secondary"
              icon="star"
              onPress={() => console.log('Secondary')}
            />
            <View style={{ height: 12 }} />
            <AnimatedButton
              title="Outline Button"
              variant="outline"
              icon="heart"
              onPress={() => console.log('Outline')}
            />
            <View style={{ height: 12 }} />
            <AnimatedButton
              title="Loading Button"
              variant="primary"
              loading={loading}
              onPress={handleLoadingDemo}
            />
          </View>

          {/* Section: Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Animated Cards</Text>
            <AnimatedCard onPress={() => console.log('Card pressed')}>
              <Text style={styles.cardTitle}>Tappable Card</Text>
              <Text style={styles.cardText}>
                Press me to see the animation! Cards scale and change elevation on press.
              </Text>
            </AnimatedCard>
            <View style={{ height: 12 }} />
            <AnimatedCard>
              <Text style={styles.cardTitle}>Static Card</Text>
              <Text style={styles.cardText}>
                This card doesn't have an onPress, so it's static but still enters with animation.
              </Text>
            </AnimatedCard>
          </View>

          {/* Section: List Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Animated List Items</Text>
            <Text style={styles.sectionDescription}>
              Each item appears with a staggered animation
            </Text>
            {demoItems.map((item, index) => (
              <AnimatedListItem
                key={item.id}
                index={index}
                icon={item.icon}
                onPress={() => console.log(`Pressed ${item.title}`)}
              >
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>Staggered entrance animation</Text>
              </AnimatedListItem>
            ))}
          </View>

          {/* Section: Badges */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Animated Badges</Text>
            <View style={styles.badgeRow}>
              <AnimatedBadge value={5} variant="primary" bounce={badgeBounce} />
              <AnimatedBadge value="New" variant="success" bounce={badgeBounce} />
              <AnimatedBadge value={99} variant="error" bounce={badgeBounce} />
              <AnimatedBadge value="!" variant="warning" bounce={badgeBounce} />
              <AnimatedBadge value="i" variant="info" bounce={badgeBounce} />
            </View>
            <AnimatedButton
              title="Trigger Bounce"
              variant="outline"
              onPress={handleBadgeBounce}
            />
          </View>

          {/* Section: Modal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Animated Modal</Text>
            <AnimatedButton
              title="Open Modal"
              variant="primary"
              icon="expand"
              onPress={() => setModalVisible(true)}
            />
          </View>

          {/* Section: Loaders */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Loading States</Text>
            
            <Text style={styles.subsectionTitle}>Spinner</Text>
            <View style={styles.spinnerRow}>
              <AnimatedSpinner size={32} color={COLORS.primary} />
              <AnimatedSpinner size={40} color={COLORS.success} />
              <AnimatedSpinner size={48} color={COLORS.error} />
            </View>

            <Text style={styles.subsectionTitle}>Skeleton Loaders</Text>
            <AnimatedButton
              title={showSkeletons ? "Loading..." : "Show Skeletons"}
              variant="outline"
              onPress={handleSkeletonDemo}
              disabled={showSkeletons}
            />
            <View style={{ height: 12 }} />
            {showSkeletons ? (
              <>
                <SkeletonCard showImage={true} lines={3} />
                <SkeletonList count={3} showAvatar={true} />
              </>
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderText}>Content will show skeletons</Text>
              </View>
            )}
          </View>

          {/* Section: Progress Bar */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress Bar</Text>
            <ProgressBar
              progress={progress}
              label="Download Progress"
              color={COLORS.primary}
            />
            <View style={{ height: 12 }} />
            <AnimatedButton
              title="Start Progress"
              variant="primary"
              icon="download"
              onPress={handleProgressDemo}
            />
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>💡 Animation Features</Text>
            <Text style={styles.infoText}>
              • All animations use React Native Reanimated for 60fps performance
            </Text>
            <Text style={styles.infoText}>
              • Consistent timing and easing across the app
            </Text>
            <Text style={styles.infoText}>
              • Staggered list entrances for visual hierarchy
            </Text>
            <Text style={styles.infoText}>
              • Press animations for better touch feedback
            </Text>
            <Text style={styles.infoText}>
              • Skeleton loaders for better perceived performance
            </Text>
            <Text style={styles.infoText}>
              • See ANIMATIONS_GUIDE.md for full documentation
            </Text>
          </View>

        </ScrollView>
      </AnimatedPage>

      {/* Modal */}
      <AnimatedModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        position="center"
      >
        <Text style={styles.modalTitle}>Animated Modal</Text>
        <Text style={styles.modalText}>
          This modal appears with fade and slide animations. Press outside or the button below to close.
        </Text>
        <View style={{ height: 16 }} />
        <AnimatedButton
          title="Close Modal"
          variant="primary"
          onPress={() => setModalVisible(false)}
        />
      </AnimatedModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  spinnerRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  placeholderBox: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  infoSection: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
    lineHeight: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.textLight,
    lineHeight: 24,
  },
});
