import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { storeAPI } from '../../lib/api';
import { setAuthToken } from '../../lib/api';
import { COLORS } from '../../constants/colors';
import PageHeader from '../../components/PageHeader';
import { AnimatedSpinner, SkeletonList } from '../../components/loaders';
import { useStaggeredFade, usePressAnimation } from '../../hooks/useAnimations';

export default function AdminStoresScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    initializeAndFetch();
  }, []);

  // Refresh data when screen comes into focus (after adding/editing)
  useFocusEffect(
    useCallback(() => {
      // Skip refresh on initial mount, only refresh when returning to screen
      const shouldRefresh = stores.length > 0;
      if (shouldRefresh && !isLoading) {
        handleRefresh();
      }
    }, [stores.length, isLoading])
  );

  const initializeAndFetch = async () => {
    try {
      const token = await getToken();
      if (token) {
        setAuthToken(token);
        await fetchStores();
      }
    } catch (error) {
      console.error('Error initializing:', error);
    }
  };

  const fetchStores = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const response = await storeAPI.getAll();
      setStores(response.data);
    } catch (error) {
      console.error('Error fetching stores:', error);
      Alert.alert('Error', 'Failed to load stores');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await storeAPI.getAll();
      setStores(response.data);
    } catch (error) {
      console.error('Error refreshing stores:', error);
      Alert.alert('Error', 'Failed to refresh stores');
    } finally {
      setIsRefreshing(false);
    }
  };

  const deleteStore = async (id, name) => {
    Alert.alert(
      'Delete Store',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storeAPI.delete(id);
              Alert.alert('Success', 'Store deleted');
              fetchStores();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete store');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Manage Stores"
        rightComponent={
          <TouchableOpacity 
            onPress={handleRefresh} 
            disabled={isRefreshing}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isRefreshing ? (
              <AnimatedSpinner size={24} color={COLORS.primary} duration={800} />
            ) : (
              <Ionicons name="refresh" size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <SkeletonList count={6} showAvatar={true} />
      ) : (
        <>
          <AddStoreButton onPress={() => router.push('/edit-store')} />
          
          <FlatList
          data={stores}
          keyExtractor={(item) => item.id.toString()}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          renderItem={({ item, index }) => (
            <StoreListItem
              item={item}
              index={index}
              onEdit={() => router.push(`/edit-store?id=${item.id}`)}
              onDelete={() => deleteStore(item.id, item.store_name)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No stores yet</Text>
              <Text style={styles.emptySubtext}>Tap "Add Store with Map" to get started</Text>
            </View>
          }
        />
        </>
      )}
    </View>
  );
}

// Animated Add Store Button Component
function AddStoreButton({ onPress }) {
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.97);

  return (
    <Animated.View style={[animatedStyle, { marginHorizontal: 16, marginTop: 16 }]}>
      <TouchableOpacity 
        style={styles.mapAddButton}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
      >
        <Ionicons name="map" size={24} color={COLORS.white} />
        <Text style={styles.mapAddButtonText}>Add Store with Map</Text>
        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// Animated Store List Item Component
function StoreListItem({ item, index, onEdit, onDelete }) {
  const staggeredStyle = useStaggeredFade(index, 60);
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.98);

  return (
    <Animated.View style={[staggeredStyle, { marginHorizontal: 16, marginTop: 12 }]}>
      <Animated.View style={[styles.storeItem, animatedStyle]}>
        <View style={styles.storeIcon}>
          <Ionicons name="storefront" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{item.store_name}</Text>
          <Text style={styles.storeDetails}>
            {item.pc_name ? `Assigned to: ${item.pc_name}` : 'Unassigned'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={onEdit}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={styles.editButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={onDelete}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={styles.deleteButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  mapAddButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  storeDetails: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.textLight,
  },
});
