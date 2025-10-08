import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { userAPI, setAuthToken } from '../../lib/api';
import { COLORS } from '../../constants/colors';

export default function AdminUsersScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    initializeAndFetch();
  }, [filter]);

  const initializeAndFetch = async () => {
    try {
      const token = await getToken();
      if (token) {
        setAuthToken(token);
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error initializing:', error);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const role = filter === 'ALL' ? null : filter;
      const response = await userAPI.getAll(role);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      await userAPI.createOrUpdate({
        id: userId,
        role: newRole,
      });
      Alert.alert('Success', `User role changed to ${newRole}`);
      setShowRoleModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to change user role');
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return COLORS.error;
      case 'SUPERVISOR': return COLORS.warning;
      case 'SALES': return COLORS.info;
      case 'VENDOR': return COLORS.primaryLight;
      default: return COLORS.primary;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN': return 'shield-checkmark';
      case 'SUPERVISOR': return 'eye';
      case 'SALES': return 'briefcase';
      case 'VENDOR': return 'business';
      default: return 'person';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Users</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterContainer}>
        {['ALL', 'PC', 'SUPERVISOR', 'ADMIN', 'SALES'].map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.filterButton, filter === role && styles.filterButtonActive]}
            onPress={() => setFilter(role)}
          >
            <Text style={[styles.filterButtonText, filter === role && styles.filterButtonTextActive]}>
              {role}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.userItem}
              onPress={() => openRoleModal(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.userIcon, { backgroundColor: getRoleColor(item.role) + '20' }]}>
                <Ionicons name={getRoleIcon(item.role)} size={24} color={getRoleColor(item.role)} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name || 'Unknown'}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
                  <Text style={styles.roleText}>{item.role}</Text>
                </View>
              </View>
              <Ionicons name="create-outline" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}

      {/* Role Change Modal */}
      <Modal
        visible={showRoleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change User Role</Text>
            <Text style={styles.modalSubtitle}>
              {selectedUser?.name} ({selectedUser?.email})
            </Text>

            <View style={styles.roleOptions}>
              {['PC', 'SUPERVISOR', 'ADMIN', 'SALES', 'VENDOR'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    selectedUser?.role === role && styles.roleOptionActive
                  ]}
                  onPress={() => changeUserRole(selectedUser.id, role)}
                >
                  <Ionicons 
                    name={getRoleIcon(role)} 
                    size={24} 
                    color={selectedUser?.role === role ? COLORS.white : getRoleColor(role)} 
                  />
                  <Text style={[
                    styles.roleOptionText,
                    selectedUser?.role === role && styles.roleOptionTextActive
                  ]}>
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRoleModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    gap: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 12,
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
  userItem: {
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
  userIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  userEmail: { fontSize: 14, color: COLORS.textLight, marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleText: {
    fontSize: 11,
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
    fontSize: 16,
    color: COLORS.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 20,
  },
  roleOptions: {
    gap: 12,
    marginBottom: 20,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 12,
  },
  roleOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  roleOptionTextActive: {
    color: COLORS.white,
  },
  modalCloseButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
  },
});
