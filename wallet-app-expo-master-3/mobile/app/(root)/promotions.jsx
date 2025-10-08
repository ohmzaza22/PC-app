import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { promotionAPI } from '../../lib/api';

export default function PromotionsScreen() {
  const router = useRouter();
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showActive, setShowActive] = useState(true);

  useEffect(() => {
    fetchPromotions();
  }, [showActive]);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const response = await promotionAPI.getAll(showActive);
      setPromotions(response.data);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPromotions();
    setRefreshing(false);
  };

  const openPromotion = (pdfUrl) => {
    if (pdfUrl) {
      Linking.openURL(pdfUrl);
    }
  };

  const renderPromotion = ({ item }) => {
    const isActive = new Date(item.valid_to) >= new Date();
    
    return (
      <TouchableOpacity
        style={styles.promotionCard}
        onPress={() => openPromotion(item.pdf_url)}
        activeOpacity={0.7}
      >
        <View style={styles.promotionHeader}>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#10B981' : '#9CA3AF' }]}>
            <Text style={styles.statusText}>{isActive ? 'Active' : 'Expired'}</Text>
          </View>
          <Ionicons name="document-text" size={24} color="#EF4444" />
        </View>

        <Text style={styles.promotionTitle}>{item.title}</Text>

        <View style={styles.promotionDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {new Date(item.valid_from).toLocaleDateString()} - {new Date(item.valid_to).toLocaleDateString()}
            </Text>
          </View>

          {item.uploaded_by_name && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>By {item.uploaded_by_name}</Text>
            </View>
          )}
        </View>

        <View style={styles.promotionFooter}>
          <Text style={styles.viewText}>Tap to view PDF</Text>
          <Ionicons name="arrow-forward" size={20} color="#EF4444" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotions</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Toggle */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, showActive && styles.filterButtonActive]}
          onPress={() => setShowActive(true)}
        >
          <Text style={[styles.filterButtonText, showActive && styles.filterButtonTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, !showActive && styles.filterButtonActive]}
          onPress={() => setShowActive(false)}
        >
          <Text style={[styles.filterButtonText, !showActive && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      ) : (
        <FlatList
          data={promotions}
          renderItem={renderPromotion}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No promotions available</Text>
            </View>
          }
        />
      )}
    </View>
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
  },
  promotionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  promotionDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  promotionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#9CA3AF',
  },
});
