import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Appearance } from "react-native";

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      const stored = await AsyncStorage.getItem("darkMode");
      if (stored !== null) {
        setIsDarkMode(stored === "true");
      } else {
        setIsDarkMode(Appearance.getColorScheme() === "dark");
      }
    };
    loadTheme();
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem("darkMode", newMode.toString());
  };

  return { isDarkMode, toggleDarkMode };
}
