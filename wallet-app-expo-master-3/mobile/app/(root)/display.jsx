import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStoreStore } from '../../store/useStoreStore';
import { displayAPI } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';

export default function DisplayScreen() {
  const router = useRouter();
  const { stores, selectedStore, selectStore, fetchStores } = useStoreStore();
  const { user } = useAuthStore();
  const [photo, setPhoto] = useState(null);
  const [displayType, setDisplayType] = useState('');
  const [cost, setCost] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const displayTypes = [
    'End Cap Display',
    'Floor Stand',
    'Counter Display',
    'Window Display',
    'Shelf Talker',
    'Promotional Banner',
    'Other',
  ];

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

    if (!displayType) {
      Alert.alert('Error', 'Please select a display type');
      return;
    }

    if (!cost || isNaN(parseFloat(cost))) {
      Alert.alert('Error', 'Please enter a valid cost');
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
      formData.append('display_type', displayType);
      formData.append('cost', parseFloat(cost));
      formData.append('remarks', remarks);
      
      formData.append('photo', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'display-photo.jpg',
      });

      await displayAPI.create(formData);

      Alert.alert('Success', 'Display record submitted successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error submitting display:', error);
      Alert.alert('Error', 'Failed to submit display record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Special Display</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Store Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Store *</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowStorePicker(!showStorePicker)}
          >
            <Text style={styles.pickerText}>
              {selectedStore ? selectedStore.store_name : 'Select a store'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>

          {showStorePicker && (
            <View style={styles.pickerList}>
              {stores.map((store) => (
                <TouchableOpacity
                  key={store.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    selectStore(store);
                    setShowStorePicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{store.store_name}</Text>
                  {selectedStore?.id === store.id && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Display Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Display Type *</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowTypePicker(!showTypePicker)}
          >
            <Text style={styles.pickerText}>
              {displayType || 'Select display type'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>

          {showTypePicker && (
            <View style={styles.pickerList}>
              {displayTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.pickerItem}
                  onPress={() => {
                    setDisplayType(type);
                    setShowTypePicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{type}</Text>
                  {displayType === type && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Cost */}
        <View style={styles.section}>
          <Text style={styles.label}>Cost (THB) *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="cash-outline" size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="Enter cost"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              value={cost}
              onChangeText={setCost}
            />
          </View>
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
              <Ionicons name="images" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Submit Display Record</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerText: {
    fontSize: 16,
    color: '#111827',
  },
  pickerList: {
    marginTop: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    maxHeight: 200,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#111827',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
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
    backgroundColor: '#3B82F6',
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
