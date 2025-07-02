import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingScreen from '@/screen/LandingScreen';
import LoginScreen from '@/screen/Login';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
