import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { displayAPI } from '../../lib/api';
import { COLORS } from '../../constants/colors';

export default function SupervisorVerifyScreen() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await displayAPI.getAll({ verified: filter === 'verified' });
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifySubmission = async (id) => {
    try {
      await displayAPI.verify(id);
      Alert.alert('Success', 'Submission verified');
      fetchSubmissions();
    } catch (error) {
      Alert.alert('Error', 'Failed to verify submission');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Submissions</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterButtonText, filter === 'pending' && styles.filterButtonTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'verified' && styles.filterButtonActive]}
          onPress={() => setFilter('verified')}
        >
          <Text style={[styles.filterButtonText, filter === 'verified' && styles.filterButtonTextActive]}>
            Verified
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.submissionCard}>
              {item.photo_url && (
                <Image source={{ uri: item.photo_url }} style={styles.photo} />
              )}
              <View style={styles.submissionInfo}>
                <Text style={styles.storeName}>{item.store_name}</Text>
                <Text style={styles.displayType}>{item.display_type}</Text>
                <Text style={styles.cost}>Cost: ฿{item.cost}</Text>
                <Text style={styles.submittedBy}>By: {item.pc_name}</Text>
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              {!item.verified && (
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={() => verifySubmission(item.id)}
                >
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                </TouchableOpacity>
              )}
              {item.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-done" size={20} color={COLORS.success} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No submissions to verify</Text>
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.white,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submissionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photo: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.backgroundLight,
  },
  submissionInfo: {
    padding: 16,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  displayType: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  cost: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  submittedBy: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  date: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  verifyButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
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
    color: COLORS.textLight,
  },
});
