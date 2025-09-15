import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Provider as PaperProvider } from "react-native-paper";
import HomeScreen from "./(tabs)/home";
import BinDetailScreen from "./home/bin-details";
import NotificationScreen from "./screens/notification";
import ProfileScreen from "./screens/profile";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Notifications" component={NotificationScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="BinDetailScreen" component={BinDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
