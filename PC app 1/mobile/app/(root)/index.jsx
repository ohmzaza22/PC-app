import { useUser, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View, StyleSheet, Dimensions, Platform } from "react-native";
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
import { setAuthToken, storeVisitAPI } from "../../lib/api";
import { COLORS } from "../../constants/colors";
import { useStaggeredFade, usePressAnimation, useFadeIn } from "../../hooks/useAnimations";

const { width } = Dimensions.get('window');

export default function Page() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const mapRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskStats, setTaskStats] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  const { user: dbUser, userRole, initUser, refreshUser, isLoading } = useAuthStore();
  const { fetchStores, stores } = useStoreStore();

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

  // Load stores and current visit after user is initialized
  useEffect(() => {
    if (dbUser && userRole) {
      const storeId = userRole === 'PC' ? dbUser.id : null;
      fetchStores(storeId).catch(err => console.error('Error loading stores:', err));
      
      // Fetch current visit for PC users
      if (userRole === 'PC') {
        fetchCurrentVisit();
        getCurrentLocation();
      }
    }
  }, [dbUser, userRole]);

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

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Fit map to show all markers after getting location
      setTimeout(() => {
        fitMapToMarkers();
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

  const fitMapToMarkers = () => {
    if (!mapRef.current || !currentLocation || !stores || stores.length === 0) return;

    const markers = stores
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
      mapRef.current.fitToCoordinates(markers, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
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
        await fetchStores(userRole === 'PC' ? dbUser.id : null);
        
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
      title: 'On-Shelf Availability',
      subtitle: 'Check stock & availability',
      icon: 'checkmark-circle',
      color: COLORS.module1,
      route: '/osa',
    },
    {
      id: 'display',
      title: 'Special Display',
      subtitle: 'Record display setups',
      icon: 'images',
      color: COLORS.module2,
      route: '/display',
    },
    {
      id: 'survey',
      title: 'Market Information',
      subtitle: 'Submit field surveys',
      icon: 'document-text',
      color: COLORS.module3,
      route: '/survey',
    },
    {
      id: 'promotion',
      title: 'Promotions',
      subtitle: 'View active promotions',
      icon: 'megaphone',
      color: COLORS.module4,
      route: '/promotions',
    },
  ], []);

  const supervisorModules = useMemo(() => [
    {
      id: 'mc-dashboard',
      title: 'MC Dashboard',
      subtitle: 'Review pending tasks',
      icon: 'stats-chart',
      color: COLORS.primary,
      route: '/mc-dashboard',
      featured: true,
    },
    {
      id: 'review-tasks',
      title: 'Review Tasks',
      subtitle: 'Approve or reject submissions',
      icon: 'checkmark-done',
      color: COLORS.warning,
      route: '/review-tasks',
    },
    {
      id: 'visit-history',
      title: 'Visit History',
      subtitle: 'View PC check-ins',
      icon: 'time',
      color: COLORS.info,
      route: '/visit-history',
    },
  ], []);

  const adminModules = useMemo(() => [
    {
      id: 'stores',
      title: 'Manage Stores',
      subtitle: 'Add and assign stores',
      icon: 'storefront',
      color: COLORS.primary,
      route: '/admin-stores',
    },
    {
      id: 'users',
      title: 'Manage Users',
      subtitle: 'View and manage PCs',
      icon: 'people',
      color: COLORS.module2,
      route: '/admin-users',
    },
    {
      id: 'reports',
      title: 'View Reports',
      subtitle: 'OSA, Display, Survey data',
      icon: 'bar-chart',
      color: COLORS.module3,
      route: '/admin-reports',
    },
    {
      id: 'promotion',
      title: 'Upload Promotions',
      subtitle: 'Manage promotion PDFs',
      icon: 'cloud-upload',
      color: COLORS.module4,
      route: '/promotions',
    },
  ], []);

  const pcModulesWithRejected = useMemo(() => [
    ...pcModules,
    {
      id: 'rejected',
      title: 'Rejected Tasks',
      subtitle: 'Tasks needing correction',
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
              <Text style={styles.welcomeText}>Welcome,</Text>
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

        {/* MAP VIEW (PC Only - Native platforms only) */}
        {Platform.OS !== 'web' && userRole === 'PC' && currentLocation && stores && stores.length > 0 && (
          <View style={styles.mapSection}>
            <View style={styles.mapHeader}>
              <Text style={styles.mapTitle}>Store Locations</Text>
              <TouchableOpacity
                style={styles.centerMapButton}
                onPress={fitMapToMarkers}
              >
                <Ionicons name="locate" size={16} color={COLORS.primary} />
                <Text style={styles.centerMapText}>Center Map</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.5,
                  longitudeDelta: 0.5,
                }}
              >
                {/* Current Location Marker */}
                <Marker
                  coordinate={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                  }}
                  title="Your Location"
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
            </View>

            {/* Store Count Info */}
            <View style={styles.mapFooter}>
              <View style={styles.mapLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                  <Text style={styles.legendText}>Within 100km ({stores.filter(s => {
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
                  <Text style={styles.legendText}>Beyond 100km</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* MODULE CARDS */}
        <View style={styles.modulesContainer}>
          <Text style={styles.sectionTitle}>Field Operations</Text>
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
