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

  const addProduct = (productName) => {
    const newProduct = {
      id: Date.now().toString(),
      name: productName,
      quantity: '',
      stockLevel: 'Full',
      remarks: '',
    };
    setProducts([...products, newProduct]);
    setShowAddProduct(false);
  };

  const removeProduct = (productId) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const updateProduct = (productId, field, value) => {
    setProducts(products.map(p => 
      p.id === productId ? { ...p, [field]: value } : p
    ));
  };

  const handleSubmit = async () => {
    if (!selectedStore) {
      Alert.alert('Error', 'Please select a store');
      return;
    }

    if (products.length === 0) {
      Alert.alert('Error', 'Please add at least one product');
      return;
    }

    if (!photo) {
      Alert.alert('Error', 'Please take a photo');
      return;
    }

    // Validate all products have quantity
    const missingQty = products.some(p => !p.quantity || p.quantity === '0');
    if (missingQty) {
      Alert.alert('Error', 'Please enter quantity for all products');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('store_id', selectedStore.id);
      formData.append('remarks', remarks);
      formData.append('products', JSON.stringify(products));
      
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

        {/* Products List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Products *</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddProduct(true)}
            >
              <Ionicons name="add-circle" size={24} color="#3B82F6" />
              <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>

          {products.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No products added yet</Text>
              <Text style={styles.emptySubtext}>Tap "Add Product" to start</Text>
            </View>
          ) : (
            products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <TouchableOpacity onPress={() => removeProduct(product.id)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.productRow}>
                  <View style={styles.productInputGroup}>
                    <Text style={styles.productLabel}>Quantity</Text>
                    <TextInput
                      style={styles.productInput}
                      placeholder="0"
                      keyboardType="numeric"
                      value={product.quantity}
                      onChangeText={(text) => updateProduct(product.id, 'quantity', text)}
                    />
                  </View>

                  <View style={styles.productInputGroup}>
                    <Text style={styles.productLabel}>Stock Level</Text>
                    <View style={styles.dropdownContainer}>
                      {['Full', 'Medium', 'Low'].map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.dropdownButton,
                            product.stockLevel === level && styles.dropdownButtonActive
                          ]}
                          onPress={() => updateProduct(product.id, 'stockLevel', level)}
                        >
                          <Text style={[
                            styles.dropdownText,
                            product.stockLevel === level && styles.dropdownTextActive
                          ]}>
                            {level}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.productInputGroup}>
                  <Text style={styles.productLabel}>Remarks (Optional)</Text>
                  <TextInput
                    style={styles.productTextInput}
                    placeholder="Add notes for this product..."
                    placeholderTextColor="#9CA3AF"
                    value={product.remarks}
                    onChangeText={(text) => updateProduct(product.id, 'remarks', text)}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Product Selection Modal */}
        {showAddProduct && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Product</Text>
                <TouchableOpacity onPress={() => setShowAddProduct(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.productList}>
                {availableProducts.map((productName) => (
                  <TouchableOpacity
                    key={productName}
                    style={styles.productOption}
                    onPress={() => addProduct(productName)}
                  >
                    <Ionicons name="cube" size={20} color="#3B82F6" />
                    <Text style={styles.productOptionText}>{productName}</Text>
                    <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyProducts: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  productCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  productRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  productInputGroup: {
    flex: 1,
  },
  productLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  productInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  productTextInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  dropdownContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dropdownButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  dropdownButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  dropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dropdownTextActive: {
    color: '#FFF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  productList: {
    maxHeight: 400,
  },
  productOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  productOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
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
