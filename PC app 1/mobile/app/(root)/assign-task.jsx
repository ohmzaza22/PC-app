import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader';
import { userAPI, storeAPI, taskBatchAPI, setAuthToken } from '../../lib/api';
import { COLORS } from '../../constants/colors';

const TASK_TYPES = [
  { value: 'OSA', label: 'OSA' },
  { value: 'SPECIAL_DISPLAY', label: 'Special Display' },
  { value: 'MARKET_INFORMATION', label: 'Market Information' },
];

export default function AssignTaskScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pcUsers, setPcUsers] = useState([]);
  const [stores, setStores] = useState([]);

  const [selectedPcId, setSelectedPcId] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [note, setNote] = useState('');
  const [tasks, setTasks] = useState([
    {
      id: Date.now(),
      type: 'OSA',
      title: '',
      description: '',
      taskDate: new Date().toISOString().split('T')[0],
    },
  ]);

  useEffect(() => {
    initializeAndFetch();
  }, []);

  const initializeAndFetch = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      setAuthToken(token);
      await fetchData();
    } catch (error) {
      console.error('Initialization error:', error);
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const usersResponse = await userAPI.getAll('PC');
      setPcUsers(usersResponse.data || []);

      // We don't need to fetch all stores anymore since they're included with PC users
      // But keep it for backward compatibility
      const storesResponse = await storeAPI.getAll();
      setStores(storesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        type: 'OSA',
        title: '',
        description: '',
        taskDate: new Date().toISOString().split('T')[0],
      },
    ]);
  };

  const removeTask = (taskId) => {
    if (tasks.length === 1) {
      Alert.alert('Error', 'You must have at least one task');
      return;
    }
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  const updateTask = (taskId, field, value) => {
    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );
  };

  const handleSubmit = async () => {
    if (!selectedPcId) {
      Alert.alert('Error', 'Please select a PC user');
      return;
    }
    if (!selectedStoreId) {
      Alert.alert('Error', 'Please select a store');
      return;
    }

    for (const task of tasks) {
      if (!task.title.trim()) {
        Alert.alert('Error', 'All tasks must have a title');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        assignedToPcId: selectedPcId,
        storeId: selectedStoreId,
        note: note.trim() || null,
        // Backend will get supervisor ID from token (more secure)
        tasks: tasks.map((t) => ({
          type: t.type,
          title: t.title.trim(),
          description: t.description.trim() || null,
          taskDate: t.taskDate,
        })),
      };

      await taskBatchAPI.create(payload);
      Alert.alert('Success', 'Tasks assigned successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error assigning tasks:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to assign tasks'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <PageHeader title="มอบหมายงาน" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title="มอบหมายงาน" showBack />
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เลือก PC</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pcUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.userCard,
                  selectedPcId === user.id && styles.userCardSelected,
                ]}
                onPress={() => {
                  setSelectedPcId(user.id);
                  setSelectedStoreId(null); // Clear store selection when PC changes
                }}
              >
                <View style={styles.userAvatar}>
                  <Ionicons
                    name="person"
                    size={24}
                    color={selectedPcId === user.id ? COLORS.white : COLORS.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.userName,
                    selectedPcId === user.id && styles.userNameSelected,
                  ]}
                >
                  {user.name || user.email}
                </Text>
                {user.assigned_stores && user.assigned_stores.length > 0 && (
                  <View style={styles.storeCount}>
                    <Ionicons name="storefront" size={12} color={COLORS.textMuted} />
                    <Text style={styles.storeCountText}>
                      {user.assigned_stores.length} ร้าน
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เลือกร้านค้า</Text>
          {!selectedPcId && (
            <View style={styles.emptyState}>
              <Ionicons name="information-circle" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyStateText}>กรุณาเลือก PC ก่อน</Text>
            </View>
          )}
          {selectedPcId && (
            <>
              {pcUsers.find(u => u.id === selectedPcId)?.assigned_stores?.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="alert-circle" size={48} color={COLORS.warning} />
                  <Text style={styles.emptyStateText}>PC นี้ยังไม่มีร้านที่รับผิดชอบ</Text>
                </View>
              )}
              {pcUsers.find(u => u.id === selectedPcId)?.assigned_stores?.map((store) => (
                <TouchableOpacity
                  key={store.id}
                  style={[
                    styles.storeCard,
                    selectedStoreId === store.id && styles.storeCardSelected,
                  ]}
                  onPress={() => setSelectedStoreId(store.id)}
                >
                  <View style={styles.storeIcon}>
                    <Ionicons name="storefront" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeName}>{store.store_name}</Text>
                    <Text style={styles.storeType}>{store.store_type}</Text>
                    {store.store_code && (
                      <Text style={styles.storeCode}>รหัส: {store.store_code}</Text>
                    )}
                  </View>
                  {selectedStoreId === store.id && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>หมายเหตุ</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="เพิ่มหมายเหตุ..."
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>งานที่มอบหมาย</Text>
            <TouchableOpacity style={styles.addButton} onPress={addTask}>
              <Ionicons name="add-circle" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {tasks.map((task, index) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskNumber}>งาน #{index + 1}</Text>
                {tasks.length > 1 && (
                  <TouchableOpacity onPress={() => removeTask(task.id)}>
                    <Ionicons name="trash" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.fieldLabel}>ประเภทงาน</Text>
              <View style={styles.taskTypeContainer}>
                {TASK_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.taskTypeButton,
                      task.type === type.value && styles.taskTypeButtonSelected,
                    ]}
                    onPress={() => updateTask(task.id, 'type', type.value)}
                  >
                    <Text
                      style={[
                        styles.taskTypeText,
                        task.type === type.value && styles.taskTypeTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>หัวข้องาน</Text>
              <TextInput
                style={styles.input}
                placeholder="ระบุหัวข้องาน..."
                value={task.title}
                onChangeText={(value) => updateTask(task.id, 'title', value)}
              />

              <Text style={styles.fieldLabel}>รายละเอียด</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="ระบุรายละเอียด..."
                value={task.description}
                onChangeText={(value) => updateTask(task.id, 'description', value)}
                multiline
              />

              <Text style={styles.fieldLabel}>วันที่ทำงาน (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-01-01"
                value={task.taskDate}
                onChangeText={(value) => updateTask(task.id, 'taskDate', value)}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <Text style={styles.submitButtonText}>มอบหมายงาน</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  userCard: {
    width: 120,
    padding: 16,
    marginRight: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  userCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLighter,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  userNameSelected: {
    color: COLORS.primary,
  },
  storeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  storeCountText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  storeCode: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  storeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLighter,
  },
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  storeType: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  noteInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 12,
  },
  taskTypeContainer: {
    gap: 8,
  },
  taskTypeButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundLight,
  },
  taskTypeButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLighter,
  },
  taskTypeText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  taskTypeTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateButtonText: {
    fontSize: 14,
    color: COLORS.text,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
