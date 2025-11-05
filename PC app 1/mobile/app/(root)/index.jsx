import { useUser, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View, StyleSheet, Dimensions, Platform, ActivityIndicator } from "react-native";
import Animated from "react-native-reanimated";
import { SignOutButton } from "@/components/SignOutButton";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import PageLoader from "../../components/PageLoader";
import CheckInStatus from "../../components/CheckInStatus";
import MapView, { Marker, Circle } from "../../components/MapView";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/useAuthStore";
import { useStoreStore } from "../../store/useStoreStore";
import { useMapStore } from "../../store/useMapStore";
import { setAuthToken, storeVisitAPI, taskAPI } from "../../lib/api";
import { COLORS } from "../../constants/colors";
import { THAI } from "../../constants/thai";
import { useStaggeredFade, usePressAnimation, useFadeIn } from "../../hooks/useAnimations";

const { width } = Dimensions.get('window');

export default function Page() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const localMapRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskStats, setTaskStats] = useState(null);
  
  const { user: dbUser, userRole, initUser, refreshUser, isLoading } = useAuthStore();
  const { fetchStores, stores: allStores } = useStoreStore();
  const [displayStores, setDisplayStores] = useState([]);
  const { 
    region, 
    currentLocation, 
    setCurrentLocation, 
    setMapRef, 
    setMapReady,
    centerOnCurrentLocation,
    zoomIn,
    zoomOut,
    fitToMarkers,
    onRegionChangeComplete 
  } = useMapStore();

  // Initialize user once on mount
  useEffect(() => {
    const initializeUser = async () => {
      if (user) {
        try {
          const token = await getToken();
          await initUser(user, token);
        } catch (error) {
          console.error('Error initializing user:', error);
        }
      }
    };
    
    initializeUser();
  }, [user]);

  // Load stores based on user role
  const loadStores = async () => {
    try {
      if (userRole === 'PC') {
        // PC users: only show stores with assigned tasks
        try {
          const response = await taskAPI.getCheckinEligibility();
          const eligibleStores = response.data.eligibleStores || [];
          
          // Transform to match store structure
          const transformedStores = eligibleStores.map(es => ({
            id: es.storeId,
            store_name: es.storeName,
            location: es.location,
            tasks: es.tasks,
          }));
          
          setDisplayStores(transformedStores);
        } catch (error) {
          console.log('Task eligibility not available, loading all stores');
          await fetchStores(dbUser.id);
          setDisplayStores(allStores);
        }
      } else {
        // MC/Admin/Other: show all stores
        await fetchStores(null);
        setDisplayStores(allStores);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  // Load stores and current visit after user is initialized
  useEffect(() => {
    if (dbUser && userRole) {
      loadStores();
      
      // Get location for map display (all users)
      getCurrentLocation();
      
      // Fetch current visit for PC users only
      if (userRole === 'PC') {
        fetchCurrentVisit();
      }
    }
  }, [dbUser, userRole]);

  // Update displayStores when allStores changes (for non-PC users)
  useEffect(() => {
    if (userRole !== 'PC' && allStores.length > 0) {
      setDisplayStores(allStores);
    }
  }, [allStores, userRole]);

  // Fit map when displayStores changes
  useEffect(() => {
    if (displayStores.length > 0 && currentLocation) {
      setTimeout(() => {
        fitMapToMarkersWithStores();
      }, 500);
    }
  }, [displayStores, currentLocation]);

  // Sync local map ref with global store when map is mounted
  const handleMapReady = useCallback(() => {
    if (localMapRef.current) {
      setMapRef(localMapRef.current);
      setMapReady(true);
    }
  }, [setMapRef, setMapReady]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Update shared map store
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Fit map to show all markers after getting location
      setTimeout(() => {
        fitMapToMarkersWithStores();
      }, 500);
    } catch (error) {
      console.error('Error getting location:', error);
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

  const fitMapToMarkersWithStores = () => {
    if (!currentLocation || !displayStores || displayStores.length === 0) return;

    const markers = displayStores
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

  const fetchCurrentVisit = async () => {
    try {
      // Ensure we have a valid token before making the request
      const token = await getToken();
      if (!token) {
        console.log('No auth token available');
        return;
      }
      setAuthToken(token);
      
      const response = await storeVisitAPI.getCurrent();
      setCurrentVisit(response.data.visit);
      setTasks(response.data.tasks || []);
      setTaskStats(response.data.stats || null);
    } catch (error) {
      // Silently handle 403/404 errors (user not checked in or no permission)
      if (error.response?.status === 403 || error.response?.status === 404) {
        setCurrentVisit(null);
        setTasks([]);
        setTaskStats(null);
      } else {
        console.error('Error fetching current visit:', error);
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (dbUser) {
      try {
        // Get fresh token and refresh user data
        const token = await getToken();
        if (token) {
          setAuthToken(token);
        }
        await refreshUser();
        await loadStores();
        
        // Refresh current visit for PC users
        if (userRole === 'PC') {
          await fetchCurrentVisit();
        }
      } catch (error) {
        console.error('Error refreshing:', error);
      }
    }
    setRefreshing(false);
  }, [dbUser, userRole, getToken, refreshUser, fetchStores]);
  // Memoize module arrays to prevent recreation on every render
  const pcModules = useMemo(() => [
    {
      id: 'osa',
      title: THAI.osaFull,
      subtitle: THAI.osaDescription,
      icon: 'checkmark-circle',
      color: COLORS.module1,
      route: '/osa',
    },
    {
      id: 'display',
      title: THAI.displayFull,
      subtitle: THAI.displayDescription,
      icon: 'images',
      color: COLORS.module2,
      route: '/display',
    },
    {
      id: 'survey',
      title: THAI.surveyFull,
      subtitle: THAI.surveyDescription,
      icon: 'document-text',
      color: COLORS.module3,
      route: '/survey',
    },
    {
      id: 'promotion',
      title: THAI.promotionFull,
      subtitle: THAI.promotionDescription,
      icon: 'megaphone',
      color: COLORS.module4,
      route: '/promotions',
    },
  ], []);

  const supervisorModules = useMemo(() => [
    {
      id: 'assign-task',
      title: 'มอบหมายงาน',
      subtitle: 'มอบหมายงาน OSA, Special Display และ Market Information ให้ PC',
      icon: 'clipboard',
      color: COLORS.primary,
      route: '/assign-task',
      featured: true,
    },
    {
      id: 'task-assignments',
      title: 'รายการที่มอบหมายงาน',
      subtitle: 'ดูประวัติและรายละเอียดงานที่มอบหมายไปแล้ว',
      icon: 'briefcase',
      color: COLORS.module2,
      route: '/task-assignments',
    },
  ], []);

  const adminModules = useMemo(() => [
    {
      id: 'stores',
      title: THAI.manageStores,
      subtitle: THAI.addAssignStores,
      icon: 'storefront',
      color: COLORS.primary,
      route: '/admin-stores',
    },
    {
      id: 'users',
      title: THAI.manageUsers,
      subtitle: THAI.viewManagePCs,
      icon: 'people',
      color: COLORS.module2,
      route: '/admin-users',
    },
    {
      id: 'reports',
      title: THAI.viewReports,
      subtitle: THAI.osaDisplaySurveyData,
      icon: 'bar-chart',
      color: COLORS.module3,
      route: '/admin-reports',
    },
    {
      id: 'promotion',
      title: THAI.uploadPromotions,
      subtitle: THAI.managePromotionPDFs,
      icon: 'cloud-upload',
      color: COLORS.module4,
      route: '/promotions',
    },
  ], []);

  const pcModulesWithRejected = useMemo(() => [
    ...pcModules,
    {
      id: 'rejected',
      title: THAI.rejectedTasks,
      subtitle: THAI.tasksNeedingCorrection,
      icon: 'alert-circle',
      color: COLORS.error,
      route: '/rejected-tasks',
    },
  ], [pcModules]);

  // Memoize module selection
  const modules = useMemo(() => {
    switch (userRole) {
      case 'ADMIN':
        return adminModules;
      case 'SUPERVISOR':
        return supervisorModules;
      case 'SALES':
      case 'VENDOR':
        return [adminModules[3]]; // Only promotions
      case 'PC':
        return pcModulesWithRejected;
      default:
        return pcModules;
    }
  }, [userRole, adminModules, supervisorModules, pcModulesWithRejected, pcModules]);

  if (isLoading) return <PageLoader />;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>{THAI.welcome},</Text>
              <Text style={styles.usernameText}>
                {user?.firstName || user?.emailAddresses[0]?.emailAddress.split("@")[0]}
              </Text>
              <Text style={styles.roleText}>{userRole || 'PC'}</Text>
            </View>
          </View>
          <SignOutButton />
        </View>

        {/* ROLE BADGE */}
        <View style={styles.roleBadgeContainer}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(userRole) }]}>
            <Ionicons name="person" size={16} color="#FFF" />
            <Text style={styles.roleBadgeText}>{userRole || 'PC'} Dashboard</Text>
          </View>
        </View>

        {/* CHECK-IN STATUS (PC Only) */}
        {userRole === 'PC' && (
          <CheckInStatus 
            currentVisit={currentVisit}
            tasks={tasks}
            stats={taskStats}
            onRefresh={fetchCurrentVisit}
          />
        )}

        {/* TASK INFO BANNER (PC Only) */}
        {userRole === 'PC' && (
          <View style={styles.taskInfoBanner}>
            <Ionicons name="information-circle" size={18} color={COLORS.info} />
            <Text style={styles.taskInfoText}>{THAI.tasksShownForToday}</Text>
          </View>
        )}

        {/* MAP VIEW - Always visible with Google Maps */}
        <View style={styles.mapSection}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>{THAI.storeLocations}</Text>
            <View style={styles.mapControls}>
              <TouchableOpacity
                style={styles.centerMapButton}
                onPress={centerOnCurrentLocation}
              >
                <Ionicons name="locate" size={16} color={COLORS.primary} />
                <Text style={styles.centerMapText}>{THAI.centerMap}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.mapContainer}>
            {currentLocation ? (
              <MapView
                key="main-map"
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
                  title={THAI.yourLocation}
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
                  fillColor="rgba(59, 130, 246, 0.1)"
                  strokeColor={COLORS.primary}
                  strokeWidth={1}
                />

                {/* Store Markers */}
                {displayStores.map((store) => {
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
                  const distanceText = distance < 1000 
                    ? `${Math.round(distance)}m` 
                    : `${(distance / 1000).toFixed(1)}km`;

                  return (
                    <Marker
                      key={store.id}
                      coordinate={{
                        latitude: parseFloat(storeLocation.latitude),
                        longitude: parseFloat(storeLocation.longitude),
                      }}
                      title={store.store_name}
                      description={`${distanceText} away`}
                      onPress={() => {
                        // Optional: Navigate to store details or check-in
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
            ) : (
              <View style={[styles.map, styles.mapPlaceholder]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.mapPlaceholderText}>{THAI.loading}</Text>
              </View>
            )}
            
            {/* Zoom Controls */}
            {currentLocation && (
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
            )}
          </View>

          {/* Store Count Info */}
          {currentLocation && (
            <View style={styles.mapFooter}>
              <View style={styles.mapLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                  <Text style={styles.legendText}>{THAI.within100km} ({displayStores.filter(s => {
                    const loc = typeof s.location === 'string' ? JSON.parse(s.location) : s.location;
                    if (!loc.latitude || !loc.longitude) return false;
                    const dist = calculateDistance(
                      currentLocation.latitude,
                      currentLocation.longitude,
                      parseFloat(loc.latitude),
                      parseFloat(loc.longitude)
                    );
                    return dist <= 100000;
                  }).length})</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
                  <Text style={styles.legendText}>{THAI.beyond100km}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* MODULE CARDS */}
        <View style={styles.modulesContainer}>
          <Text style={styles.sectionTitle}>{THAI.fieldOperations}</Text>
          <View style={styles.moduleGrid}>
            {modules.map((module, index) => (
              <ModuleCard
                key={module.id}
                module={module}
                index={index}
                onPress={() => router.push(module.route)}
              />
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// Animated Module Card Component with micro-interactions
function ModuleCard({ module, index, onPress }) {
  const staggeredStyle = useStaggeredFade(index, 80);
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.96);

  return (
    <Animated.View style={[styles.moduleCardWrapper, staggeredStyle]}>
      <Animated.View style={[animatedStyle]}>
        <TouchableOpacity
          style={styles.moduleCard}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={0.9}
        >
          <View style={[styles.moduleIconContainer, { backgroundColor: module.color }]}>
            <Ionicons name={module.icon} size={32} color="#FFF" />
          </View>
          <Text style={styles.moduleTitle}>{module.title}</Text>
          <Text style={styles.moduleSubtitle}>{module.subtitle}</Text>
          <View style={styles.moduleArrow}>
            <Ionicons name="arrow-forward" size={20} color={module.color} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

function getRoleColor(role) {
  switch (role) {
    case 'ADMIN': return COLORS.primaryDark;
    case 'SUPERVISOR': return COLORS.primary;
    case 'SALES': return COLORS.primaryLight;
    case 'VENDOR': return COLORS.primaryLighter;
    default: return COLORS.primary;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: -20,
    marginTop: -20,
    paddingTop: 36,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeContainer: {
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.border,
  },
  usernameText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  roleText: {
    fontSize: 12,
    color: COLORS.border,
    marginTop: 2,
  },
  roleBadgeContainer: {
    marginBottom: 24,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  roleBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  taskInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: COLORS.infoLight || '#E3F2FD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  taskInfoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.info,
    fontWeight: '500',
  },
  mapSection: {
    marginBottom: 24,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  mapControls: {
    flexDirection: 'row',
    gap: 8,
  },
  centerMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  centerMapText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mapContainer: {
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
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
  map: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  mapPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
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
  mapFooter: {
    marginTop: 12,
  },
  mapLegend: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  modulesContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    rowGap: 20, // Increased vertical spacing between rows
  },
  moduleCardWrapper: {
    width: '47%',
    aspectRatio: 0.85, // Make cards taller (width:height ratio)
  },
  moduleCard: {
    width: '100%',
    height: '100%', // Fill the wrapper completely
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  moduleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 22,
  },
  moduleSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 12,
    lineHeight: 18,
    minHeight: 36, // Reserve space for 2 lines of text
  },
  moduleArrow: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});
