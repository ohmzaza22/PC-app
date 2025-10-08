import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { SignOutButton } from "@/components/SignOutButton";
import { useEffect, useState } from "react";
import PageLoader from "../../components/PageLoader";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/useAuthStore";
import { useStoreStore } from "../../store/useStoreStore";
import { COLORS } from "../../constants/colors";

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  
  const { user: dbUser, userRole, initUser, refreshUser, isLoading } = useAuthStore();
  const { fetchStores } = useStoreStore();

  useEffect(() => {
    if (user) {
      initUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (dbUser) {
      // Fetch stores assigned to this PC
      if (userRole === 'PC') {
        fetchStores(dbUser.id);
      } else {
        fetchStores();
      }
    }
  }, [dbUser, userRole]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (dbUser) {
      // Refresh user data from database to get latest role
      await refreshUser();
      await fetchStores(userRole === 'PC' ? dbUser.id : null);
    }
    setRefreshing(false);
  };

  // PC modules - field operations
  const pcModules = [
    {
      id: 'checkin',
      title: 'Check In',
      subtitle: 'Check in to store',
      icon: 'location',
      color: COLORS.success,
      route: '/check-in',
      featured: true,
    },
    {
      id: 'osa',
      title: 'On-Shelf Availability',
      subtitle: 'Check stock & availability',
      icon: 'checkmark-circle',
      color: COLORS.module1,
      route: '/osa',
    },
    {
      id: 'display',
      title: 'Special Display',
      subtitle: 'Record display setups',
      icon: 'images',
      color: COLORS.module2,
      route: '/display',
    },
    {
      id: 'survey',
      title: 'Market Information',
      subtitle: 'Submit field surveys',
      icon: 'document-text',
      color: COLORS.module3,
      route: '/survey',
    },
    {
      id: 'promotion',
      title: 'Promotions',
      subtitle: 'View active promotions',
      icon: 'megaphone',
      color: COLORS.module4,
      route: '/promotions',
    },
  ];

  // Supervisor modules
  const supervisorModules = [
    {
      id: 'mc-dashboard',
      title: 'MC Dashboard',
      subtitle: 'Review pending tasks',
      icon: 'stats-chart',
      color: COLORS.primary,
      route: '/mc-dashboard',
      featured: true,
    },
    {
      id: 'review-tasks',
      title: 'Review Tasks',
      subtitle: 'Approve or reject submissions',
      icon: 'checkmark-done',
      color: COLORS.warning,
      route: '/review-tasks',
    },
    {
      id: 'visit-history',
      title: 'Visit History',
      subtitle: 'View PC check-ins',
      icon: 'time',
      color: COLORS.info,
      route: '/visit-history',
    },
  ];

  // Admin modules - management
  const adminModules = [
    {
      id: 'stores',
      title: 'Manage Stores',
      subtitle: 'Add and assign stores',
      icon: 'storefront',
      color: COLORS.primary,
      route: '/admin-stores',
    },
    {
      id: 'users',
      title: 'Manage Users',
      subtitle: 'View and manage PCs',
      icon: 'people',
      color: COLORS.module2,
      route: '/admin-users',
    },
    {
      id: 'reports',
      title: 'View Reports',
      subtitle: 'OSA, Display, Survey data',
      icon: 'bar-chart',
      color: COLORS.module3,
      route: '/admin-reports',
    },
    {
      id: 'promotion',
      title: 'Upload Promotions',
      subtitle: 'Manage promotion PDFs',
      icon: 'cloud-upload',
      color: COLORS.module4,
      route: '/promotions',
    },
  ];

  // Add rejected tasks module for PC
  const pcModulesWithRejected = [
    ...pcModules,
    {
      id: 'rejected',
      title: 'Rejected Tasks',
      subtitle: 'Tasks needing correction',
      icon: 'alert-circle',
      color: COLORS.error,
      route: '/rejected-tasks',
    },
  ];

  // Select modules based on role
  const getModules = () => {
    switch (userRole) {
      case 'ADMIN':
        return adminModules;
      case 'SUPERVISOR':
        return supervisorModules;
      case 'SALES':
      case 'VENDOR':
        return [adminModules[3]]; // Only promotions
      case 'PC':
        return pcModulesWithRejected;
      default:
        return pcModules;
    }
  };

  const modules = getModules();

  if (isLoading) return <PageLoader />;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.usernameText}>
                {user?.firstName || user?.emailAddresses[0]?.emailAddress.split("@")[0]}
              </Text>
              <Text style={styles.roleText}>{userRole || 'PC'}</Text>
            </View>
          </View>
          <SignOutButton />
        </View>

        {/* ROLE BADGE */}
        <View style={styles.roleBadgeContainer}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(userRole) }]}>
            <Ionicons name="person" size={16} color="#FFF" />
            <Text style={styles.roleBadgeText}>{userRole || 'PC'} Dashboard</Text>
          </View>
        </View>

        {/* MODULE CARDS */}
        <View style={styles.modulesContainer}>
          <Text style={styles.sectionTitle}>Field Operations</Text>
          <View style={styles.moduleGrid}>
            {modules.map((module) => (
              <TouchableOpacity
                key={module.id}
                style={styles.moduleCard}
                onPress={() => router.push(module.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.moduleIconContainer, { backgroundColor: module.color }]}>
                  <Ionicons name={module.icon} size={32} color="#FFF" />
                </View>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleSubtitle}>{module.subtitle}</Text>
                <View style={styles.moduleArrow}>
                  <Ionicons name="arrow-forward" size={20} color={module.color} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function getRoleColor(role) {
  switch (role) {
    case 'ADMIN': return COLORS.primaryDark;
    case 'SUPERVISOR': return COLORS.primary;
    case 'SALES': return COLORS.primaryLight;
    case 'VENDOR': return COLORS.primaryLighter;
    default: return COLORS.primary;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: -20,
    marginTop: -20,
    paddingTop: 36,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeContainer: {
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.border,
  },
  usernameText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  roleText: {
    fontSize: 12,
    color: COLORS.border,
    marginTop: 2,
  },
  roleBadgeContainer: {
    marginBottom: 24,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  roleBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  modulesContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  moduleCard: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  moduleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  moduleSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  moduleArrow: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});
