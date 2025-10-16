import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";

type BackButtonProps = {
  title?: string;
  iconColor?: string;
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export default function BackButton({
  title = "Back",
  iconColor = "#2e7d32",
  textColor = "#2e7d32",
  style,
  textStyle,
}: BackButtonProps) {
  const router = useRouter();

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={router.back} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={iconColor} />
      </TouchableOpacity>
      <Text style={[styles.screenTitle, { color: textColor }, textStyle]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    paddingRight: 8,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
});
