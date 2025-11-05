import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader';
import { taskBatchAPI, setAuthToken } from '../../lib/api';
import { COLORS } from '../../constants/colors';

export default function TaskAssignmentsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isLoading) {
        fetchBatches();
      }
    }, [])
  );

  const initialize = async () => {
    try {
      const token = await getToken();
      if (token) {
        setAuthToken(token);
        await fetchBatches();
      }
    } catch (error) {
      console.error('Error initializing:', error);
      Alert.alert('Error', 'Failed to initialize');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await taskBatchAPI.getAll();
      setBatches(response.data.batches || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      Alert.alert('Error', 'Failed to load task assignments');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBatches();
    setIsRefreshing(false);
  };

  const handleBatchPress = (batch) => {
    // Navigate to batch details (will create this later)
    Alert.alert(
      'Task Batch Details',
      `Batch ID: ${batch.id}\nAssigned to: ${batch.pc_name}\nTasks: ${batch.task_count}`,
      [{ text: 'OK' }]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const BatchCard = ({ batch }) => (
    <TouchableOpacity style={styles.batchCard} onPress={() => handleBatchPress(batch)}>
      <View style={styles.batchHeader}>
        <View style={styles.batchIcon}>
          <Ionicons name="briefcase-outline" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.batchInfo}>
          <Text style={styles.batchTitle}>Batch #{batch.id}</Text>
          <Text style={styles.batchDate}>{formatDate(batch.created_at)}</Text>
        </View>
        <View style={styles.taskCountBadge}>
          <Text style={styles.taskCountText}>{batch.task_count}</Text>
        </View>
      </View>

      <View style={styles.batchDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.detailLabel}>Assigned to:</Text>
          <Text style={styles.detailValue}>{batch.pc_name || 'Unknown'}</Text>
        </View>

        {batch.pc_email && (
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{batch.pc_email}</Text>
          </View>
        )}

        {batch.note && (
          <View style={styles.noteContainer}>
            <Ionicons name="document-text-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.noteText}>{batch.note}</Text>
          </View>
        )}
      </View>

      <View style={styles.batchFooter}>
        <Text style={styles.viewDetailsText}>Tap to view details</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <PageHeader title="รายการที่มอบหมายงาน" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="รายการที่มอบหมายงาน"
        showBack
        rightComponent={
          <TouchableOpacity onPress={handleRefresh} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="refresh" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {batches.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        >
          <Ionicons name="clipboard-outline" size={80} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Task Assignments</Text>
          <Text style={styles.emptyText}>
            You haven't assigned any tasks yet. Tap the "มอบหมายงาน" button to create your first assignment.
          </Text>
          <TouchableOpacity
            style={styles.assignButton}
            onPress={() => router.push('/assign-task')}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.assignButtonText}>มอบหมายงาน</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        >
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{batches.length}</Text>
              <Text style={styles.statLabel}>Total Batches</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {batches.reduce((sum, b) => sum + parseInt(b.task_count || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Assignment History</Text>
            <Text style={styles.listCount}>{batches.length} batches</Text>
          </View>

          {batches.map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  listCount: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  batchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  batchIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  batchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  batchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  batchDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  taskCountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  taskCountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  batchDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  noteContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  batchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
