import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { osaAPI, displayAPI, surveyAPI } from '../../lib/api';
import { COLORS } from '../../constants/colors';

export default function AdminReportsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({
    osa: 0,
    displays: 0,
    surveys: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [osaRes, displayRes, surveyRes] = await Promise.all([
        osaAPI.getAll(),
        displayAPI.getAll(),
        surveyAPI.getAll(),
      ]);
      
      setStats({
        osa: osaRes.data.length,
        displays: displayRes.data.length,
        surveys: surveyRes.data.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const reportCards = [
    {
      title: 'OSA Records',
      count: stats.osa,
      icon: 'checkmark-circle',
      color: COLORS.module1,
    },
    {
      title: 'Display Records',
      count: stats.displays,
      icon: 'images',
      color: COLORS.module2,
    },
    {
      title: 'Survey Records',
      count: stats.surveys,
      icon: 'document-text',
      color: COLORS.module3,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>View Reports</Text>
        <TouchableOpacity onPress={fetchStats}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Overview</Text>
          
          <View style={styles.statsGrid}>
            {reportCards.map((card, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: card.color }]}>
                  <Ionicons name={card.icon} size={32} color={COLORS.white} />
                </View>
                <Text style={styles.statCount}>{card.count}</Text>
                <Text style={styles.statTitle}>{card.title}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="download-outline" size={24} color={COLORS.primary} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Export Data</Text>
              <Text style={styles.actionSubtitle}>Download CSV reports</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="analytics-outline" size={24} color={COLORS.module2} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Analytics Dashboard</Text>
              <Text style={styles.actionSubtitle}>View detailed analytics</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '31%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statCount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
