// constants/colors.js

// PC Field App - Colorful Theme
const fieldAppTheme = {
  // Primary colors
  primary: "#10B981",        // Emerald green
  primaryDark: "#059669",    // Dark emerald
  primaryLight: "#34D399",   // Light emerald
  primaryLighter: "#6EE7B7", // Lighter emerald
  
  // Background colors
  background: "#F0FDF4",     // Very light green tint
  backgroundLight: "#ECFDF5", // Light green background
  
  // Text colors
  text: "#065F46",           // Deep green for headings
  textDark: "#064E3B",       // Darker green
  textLight: "#6B7280",      // Gray for body text
  textMuted: "#9CA3AF",      // Muted gray
  
  // UI colors
  white: "#FFFFFF",
  border: "#A7F3D0",         // Bright green border
  borderLight: "#D1FAE5",    // Light green border
  card: "#FFFFFF",
  shadow: "#000000",
  
  // Status colors
  success: "#10B981",        // Green
  error: "#F43F5E",          // Rose red
  warning: "#FBBF24",        // Amber yellow
  info: "#3B82F6",           // Blue
  
  // Module colors (vibrant different colors)
  module1: "#10B981",        // Emerald - OSA
  module2: "#8B5CF6",        // Purple - Display
  module3: "#F59E0B",        // Amber - Survey
  module4: "#EC4899",        // Pink - Promotions
};

const coffeeTheme = {
  primary: "#8B593E",
  background: "#FFF8F3",
  text: "#4A3428",
  border: "#E5D3B7",
  white: "#FFFFFF",
  textLight: "#9A8478",
  expense: "#E74C3C",
  income: "#2ECC71",
  card: "#FFFFFF",
  shadow: "#000000",
};

const forestTheme = {
  primary: "#2E7D32",
  background: "#E8F5E9",
  text: "#1B5E20",
  border: "#C8E6C9",
  white: "#FFFFFF",
  textLight: "#66BB6A",
  expense: "#C62828",
  income: "#388E3C",
  card: "#FFFFFF",
  shadow: "#000000",
};

export const THEMES = {
  fieldApp: fieldAppTheme,
  coffee: coffeeTheme,
  forest: forestTheme,
};

// 👇 Active theme for PC Field App
export const COLORS = THEMES.fieldApp;
