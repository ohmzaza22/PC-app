import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { approvalAPI, setAuthToken } from '../../lib/api';
import { COLORS } from '../../constants/colors';

export default function RejectedTasksScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [rejectedTasks, setRejectedTasks] = useState({ osa: [], displays: [], surveys: [], total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const token = await getToken();
      if (token) {
        setAuthToken(token);
        await fetchRejectedTasks();
      }
    } catch (error) {
      console.error('Error initializing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRejectedTasks = async () => {
    try {
      const response = await approvalAPI.getRejected();
      setRejectedTasks({
        ...response.data,
        total: response.data.total,
      });
    } catch (error) {
      console.error('Error fetching rejected tasks:', error);
      Alert.alert('Error', 'Failed to load rejected tasks');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRejectedTasks();
    setIsRefreshing(false);
  };

  const handleResubmit = (task, taskType) => {
    Alert.alert(
      'Resubmit Task',
      'You need to visit the store again to resubmit this task with corrections.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go to Store',
          onPress: () => {
            // Navigate to appropriate screen based on task type
            if (taskType === 'osa') {
              router.push('/osa');
            } else if (taskType === 'display') {
              router.push('/display');
            } else if (taskType === 'survey') {
              router.push('/survey');
            }
          },
        },
      ]
    );
  };

  const getTaskIcon = (taskType) => {
    switch (taskType) {
      case 'osa': return 'checkmark-circle';
      case 'display': return 'images';
      case 'survey': return 'document-text';
      default: return 'document';
    }
  };

  const getTaskColor = (taskType) => {
    switch (taskType) {
      case 'osa': return COLORS.module1;
      case 'display': return COLORS.module2;
      case 'survey': return COLORS.module3;
      default: return COLORS.primary;
    }
  };

  const renderTaskItem = ({ item, taskType }) => {
    const color = getTaskColor(taskType);
    const icon = getTaskIcon(taskType);

    return (
      <View style={styles.taskItem}>
        <View style={[styles.taskIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>

        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text style={[styles.taskType, { backgroundColor: COLORS.error + '20', color: COLORS.error }]}>
              {taskType.toUpperCase()} - REJECTED
            </Text>
            <Text style={styles.taskDate}>
              {new Date(item.reviewed_at).toLocaleDateString()}
            </Text>
          </View>

          <Text style={styles.taskStore}>{item.store_name}</Text>
          
          {item.reviewer_name && (
            <Text style={styles.reviewer}>Reviewed by: {item.reviewer_name}</Text>
          )}

          {item.photo_url && (
            <Image
              source={{ uri: item.photo_url }}
              style={styles.taskPhoto}
              resizeMode="cover"
            />
          )}

          {/* Rejection Reason */}
          <View style={styles.rejectionCard}>
            <View style={styles.rejectionHeader}>
              <Ionicons name="alert-circle" size={20} color={COLORS.error} />
              <Text style={styles.rejectionTitle}>Rejection Reason</Text>
            </View>
            <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
          </View>

          {/* Original Submission Info */}
          {item.remarks && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Your Original Notes:</Text>
              <Text style={styles.infoText}>{item.remarks}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.resubmitButton}
            onPress={() => handleResubmit(item, taskType)}
          >
            <Ionicons name="refresh" size={20} color={COLORS.white} />
            <Text style={styles.resubmitButtonText}>Resubmit Task</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const allTasks = [
    ...rejectedTasks.osa.map(t => ({ ...t, taskType: 'osa' })),
    ...rejectedTasks.displays.map(t => ({ ...t, taskType: 'display' })),
    ...rejectedTasks.surveys.map(t => ({ ...t, taskType: 'survey' })),
  ].sort((a, b) => new Date(b.reviewed_at) - new Date(a.reviewed_at));

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rejected Tasks</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rejected Tasks</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {rejectedTasks.total > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="alert-circle" size={24} color={COLORS.error} />
          <Text style={styles.alertText}>
            You have {rejectedTasks.total} rejected task{rejectedTasks.total > 1 ? 's' : ''} that need correction
          </Text>
        </View>
      )}

      <FlatList
        data={allTasks}
        keyExtractor={(item) => `${item.taskType}-${item.id}`}
        renderItem={({ item }) => renderTaskItem({ item, taskType: item.taskType })}
        contentContainerStyle={styles.listContent}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle" size={64} color={COLORS.success} />
            <Text style={styles.emptyText}>Great Job!</Text>
            <Text style={styles.emptySubtext}>No rejected tasks</Text>
          </View>
        }
      />
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.error + '15',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  listContent: {
    padding: 16,
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
    gap: 12,
  },
  taskIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskType: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  taskDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  taskStore: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  reviewer: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  taskPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: COLORS.backgroundLight,
  },
  rejectionCard: {
    backgroundColor: COLORS.error + '10',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
    marginBottom: 12,
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.error,
  },
  rejectionText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: COLORS.backgroundLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
  },
  resubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
  },
  resubmitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
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
