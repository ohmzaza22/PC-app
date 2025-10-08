import { useClerk } from "@clerk/clerk-expo";
import { Alert, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

export const SignOutButton = () => {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
      <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    padding: 8,
    borderRadius: 8,
  },
});
