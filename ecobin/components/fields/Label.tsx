import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";

interface LabelProps extends TextProps {
  children: string | number | boolean | null | undefined;
}

const Label = ({ children, style, ...props }: LabelProps) => {
  return (
    <Text style={[styles.label, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "left",
    lineHeight: 25,
  },
});

export default Label;
