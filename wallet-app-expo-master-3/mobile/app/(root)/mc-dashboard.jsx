import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader';
import { approvalAPI, setAuthToken } from '../../lib/api';
import { COLORS } from '../../constants/colors';

export default function MCDashboardScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [pendingApprovals, setPendingApprovals] = useState({ osa: [], displays: [], surveys: [], total: 0 });
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isLoading) {
        fetchData();
      }
    }, [])
  );

  const initialize = async () => {
    try {
      const token = await getToken();
      if (token) {
        setAuthToken(token);
        await fetchData();
      }
    } catch (error) {
      console.error('Error initializing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [pendingRes, statsRes] = await Promise.all([
        approvalAPI.getPending(),
        approvalAPI.getStats(),
      ]);

      setPendingApprovals(pendingRes.data);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const StatCard = ({ title, value, color, icon, onPress }) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  const TaskTypeCard = ({ title, count, icon, color, onPress }) => (
    <TouchableOpacity style={styles.taskCard} onPress={onPress}>
      <View style={[styles.taskIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <Text style={styles.taskCount}>{count}</Text>
      <Text style={styles.taskTitle}>{title}</Text>
      {count > 0 && (
        <View style={[styles.taskBadge, { backgroundColor: color }]}>
          <Text style={styles.taskBadgeText}>Review</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <PageHeader title="MC Dashboard" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title="MC Dashboard"
        rightComponent={
          <TouchableOpacity onPress={handleRefresh} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="refresh" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Pending Approvals Alert */}
        {pendingApprovals.total > 0 && (
          <View style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <Ionicons name="alert-circle" size={32} color={COLORS.warning} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Pending Approvals</Text>
              <Text style={styles.alertText}>
                You have {pendingApprovals.total} task{pendingApprovals.total > 1 ? 's' : ''} waiting for review
              </Text>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          
          {stats.map((stat, index) => {
            const total = parseInt(stat.total) || 0;
            const pending = parseInt(stat.pending) || 0;
            const approved = parseInt(stat.approved) || 0;
            const rejected = parseInt(stat.rejected) || 0;
            const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

            return (
              <View key={index} style={styles.statRow}>
                <Text style={styles.statType}>{stat.type}</Text>
                <View style={styles.statNumbers}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: COLORS.warning }]}>{pending}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: COLORS.success }]}>{approved}</Text>
                    <Text style={styles.statLabel}>Approved</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: COLORS.error }]}>{rejected}</Text>
                    <Text style={styles.statLabel}>Rejected</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNum}>{approvalRate}%</Text>
                    <Text style={styles.statLabel}>Rate</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Pending Tasks by Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Tasks</Text>
          <View style={styles.taskGrid}>
            <TaskTypeCard
              title="OSA Records"
              count={pendingApprovals.osa.length}
              icon="checkmark-circle"
              color={COLORS.module1}
              onPress={() => router.push('/review-tasks?type=osa')}
            />
            <TaskTypeCard
              title="Displays"
              count={pendingApprovals.displays.length}
              icon="images"
              color={COLORS.module2}
              onPress={() => router.push('/review-tasks?type=display')}
            />
            <TaskTypeCard
              title="Surveys"
              count={pendingApprovals.surveys.length}
              icon="document-text"
              color={COLORS.module3}
              onPress={() => router.push('/review-tasks?type=survey')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <StatCard
            title="Review All Pending"
            value={pendingApprovals.total}
            color={COLORS.warning}
            icon="list"
            onPress={() => router.push('/review-tasks')}
          />
          
          <StatCard
            title="View Visit History"
            value="History"
            color={COLORS.info}
            icon="time"
            onPress={() => router.push('/visit-history')}
          />
          
          <StatCard
            title="Team Performance"
            value="Reports"
            color={COLORS.primary}
            icon="stats-chart"
            onPress={() => router.push('/team-performance')}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  content: {
    flex: 1,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '15',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    gap: 12,
  },
  alertIcon: {
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  section: {
    marginTop: 8,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  statRow: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  statNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  taskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  taskCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  taskIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskCount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  taskTitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  taskBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    gap: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statTitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
