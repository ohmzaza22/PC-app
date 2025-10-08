import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { storeAPI, storeVisitAPI, setAuthToken } from '../../lib/api';
import { COLORS } from '../../constants/colors';

export default function CheckInScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  
  const [stores, setStores] = useState([]);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const token = await getToken();
      if (token) {
        setAuthToken(token);
        await Promise.all([
          fetchStores(),
          fetchCurrentVisit(),
          getCurrentLocation(),
        ]);
      }
    } catch (error) {
      console.error('Error initializing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const fetchStores = async () => {
    try {
      // Get stores assigned to this PC
      const response = await storeAPI.getAll();
      
      // Filter stores by assignment (if PC has assigned stores)
      // For now, show all stores but we'll filter by distance
      setStores(response.data);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const fetchCurrentVisit = async () => {
    try {
      const response = await storeVisitAPI.getCurrent();
      setCurrentVisit(response.data.visit);
    } catch (error) {
      console.error('Error fetching current visit:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleCheckIn = async (store) => {
    if (!currentLocation) {
      Alert.alert('Error', 'Getting your location...');
      await getCurrentLocation();
      return;
    }

    const storeLocation = typeof store.location === 'string' 
      ? JSON.parse(store.location) 
      : store.location;

    if (storeLocation.latitude && storeLocation.longitude) {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        parseFloat(storeLocation.latitude),
        parseFloat(storeLocation.longitude)
      );

      if (distance > 100) {
        Alert.alert(
          'Too Far',
          `You are ${Math.round(distance)}m away from the store. You must be within 100m to check in.`,
          [
            { text: 'OK' },
            { text: 'Refresh Location', onPress: getCurrentLocation },
          ]
        );
        return;
      }
    }

    setIsCheckingIn(true);
    try {
      const response = await storeVisitAPI.checkIn({
        store_id: store.id,
        location: currentLocation,
      });

      Alert.alert('Success', 'Checked in successfully!');
      setCurrentVisit(response.data.visit);
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to check in');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!currentVisit) return;

    if (!currentLocation) {
      Alert.alert('Error', 'Getting your location...');
      await getCurrentLocation();
      return;
    }

    Alert.alert(
      'Check Out',
      'Are you sure you want to check out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check Out',
          onPress: async () => {
            setIsCheckingOut(true);
            try {
              await storeVisitAPI.checkOut({
                visit_id: currentVisit.id,
                location: currentLocation,
              });

              Alert.alert('Success', 'Checked out successfully!');
              setCurrentVisit(null);
            } catch (error) {
              console.error('Error checking out:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to check out');
            } finally {
              setIsCheckingOut(false);
            }
          },
        },
      ]
    );
  };

  const renderStoreItem = ({ item }) => {
    const storeLocation = typeof item.location === 'string' 
      ? JSON.parse(item.location) 
      : item.location;

    let distance = null;
    if (currentLocation && storeLocation.latitude && storeLocation.longitude) {
      distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        parseFloat(storeLocation.latitude),
        parseFloat(storeLocation.longitude)
      );
    }

    // Don't show stores that are too far away (more than 5km)
    if (distance !== null && distance > 5000) {
      return null;
    }

    const isNearby = distance !== null && distance <= 100;
    const isCurrentStore = currentVisit && currentVisit.store_id === item.id;

    return (
      <View style={[styles.storeItem, isCurrentStore && styles.storeItemActive]}>
        <View style={styles.storeIcon}>
          <Ionicons 
            name={isCurrentStore ? "checkmark-circle" : "storefront"} 
            size={24} 
            color={isCurrentStore ? COLORS.success : COLORS.primary} 
          />
        </View>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{item.store_name}</Text>
          <Text style={styles.storeAddress}>
            {storeLocation.address || 'No address'}
          </Text>
          {distance !== null && (
            <Text style={[styles.distance, isNearby && styles.distanceNear]}>
              📍 {Math.round(distance)}m away {isNearby && '✓'}
            </Text>
          )}
        </View>
        {!isCurrentStore && (
          <TouchableOpacity
            style={[styles.checkInButton, !isNearby && styles.checkInButtonDisabled]}
            onPress={() => handleCheckIn(item)}
            disabled={isCheckingIn || !isNearby}
          >
            {isCheckingIn ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.checkInButtonText}>Check In</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Check In</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check In</Text>
        <TouchableOpacity onPress={getCurrentLocation}>
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {currentVisit && (
        <View style={styles.currentVisitCard}>
          <View style={styles.currentVisitHeader}>
            <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
            <View style={styles.currentVisitInfo}>
              <Text style={styles.currentVisitTitle}>Currently Checked In</Text>
              <Text style={styles.currentVisitStore}>{currentVisit.store_name}</Text>
              <Text style={styles.currentVisitTime}>
                Since {new Date(currentVisit.check_in_time).toLocaleTimeString()}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.checkOutButton}
            onPress={handleCheckOut}
            disabled={isCheckingOut}
          >
            {isCheckingOut ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
                <Text style={styles.checkOutButtonText}>Check Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Nearby Stores</Text>
        <Text style={styles.listSubtitle}>
          {currentLocation ? '📍 Showing stores within 5km' : '📍 Getting location...'}
        </Text>
      </View>

      <FlatList
        data={stores
          .map(store => {
            const storeLocation = typeof store.location === 'string' 
              ? JSON.parse(store.location) 
              : store.location;
            
            let distance = null;
            if (currentLocation && storeLocation.latitude && storeLocation.longitude) {
              distance = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                parseFloat(storeLocation.latitude),
                parseFloat(storeLocation.longitude)
              );
            }
            
            return { ...store, calculatedDistance: distance };
          })
          .filter(store => store.calculatedDistance === null || store.calculatedDistance <= 5000)
          .sort((a, b) => {
            if (a.calculatedDistance === null) return 1;
            if (b.calculatedDistance === null) return -1;
            return a.calculatedDistance - b.calculatedDistance;
          })
        }
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStoreItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No nearby stores</Text>
            <Text style={styles.emptySubtext}>
              {currentLocation 
                ? 'No stores found within 5km of your location' 
                : 'Waiting for location...'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  currentVisitCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  currentVisitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  currentVisitInfo: {
    flex: 1,
  },
  currentVisitTitle: {
    fontSize: 12,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  currentVisitStore: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  currentVisitTime: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  checkOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.error,
    padding: 14,
    borderRadius: 12,
  },
  checkOutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  listHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  listSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  storeItemActive: {
    borderColor: COLORS.success,
    borderWidth: 2,
    backgroundColor: COLORS.backgroundLight,
  },
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  storeAddress: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  distance: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  distanceNear: {
    color: COLORS.success,
    fontWeight: '600',
  },
  checkInButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  checkInButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  checkInButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
