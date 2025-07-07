import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const LandingScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const logoOffsetY = useSharedValue(-100);
  const textOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0);

  useEffect(() => {
    logoOffsetY.value = withTiming(0, {
      duration: 800,
      easing: Easing.out(Easing.exp),
    });

    textOpacity.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.ease),
    });

    buttonScale.value = withSpring(1, {
      damping: 8,
      stiffness: 150,
    });
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoOffsetY.value }],
  }));

  const fadeInText = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonBounce = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.imageContainer, logoStyle]}>
        <Image
          source={require('../assets/images/logo-final2.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[fadeInText]}>
        <Text style={styles.title}>EcoBin</Text>
        <Text style={styles.subtitle}>Smarter bins, greener tomorrow.</Text>
      </Animated.View>

      <Animated.View style={buttonBounce}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FDFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#0BA14B',
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 30,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LandingScreen;
