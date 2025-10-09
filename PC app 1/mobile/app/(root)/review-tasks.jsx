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
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader';
import { approvalAPI, setAuthToken } from '../../lib/api';
import { COLORS } from '../../constants/colors';

export default function ReviewTasksScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { type } = useLocalSearchParams();

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    initialize();
  }, [type]);

  const initialize = async () => {
    try {
      const token = await getToken();
      if (token) {
        setAuthToken(token);
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error initializing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await approvalAPI.getPending({ type });
      
      let allTasks = [];
      if (!type || type === 'osa') {
        allTasks = [...allTasks, ...response.data.osa.map(t => ({ ...t, taskType: 'osa' }))];
      }
      if (!type || type === 'display') {
        allTasks = [...allTasks, ...response.data.displays.map(t => ({ ...t, taskType: 'display' }))];
      }
      if (!type || type === 'survey') {
        allTasks = [...allTasks, ...response.data.surveys.map(t => ({ ...t, taskType: 'survey' }))];
      }

      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    }
  };

  const handleApprove = async (task) => {
    Alert.alert(
      'Approve Task',
      `Are you sure you want to approve this ${task.taskType}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setIsProcessing(true);
            try {
              if (task.taskType === 'osa') {
                await approvalAPI.approveOSA(task.id);
              } else if (task.taskType === 'display') {
                await approvalAPI.approveDisplay(task.id);
              } else if (task.taskType === 'survey') {
                await approvalAPI.approveSurvey(task.id);
              }

              Alert.alert('Success', 'Task approved successfully');
              await fetchTasks();
            } catch (error) {
              console.error('Error approving task:', error);
              Alert.alert('Error', 'Failed to approve task');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = (task) => {
    setSelectedTask(task);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      if (selectedTask.taskType === 'osa') {
        await approvalAPI.rejectOSA(selectedTask.id, rejectionReason);
      } else if (selectedTask.taskType === 'display') {
        await approvalAPI.rejectDisplay(selectedTask.id, rejectionReason);
      } else if (selectedTask.taskType === 'survey') {
        await approvalAPI.rejectSurvey(selectedTask.id, rejectionReason);
      }

      Alert.alert('Success', 'Task rejected');
      setShowRejectModal(false);
      await fetchTasks();
    } catch (error) {
      console.error('Error rejecting task:', error);
      Alert.alert('Error', 'Failed to reject task');
    } finally {
      setIsProcessing(false);
    }
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

  const renderTaskItem = ({ item }) => {
    const color = getTaskColor(item.taskType);
    const icon = getTaskIcon(item.taskType);

    return (
      <View style={styles.taskItem}>
        <View style={[styles.taskIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>

        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskType}>{item.taskType.toUpperCase()}</Text>
            <Text style={styles.taskDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>

          <Text style={styles.taskStore}>{item.store_name}</Text>
          <Text style={styles.taskPC}>By: {item.pc_name}</Text>

          {item.photo_url && (
            <Image
              source={{ uri: item.photo_url }}
              style={styles.taskPhoto}
              resizeMode="cover"
            />
          )}

          {item.remarks && (
            <Text style={styles.taskRemarks} numberOfLines={2}>
              {item.remarks}
            </Text>
          )}

          {item.gps_location && (
            <View style={styles.gpsInfo}>
              <Ionicons name="location" size={14} color={COLORS.textMuted} />
              <Text style={styles.gpsText}>
                {item.gps_location.latitude?.toFixed(6)}, {item.gps_location.longitude?.toFixed(6)}
              </Text>
            </View>
          )}

          <View style={styles.taskActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(item)}
              disabled={isProcessing}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(item)}
              disabled={isProcessing}
            >
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Review Tasks" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title={`Review Tasks${type ? ` (${type.toUpperCase()})` : ''}`}
        rightComponent={
          <TouchableOpacity onPress={fetchTasks} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="refresh" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={tasks}
        keyExtractor={(item) => `${item.taskType}-${item.id}`}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle" size={64} color={COLORS.success} />
            <Text style={styles.emptyText}>All caught up!</Text>
            <Text style={styles.emptySubtext}>No pending tasks to review</Text>
          </View>
        }
      />

      {/* Rejection Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Task</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Rejection Reason *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter reason for rejection..."
              placeholderTextColor={COLORS.textMuted}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalRejectButton]}
                onPress={submitRejection}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalRejectText}>Reject Task</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderColor: COLORS.border,
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
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '30',
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
  taskPC: {
    fontSize: 14,
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
  taskRemarks: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  gpsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  gpsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 100,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalRejectButton: {
    backgroundColor: COLORS.error,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalRejectText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
