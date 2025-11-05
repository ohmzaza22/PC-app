import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, FlatList, Modal, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MapView, { Marker, Circle } from './MapView';
import { COLORS } from '../constants/colors';
import { THAI } from '../constants/thai';
import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { storeVisitAPI, storeAPI, taskAPI } from '../lib/api';
import { useMapStore } from '../store/useMapStore';

const { width, height } = Dimensions.get('window');

export default function CheckInStatus({ currentVisit, tasks, stats, onRefresh }) {
  const router = useRouter();
  const localMapRef = useRef(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [stores, setStores] = useState([]);
  const [showMap, setShowMap] = useState(true);
  
  const { 
    region, 
    currentLocation, 
    setCurrentLocation, 
    setMapRef, 
    zoomIn,
    zoomOut,
    fitToMarkers,
    onRegionChangeComplete 
  } = useMapStore();

  useEffect(() => {
    if (showStoreModal) {
      fetchStores();
      getCurrentLocation();
    }
  }, [showStoreModal]);

  // Sync local map ref with global store when modal opens
  const handleMapReady = () => {
    if (localMapRef.current) {
      setMapRef(localMapRef.current);
    }
  };

  const fetchStores = async () => {
    try {
      // Try to fetch eligible stores (stores with tasks for today) for PC users
      try {
        const response = await taskAPI.getCheckinEligibility();
        const eligibleStores = response.data.eligibleStores || [];
        
        // Transform to match existing store structure
        const transformedStores = eligibleStores.map(es => ({
          id: es.storeId,
          store_name: es.storeName,
          location: es.location,
          tasks: es.tasks, // Include task information
        }));
        
        setStores(transformedStores);
        
        // Fit map to show all eligible stores after they're loaded
        setTimeout(() => {
          fitMapToMarkersWithStores(transformedStores);
        }, 500);
      } catch (eligibilityError) {
        // If eligibility endpoint is not available or fails, fallback to all stores
        console.log('Eligibility check not available, loading all stores');
        const fallbackResponse = await storeAPI.getAll();
        setStores(fallbackResponse.data || []);
        
        setTimeout(() => {
          fitMapToMarkersWithStores(fallbackResponse.data || []);
        }, 500);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    }
  };

  const fitMapToMarkersWithStores = (storeList) => {
    if (!currentLocation || !storeList.length) return;

    const markers = storeList
      .map(store => {
        const loc = typeof store.location === 'string' ? JSON.parse(store.location) : store.location;
        if (loc.latitude && loc.longitude) {
          return {
            latitude: parseFloat(loc.latitude),
            longitude: parseFloat(loc.longitude),
          };
        }
        return null;
      })
      .filter(Boolean);

    // Add current location
    markers.push({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    });

    if (markers.length > 0) {
      fitToMarkers(markers);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for check-in');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Update shared map store
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location');
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

      if (distance > 100000) {
        Alert.alert(
          'Too Far',
          `You are ${Math.round(distance / 1000)}km away from the store. You must be within 100km to check in.`,
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
      await storeVisitAPI.checkIn(store.id, currentLocation);
      Alert.alert('Success', 'Checked in successfully! You can now start your tasks.');
      setShowStoreModal(false);
      onRefresh?.();
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to check in');
    } finally {
    }
  };

  const handleCancelCheckIn = async () => {
    Alert.alert(
      THAI.cancelCheckIn,
      THAI.confirmCancelCheckIn,
      [
        { text: THAI.cancel, style: 'cancel' },
        {
          text: THAI.yesCancelCheckIn,
          style: 'destructive',
          onPress: async () => {
            setIsCheckingOut(true);
            try {
              await storeVisitAPI.cancelCheckIn(currentVisit.id);
              Alert.alert(THAI.checkInCancelled, THAI.checkInCancelledDescription);
              Alert.alert('Check-In Cancelled', 'You have been checked out. You can check in to the correct store now.');
              onRefresh?.();
            } catch (error) {
              console.error('Error cancelling check-in:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel check-in');
            } finally {
              setIsCheckingOut(false);
            }
          }
        }
      ]
    );
  };

  const handleCheckOut = async () => {
    if (!stats?.canCheckOut) {
      const incompleteTasks = tasks?.filter(t => t.is_required && t.status !== 'COMPLETED') || [];
      Alert.alert(
        THAI.checkOutFromStore,
        `${THAI.completeRequiredTasks}:\n\n${incompleteTasks.map(t => `• ${t.task_type}`).join('\n')}`,
        [{ text: THAI.confirm }]
      );
      return;
    }

    Alert.alert(
      'Confirm Check-Out',
      'Are you sure you want to check out?',
      [
        { text: THAI.cancel, style: 'cancel' },
        {
          text: THAI.checkOutFromStore,
          style: 'destructive',
          onPress: async () => {
            setIsCheckingOut(true);
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required for check-out');
                return;
              }

              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });

              await storeVisitAPI.checkOut(currentVisit.id, {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                timestamp: new Date().toISOString(),
              });

              Alert.alert('Success', 'Checked out successfully');
              onRefresh?.();
            } catch (error) {
              console.error('Check-out error:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to check out');
            } finally {
              setIsCheckingOut(false);
            }
          }
        }
      ]
    );
  };

  if (!currentVisit) {
    return (
      <>
        <View style={styles.notCheckedInCard}>
          <Ionicons name="location-outline" size={48} color={COLORS.primary} />
          <Text style={styles.notCheckedInText}>{THAI.notCheckedIn}</Text>
          <Text style={styles.notCheckedInSubtext}>{THAI.checkInDescription}</Text>
          
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => setShowStoreModal(true)}
          >
            <Ionicons name="location" size={20} color={COLORS.white} />
            <Text style={styles.checkInButtonText}>{THAI.checkInToStore}</Text>
          </TouchableOpacity>
        </View>

        {/* Store Selection Modal */}
        <Modal
          visible={showStoreModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowStoreModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Store</Text>
                <TouchableOpacity onPress={() => setShowStoreModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              {/* Map/List Toggle */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, showMap && styles.toggleButtonActive]}
                  onPress={() => setShowMap(true)}
                >
                  <Ionicons name="map" size={20} color={showMap ? COLORS.white : COLORS.text} />
                  <Text style={[styles.toggleText, showMap && styles.toggleTextActive]}>Map</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, !showMap && styles.toggleButtonActive]}
                  onPress={() => setShowMap(false)}
                >
                  <Ionicons name="list" size={20} color={!showMap ? COLORS.white : COLORS.text} />
                  <Text style={[styles.toggleText, !showMap && styles.toggleTextActive]}>List</Text>
                </TouchableOpacity>
              </View>

              {currentLocation && (
                <View style={styles.locationInfo}>
                  <Ionicons name="navigate" size={16} color={COLORS.success} />
                  <Text style={styles.locationText}>
                    Your Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              )}

              {/* Map View with Google Maps - Shared state */}
              {showMap && currentLocation && (
                <View style={styles.mapContainer}>
                  <MapView
                    ref={localMapRef}
                    style={styles.map}
                    region={region}
                    onRegionChangeComplete={onRegionChangeComplete}
                    onMapReady={handleMapReady}
                  >
                    {/* Current Location Marker */}
                    <Marker
                      coordinate={{
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude,
                      }}
                      title="Your Location"
                      pinColor={COLORS.primary}
                    >
                      <View style={styles.currentLocationMarker}>
                        <Ionicons name="person" size={20} color={COLORS.white} />
                      </View>
                    </Marker>

                    {/* 100km Radius Circle */}
                    <Circle
                      center={{
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude,
                      }}
                      radius={100000}
                      fillColor="rgba(59, 130, 246, 0.2)"
                      strokeColor={COLORS.primary}
                      strokeWidth={2}
                    />

                    {/* Store Markers */}
                    {stores.map((store) => {
                      const storeLocation = typeof store.location === 'string' 
                        ? JSON.parse(store.location) 
                        : store.location;
                      
                      if (!storeLocation.latitude || !storeLocation.longitude) return null;

                      const distance = calculateDistance(
                        currentLocation.latitude,
                        currentLocation.longitude,
                        parseFloat(storeLocation.latitude),
                        parseFloat(storeLocation.longitude)
                      );

                      const isNearby = distance <= 100000;

                      return (
                        <Marker
                          key={store.id}
                          coordinate={{
                            latitude: parseFloat(storeLocation.latitude),
                            longitude: parseFloat(storeLocation.longitude),
                          }}
                          title={store.store_name}
                          description={`${Math.round(distance)}m away`}
                          onPress={() => {
                            setShowMap(false);
                            // Optionally scroll to this store in the list
                          }}
                        >
                          <View style={[
                            styles.storeMarker,
                            { backgroundColor: isNearby ? COLORS.success : COLORS.warning }
                          ]}>
                            <Ionicons name="storefront" size={20} color={COLORS.white} />
                          </View>
                        </Marker>
                      );
                    })}
                  </MapView>

                  {/* Zoom Controls */}
                  <View style={styles.zoomControls}>
                    <TouchableOpacity
                      style={styles.zoomButton}
                      onPress={zoomIn}
                    >
                      <Ionicons name="add" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <View style={styles.zoomDivider} />
                    <TouchableOpacity
                      style={styles.zoomButton}
                      onPress={zoomOut}
                    >
                      <Ionicons name="remove" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.centerButton}
                    onPress={() => fitMapToMarkersWithStores(stores)}
                  >
                    <Ionicons name="locate" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}

              {/* List View */}
              {!showMap && (
                <FlatList
                data={stores}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
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

                  // Get task type icons and colors
                  const taskTypeConfig = {
                    'OSA': { icon: 'checkmark-circle', color: COLORS.module1, label: 'OSA' },
                    'SPECIAL_DISPLAY': { icon: 'images', color: COLORS.module2, label: 'Display' },
                    'SURVEY': { icon: 'document-text', color: COLORS.module3, label: 'Survey' },
                  };

                  return (
                    <TouchableOpacity
                      style={styles.storeItem}
                      onPress={() => handleCheckIn(item)}
                      disabled={isCheckingIn}
                    >
                      <View style={styles.storeInfo}>
                        <Text style={styles.storeName}>{item.store_name}</Text>
                        
                        {/* Task Type Badges */}
                        {item.tasks && item.tasks.length > 0 && (
                          <View style={styles.taskBadgesContainer}>
                            {item.tasks.map((task, index) => {
                              const config = taskTypeConfig[task.type];
                              if (!config) return null;
                              return (
                                <View key={index} style={[styles.taskBadge, { backgroundColor: config.color + '20' }]}>
                                  <Ionicons name={config.icon} size={12} color={config.color} />
                                  <Text style={[styles.taskBadgeText, { color: config.color }]}>
                                    {config.label}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        )}
                        
                        {distance !== null && (
                          <View style={styles.distanceContainer}>
                            <Ionicons 
                              name={distance <= 100000 ? "checkmark-circle" : "alert-circle"} 
                              size={16} 
                              color={distance <= 100000 ? COLORS.success : COLORS.warning} 
                            />
                            <Text style={[
                              styles.distanceText,
                              { color: distance <= 100000 ? COLORS.success : COLORS.warning }
                            ]}>
                              {distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`} away
                            </Text>
                          </View>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>{THAI.noTasksToday}</Text>
                    <Text style={styles.emptySubtext}>{THAI.waitingForAssignment}</Text>
                  </View>
                }
                />
              )}

              {isCheckingIn && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Checking in...</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <View style={styles.container}>
      {/* Session Status Card */}
      <View style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionHeaderLeft}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.sessionTitle}>Checked In</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: COLORS.successLight }]}>
            <Text style={[styles.statusBadgeText, { color: COLORS.success }]}>Active</Text>
          </View>
        </View>

        <View style={styles.sessionDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="storefront" size={16} color={COLORS.textMuted} />
            <Text style={styles.detailLabel}>Store:</Text>
            <Text style={styles.detailValue}>{currentVisit.store_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={16} color={COLORS.textMuted} />
            <Text style={styles.detailLabel}>PC:</Text>
            <Text style={styles.detailValue}>{currentVisit.pc_name || 'You'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color={COLORS.textMuted} />
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>
              {new Date(currentVisit.check_in_time).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color={COLORS.textMuted} />
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(currentVisit.check_in_time).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </Text>
          </View>
        </View>

        {/* Task Progress */}
        {stats && (
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>{THAI.taskProgress}</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(stats.completedRequired / stats.totalRequired) * 100}%`,
                    backgroundColor: stats.canCheckOut ? COLORS.success : COLORS.primary
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {stats.completedRequired} of {stats.totalRequired} required tasks completed
            </Text>
          </View>
        )}

        {/* Check-Out Button */}
        <TouchableOpacity
          style={[
            styles.checkOutButton,
            (!stats?.canCheckOut || isCheckingOut) && styles.checkOutButtonDisabled
          ]}
          onPress={handleCheckOut}
          disabled={!stats?.canCheckOut || isCheckingOut}
        >
          {isCheckingOut ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
              <Text style={styles.checkOutButtonText}>
                {stats?.canCheckOut ? THAI.checkOutFromStore : THAI.checkOutDescription}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Check-In Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelCheckIn}
          disabled={isCheckingOut}
        >
          <Ionicons name="close-circle-outline" size={20} color={COLORS.error} />
          <Text style={styles.cancelButtonText}>{THAI.wrongStoreQuestion}</Text>
        </TouchableOpacity>
      </View>

      {/* Task Checklist */}
      {tasks && tasks.length > 0 && (
        <View style={styles.taskChecklistCard}>
          <Text style={styles.checklistTitle}>Task Checklist</Text>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <View style={styles.taskLeft}>
                <Ionicons 
                  name={task.status === 'COMPLETED' ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={24} 
                  color={task.status === 'COMPLETED' ? COLORS.success : COLORS.textMuted} 
                />
                <View style={styles.taskInfo}>
                  <Text style={styles.taskName}>{task.task_type}</Text>
                  {task.is_required && (
                    <Text style={styles.requiredBadge}>Required</Text>
                  )}
                </View>
              </View>
              <View style={[
                styles.taskStatusBadge,
                { backgroundColor: getTaskStatusColor(task.status) }
              ]}>
                <Text style={styles.taskStatusText}>{task.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function getTaskStatusColor(status) {
  switch (status) {
    case 'COMPLETED': return COLORS.successLight;
    case 'IN_PROGRESS': return COLORS.warningLight;
    case 'PENDING': return COLORS.borderLight;
    default: return COLORS.borderLight;
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  notCheckedInCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
  },
  notCheckedInText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  notCheckedInSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  checkInButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  checkInButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: COLORS.successLight,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  storeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  taskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  mapContainer: {
    height: 400,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  currentLocationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  storeMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  zoomButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  zoomDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  centerButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sessionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    width: 60,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  checkOutButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 8,
  },
  checkOutButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  checkOutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: COLORS.white,
    marginTop: 12,
  },
  cancelButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  taskChecklistCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  requiredBadge: {
    fontSize: 11,
    color: COLORS.error,
    fontWeight: '500',
  },
  taskStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
});
