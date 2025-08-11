import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Platform, StatusBar, useColorScheme, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { width } = useWindowDimensions();

  // --- Responsive breakpoints
  const compact = width < 480; // phones
  const medium = width >= 480 && width < 1024; // tablets / small laptops
  const large = width >= 1024; // desktops / large screens
  const isWeb = Platform.OS === "web";

  // --- Colors
  const backgroundColor = isDark ? "#1c1c1e" : "#ffffffee";
  const activeTintColor = isDark ? "#90ee90" : "#2e7d32";
  const inactiveTintColor = isDark ? "#ccc" : "#9e9e9e";

  // --- Sizes (↑ height a bit; ↓ padding so text fits cleanly)
  const barHeight = compact ? 68 : medium ? 70 : 74; // was 64/66/70
  const barRadius = compact ? 18 : medium ? 20 : 22;
  const iconSize = compact ? 10 : medium ? 18 : 18; // your sizes
  const labelFontSize = compact ? 10 : medium ? 10 : 11; // a touch smaller for fit

  // lineHeight to prevent clipping; slight headroom
  const labelLineHeight = labelFontSize + 3;

  // --- Layout calculations
  const horizontalMargin = 20;
  const maxBarWidth = 900;
  const computedBarWidth = isWeb ? Math.min(width - horizontalMargin * 2, maxBarWidth) : undefined;

  const leftPosition = isWeb ? Math.max((width - (computedBarWidth ?? width)) / 2, horizontalMargin) : horizontalMargin;

  const bottomOffset = Math.max(insets.bottom, compact ? 8 : 12);

  // --- Styles (no inline objects below)
  const tabBarStyleBase = {
    position: "absolute" as const,
    bottom: bottomOffset,
    height: barHeight,
    backgroundColor,
    borderRadius: barRadius,
    paddingTop: compact ? 4 : 6, // was 6/8
    paddingBottom: compact ? 8 : 10, // was 10/12
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 10,
    borderTopWidth: 0,
  };

  const tabBarStyleWeb = isWeb
    ? ({
        width: computedBarWidth,
        left: leftPosition,
        right: undefined,
      } as const)
    : ({} as const);

  const tabBarStyleNative = !isWeb
    ? ({
        left: horizontalMargin,
        right: horizontalMargin,
      } as const)
    : ({} as const);

  const tabBarStyle = {
    ...tabBarStyleBase,
    ...(isWeb ? tabBarStyleWeb : tabBarStyleNative),
  };

  const tabBarLabelStyle = {
    fontSize: labelFontSize,
    lineHeight: labelLineHeight,
    fontWeight: "600" as const,
    includeFontPadding: false as const, // Android: remove extra top/bottom padding on Text
    marginTop: 0,
    marginBottom: 0,
  };

  const tabBarItemStyle = {
    paddingHorizontal: compact ? 6 : 10,
  };

  // Nudge icon down a touch so label has room and doesn’t collide
  const tabBarIconStyle = {
    marginTop: 2,
  };

  return (
    <>
      {Platform.OS === "android" && (
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={isDark ? "#1c1c1e" : "#ffffff"}
          translucent
        />
      )}

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: activeTintColor,
          tabBarInactiveTintColor: inactiveTintColor,
          tabBarStyle,
          tabBarLabelStyle,
          tabBarItemStyle,
          tabBarIconStyle, // <- apply icon nudge
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarLabel: "Home",
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home-sharp" : "home-outline"} color={color} size={iconSize} />
            ),
          }}
        />

        <Tabs.Screen
          name="schedule"
          options={{
            tabBarLabel: "Schedule",
            title: "Schedule",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "calendar" : "calendar-outline"} color={color} size={iconSize} />
            ),
          }}
        />

        <Tabs.Screen
          name="map"
          options={{
            tabBarLabel: "Map",
            title: "Map",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "map" : "map-outline"} color={color} size={iconSize} />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            tabBarLabel: "Settings",
            title: "Settings",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "settings" : "settings-outline"} color={color} size={iconSize} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
