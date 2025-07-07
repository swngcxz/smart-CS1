// File: app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide headers globally
        animation: 'fade',  // Optional: fade transition between screens
      }}
    />
  );
}
