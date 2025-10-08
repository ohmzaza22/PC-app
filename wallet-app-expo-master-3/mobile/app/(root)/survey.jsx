
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStoreStore } from '../../store/useStoreStore';
import { surveyAPI } from '../../lib/api';

export default function SurveyScreen() {
  const router = useRouter();
  const { stores, selectedStore, selectStore } = useStoreStore();

  const [photo, setPhoto] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [surveyData, setSurveyData] = useState({
    competitorActivity: '',
    promotionStatus: '',
    standSetup: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const surveyTemplates = [
    'DMS Check',
    'Competitor Promotion',
    'Stand Setup Verification',
    'Market Price Survey',
    'Customer Feedback',
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

    if (!templateName) {
      Alert.alert('Error', 'Please select a survey template');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('store_id', selectedStore.id);
      formData.append('template_name', templateName);
      formData.append('data', JSON.stringify(surveyData));
      
      if (photo) {
        formData.append('photo', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: 'survey-photo.jpg',
        });
      }

      await surveyAPI.create(formData);

      Alert.alert('Success', 'Survey submitted successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error submitting survey:', error);
      Alert.alert('Error', 'Failed to submit survey. Please try again.');
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
        <Text style={styles.headerTitle}>Market Information</Text>
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
                    <Ionicons name="checkmark" size={20} color="#F59E0B" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Survey Template */}
        <View style={styles.section}>
          <Text style={styles.label}>Survey Type *</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowTemplatePicker(!showTemplatePicker)}
          >
            <Text style={styles.pickerText}>
              {templateName || 'Select survey type'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>

          {showTemplatePicker && (
            <View style={styles.pickerList}>
              {surveyTemplates.map((template) => (
                <TouchableOpacity
                  key={template}
                  style={styles.pickerItem}
                  onPress={() => {
                    setTemplateName(template);
                    setShowTemplatePicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{template}</Text>
                  {templateName === template && (
                    <Ionicons name="checkmark" size={20} color="#F59E0B" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Survey Fields */}
        <View style={styles.section}>
          <Text style={styles.label}>Competitor Activity</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe competitor activities..."
            placeholderTextColor="#9CA3AF"
            value={surveyData.competitorActivity}
            onChangeText={(text) => setSurveyData({ ...surveyData, competitorActivity: text })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Promotion Status</Text>
          <TextInput
            style={styles.input}
            placeholder="Current promotion status..."
            placeholderTextColor="#9CA3AF"
            value={surveyData.promotionStatus}
            onChangeText={(text) => setSurveyData({ ...surveyData, promotionStatus: text })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Stand Setup</Text>
          <TextInput
            style={styles.input}
            placeholder="Stand setup details..."
            placeholderTextColor="#9CA3AF"
            value={surveyData.standSetup}
            onChangeText={(text) => setSurveyData({ ...surveyData, standSetup: text })}
          />
        </View>

        {/* Photo Upload */}
        <View style={styles.section}>
          <Text style={styles.label}>Photo (Optional)</Text>
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

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Add any additional notes..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={surveyData.notes}
            onChangeText={(text) => setSurveyData({ ...surveyData, notes: text })}
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
              <Ionicons name="document-text" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Submit Survey</Text>
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
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    backgroundColor: '#F59E0B',
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
