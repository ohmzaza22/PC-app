import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useStoreStore } from '../../store/useStoreStore';
import { useAuthStore } from '../../store/useAuthStore';
import { osaAPI } from '../../lib/api';

export default function OSAScreen() {
  const router = useRouter();
  const { stores, selectedStore, selectStore, fetchStores } = useStoreStore();
  const { user } = useAuthStore();

  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Predefined product list
  const availableProducts = [
    'Coca-Cola 325ml',
    'Pepsi 325ml',
    'Sprite 325ml',
    'Fanta 325ml',
    'Water 600ml',
    'Energy Drink',
    'Juice Box',
    'Iced Tea',
  ];

  useEffect(() => {
    requestLocationPermission();
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      await fetchStores();
    } catch (error) {
      console.error('Error loading stores:', error);
      Alert.alert('Error', 'Failed to load stores');
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStore) {
      Alert.alert('Error', 'Please select a store');
      return;
    }

    if (!photo) {
      Alert.alert('Error', 'Please take a photo');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('store_id', selectedStore.id);
      formData.append('remarks', remarks);
      formData.append('availability', JSON.stringify(availability));
      
      formData.append('photo', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'osa-photo.jpg',
      });

      await osaAPI.create(formData);

      Alert.alert('Success', 'OSA record submitted successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error submitting OSA:', error);
      Alert.alert('Error', 'Failed to submit OSA record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <PageHeader title="On-Shelf Availability" />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
        {/* Store Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Store *</Text>
          <TouchableOpacity
            style={styles.storePicker}
            onPress={() => setShowStorePicker(!showStorePicker)}
          >
            <Text style={styles.storePickerText}>
              {selectedStore ? selectedStore.store_name : 'Select a store'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>

          {showStorePicker && (
            <View style={styles.storeList}>
              {stores.map((store) => (
                <TouchableOpacity
                  key={store.id}
                  style={styles.storeItem}
                  onPress={() => {
                    selectStore(store);
                    setShowStorePicker(false);
                  }}
                >
                  <Text style={styles.storeItemText}>{store.store_name}</Text>
                  {selectedStore?.id === store.id && (
                    <Ionicons name="checkmark" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Location Check-in */}
        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.locationBox}>
            <Ionicons name="location" size={20} color={location ? '#10B981' : '#6B7280'} />
            <Text style={styles.locationText}>
              {location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 'Getting location...'}
            </Text>
          </View>
          
          {/* Map Display */}
          {location && (
            <View style={styles.mapContainer}>
              <Text style={styles.mapTitle}>
                {selectedStore ? `Store: ${selectedStore.store_name}` : 'Your Location'}
              </Text>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: selectedStore && selectedStore.location 
                    ? (typeof selectedStore.location === 'string' 
                      ? JSON.parse(selectedStore.location).latitude 
                      : selectedStore.location.latitude)
                    : location.latitude,
                  longitude: selectedStore && selectedStore.location
                    ? (typeof selectedStore.location === 'string'
                      ? JSON.parse(selectedStore.location).longitude
                      : selectedStore.location.longitude)
                    : location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                {/* PC's Current Location */}
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="Your Location"
                  description="You are here"
                >
                  <View style={styles.currentLocationMarker}>
                    <Ionicons name="person" size={20} color="#FFF" />
                  </View>
                </Marker>

                {/* Selected Store Location */}
                {selectedStore && selectedStore.location && (() => {
                  const storeLocation = typeof selectedStore.location === 'string'
                    ? JSON.parse(selectedStore.location)
                    : selectedStore.location;
                  
                  if (storeLocation.latitude && storeLocation.longitude) {
                    return (
                      <Marker
                        coordinate={{
                          latitude: parseFloat(storeLocation.latitude),
                          longitude: parseFloat(storeLocation.longitude),
                        }}
                        title={selectedStore.store_name}
                        description="Store Location"
                      >
                        <View style={styles.storeMarker}>
                          <Ionicons name="storefront" size={20} color="#FFF" />
                        </View>
                      </Marker>
                    );
                  }
                  return null;
                })()}
              </MapView>
            </View>
          )}
        </View>

        {/* Photo Upload */}
        <View style={styles.section}>
          <Text style={styles.label}>Photo *</Text>
          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={48} color="#9CA3AF" />
                <Text style={styles.photoPlaceholderText}>Take Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Availability Checklist */}
        <View style={styles.section}>
          <Text style={styles.label}>Stock Status</Text>
          <View style={styles.checklistContainer}>
            <TouchableOpacity
              style={styles.checklistItem}
              onPress={() => setAvailability({ ...availability, inStock: !availability.inStock })}
            >
              <View style={[styles.checkbox, availability.inStock && styles.checkboxChecked]}>
                {availability.inStock && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
              <Text style={styles.checklistText}>Product In Stock</Text>
            </TouchableOpacity>

            <View style={styles.stockLevelContainer}>
              <Text style={styles.stockLevelLabel}>Stock Level:</Text>
              {['full', 'medium', 'low'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.stockLevelButton,
                    availability.stockLevel === level && styles.stockLevelButtonActive
                  ]}
                  onPress={() => setAvailability({ ...availability, stockLevel: level })}
                >
                  <Text style={[
                    styles.stockLevelButtonText,
                    availability.stockLevel === level && styles.stockLevelButtonTextActive
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Remarks */}
        <View style={styles.section}>
          <Text style={styles.label}>Remarks</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Add any additional notes..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={remarks}
            onChangeText={setRemarks}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Submit OSA Record</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  storePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  storePickerText: {
    fontSize: 16,
    color: '#111827',
  },
  storeList: {
    marginTop: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  storeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  storeItemText: {
    fontSize: 16,
    color: '#111827',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  mapContainer: {
    marginTop: 12,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  map: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currentLocationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
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
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  photoButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  checklistContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checklistText: {
    fontSize: 16,
    color: '#111827',
  },
  stockLevelContainer: {
    marginTop: 8,
  },
  stockLevelLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  stockLevelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  stockLevelButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stockLevelButtonText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  stockLevelButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
