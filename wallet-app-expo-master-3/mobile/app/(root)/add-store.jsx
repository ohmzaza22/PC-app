import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { storeAPI, setAuthToken } from '../../lib/api';
import { COLORS } from '../../constants/colors';

const STORE_TYPES = [
  { label: 'Retail', value: 'RETAIL' },
  { label: 'Hospital', value: 'HOSPITAL' },
  { label: 'Pharmacy', value: 'PHARMACY' },
  { label: 'Supermarket', value: 'SUPERMARKET' },
  { label: 'Convenience Store', value: 'CONVENIENCE' },
  { label: 'Other', value: 'OTHER' },
];

export default function AddStoreScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const mapRef = useRef(null);

  // Form state
  const [storeName, setStoreName] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [storeType, setStoreType] = useState('RETAIL');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Map state
  const [markerCoordinate, setMarkerCoordinate] = useState(null);
  const [region, setRegion] = useState({
    latitude: 13.7563, // Bangkok default
    longitude: 100.5018,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);

  useEffect(() => {
    initializeAuth();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (autoGenerateCode && storeName) {
      generateStoreCode(storeName);
    }
  }, [storeName, autoGenerateCode]);

  const initializeAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        setAuthToken(token);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use the map feature.');
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const generateStoreCode = (name) => {
    const prefix = name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
    const random = Math.floor(1000 + Math.random() * 9000);
    setStoreCode(`${prefix}${random}`);
  };

  const handleUseCurrentLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions in settings.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      const newCoordinate = { latitude, longitude };

      setMarkerCoordinate(newCoordinate);
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses.length > 0) {
        const addr = addresses[0];
        const fullAddress = `${addr.street || ''} ${addr.district || ''} ${addr.subregion || ''} ${addr.city || ''}`.trim();
        setAddress(fullAddress);
        setProvince(addr.region || addr.city || '');
      }

      // Animate map to location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 1000);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleMapPress = async (event) => {
    const coordinate = event.nativeEvent.coordinate;
    setMarkerCoordinate(coordinate);

    // Reverse geocode to get address
    try {
      const addresses = await Location.reverseGeocodeAsync(coordinate);
      if (addresses.length > 0) {
        const addr = addresses[0];
        const fullAddress = `${addr.street || ''} ${addr.district || ''} ${addr.subregion || ''} ${addr.city || ''}`.trim();
        setAddress(fullAddress);
        setProvince(addr.region || addr.city || '');
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const validateForm = () => {
    if (!storeName.trim()) {
      Alert.alert('Validation Error', 'Store name is required');
      return false;
    }
    if (!storeCode.trim()) {
      Alert.alert('Validation Error', 'Store code is required');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Validation Error', 'Address is required');
      return false;
    }
    if (!markerCoordinate) {
      Alert.alert('Validation Error', 'Please select a location on the map');
      return false;
    }
    return true;
  };

  const handleSaveStore = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const storeData = {
        store_name: storeName,
        store_code: storeCode,
        location: {
          address,
          province,
          latitude: markerCoordinate.latitude,
          longitude: markerCoordinate.longitude,
        },
        store_type: storeType,
        contact_person: contactPerson || null,
        phone_number: phoneNumber || null,
        assigned_pc_id: null,
      };

      await storeAPI.create(storeData);
      
      Alert.alert('Success', 'Store added successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error saving store:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add store. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Store</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Store Information</Text>

          {/* Store Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Store Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter store name"
              placeholderTextColor={COLORS.textMuted}
              value={storeName}
              onChangeText={setStoreName}
            />
          </View>

          {/* Store Code */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                Store Code <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.autoToggle}
                onPress={() => setAutoGenerateCode(!autoGenerateCode)}
              >
                <Ionicons
                  name={autoGenerateCode ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={autoGenerateCode ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={styles.autoToggleText}>Auto-generate</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, autoGenerateCode && styles.inputDisabled]}
              placeholder="Store code"
              placeholderTextColor={COLORS.textMuted}
              value={storeCode}
              onChangeText={setStoreCode}
              editable={!autoGenerateCode}
            />
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Address <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter address"
              placeholderTextColor={COLORS.textMuted}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Province */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Province / City</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter province or city"
              placeholderTextColor={COLORS.textMuted}
              value={province}
              onChangeText={setProvince}
            />
          </View>

          {/* Store Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Type</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <Text style={styles.dropdownText}>
                {STORE_TYPES.find((t) => t.value === storeType)?.label || 'Select type'}
              </Text>
              <Ionicons
                name={showTypeDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
            {showTypeDropdown && (
              <View style={styles.dropdownMenu}>
                {STORE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setStoreType(type.value);
                      setShowTypeDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        storeType === type.value && styles.dropdownItemTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                    {storeType === type.value && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Contact Person */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Person</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter contact person name"
              placeholderTextColor={COLORS.textMuted}
              value={contactPerson}
              onChangeText={setContactPerson}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor={COLORS.textMuted}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Map Section */}
        <View style={styles.card}>
          <View style={styles.mapHeader}>
            <Text style={styles.sectionTitle}>📍 Pin Store on Map</Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleUseCurrentLocation}
              disabled={isFetchingLocation}
            >
              {isFetchingLocation ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="locate" size={18} color={COLORS.primary} />
                  <Text style={styles.locationButtonText}>Use Current</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              region={region}
              onRegionChangeComplete={setRegion}
              onPress={handleMapPress}
            >
              {markerCoordinate && (
                <Marker
                  coordinate={markerCoordinate}
                  title={storeName || 'Store Location'}
                  description={address}
                />
              )}
            </MapView>
          </View>

          {/* Location Info */}
          {markerCoordinate && (
            <View style={styles.locationInfo}>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Latitude:</Text>
                <Text style={styles.coordValue}>{markerCoordinate.latitude.toFixed(6)}</Text>
              </View>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Longitude:</Text>
                <Text style={styles.coordValue}>{markerCoordinate.longitude.toFixed(6)}</Text>
              </View>
            </View>
          )}

          <Text style={styles.mapHint}>
            💡 Tap on the map to place a marker at the store location
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSaveStore}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Save Store</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  autoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autoToggleText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  input: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
    color: COLORS.text,
  },
  inputDisabled: {
    backgroundColor: COLORS.borderLight,
    color: COLORS.textMuted,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.text,
  },
  dropdownMenu: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.text,
  },
  dropdownItemTextActive: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  map: {
    flex: 1,
  },
  locationInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    gap: 6,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  coordValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  mapHint: {
    marginTop: 12,
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
