import React from "react";
import { Slot } from "expo-router";
import { AccountProvider } from "../contexts/AccountContext";
import { RealTimeDataProvider } from "../contexts/RealTimeDataContext";

export default function RootLayout() {
  return (
    <AccountProvider>
      <RealTimeDataProvider>
        <Slot />
      </RealTimeDataProvider>
    </AccountProvider>
  );
}
