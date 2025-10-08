import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { storeAPI } from '../../lib/api';
import { setAuthToken } from '../../lib/api';
import { COLORS } from '../../constants/colors';

export default function AdminStoresScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [stores, setStores] = useState([]);
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    initializeAndFetch();
  }, []);

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

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const response = await storeAPI.getAll();
      setStores(response.data);
    } catch (error) {
      console.error('Error fetching stores:', error);
      Alert.alert('Error', 'Failed to load stores');
    } finally {
      setIsLoading(false);
    }
  };

  const addStore = async () => {
    if (!storeName.trim()) {
      Alert.alert('Error', 'Please enter a store name');
      return;
    }

    setIsAdding(true);
    try {
      await storeAPI.create({
        store_name: storeName,
        location: { address: storeAddress || 'To be updated' },
        assigned_pc_id: null
      });
      
      Alert.alert('Success', 'Store added successfully');
      setStoreName('');
      setStoreAddress('');
      fetchStores();
    } catch (error) {
      Alert.alert('Error', 'Failed to add store');
    } finally {
      setIsAdding(false);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Stores</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.addSection}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Store name *"
            placeholderTextColor={COLORS.textMuted}
            value={storeName}
            onChangeText={setStoreName}
          />
          <TextInput
            style={styles.input}
            placeholder="Address (optional)"
            placeholderTextColor={COLORS.textMuted}
            value={storeAddress}
            onChangeText={setStoreAddress}
          />
        </View>
        <TouchableOpacity 
          style={[styles.addButton, isAdding && styles.addButtonDisabled]} 
          onPress={addStore}
          disabled={isAdding}
        >
          {isAdding ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Ionicons name="add" size={24} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.storeItem}>
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
                onPress={() => deleteStore(item.id, item.store_name)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No stores yet</Text>
              <Text style={styles.emptySubtext}>Add your first store above</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  addSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  inputContainer: { flex: 1, gap: 8 },
  input: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  addButtonDisabled: { backgroundColor: COLORS.textMuted },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
