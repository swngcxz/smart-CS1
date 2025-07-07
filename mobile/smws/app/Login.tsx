import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/logo-final2.png')} style={styles.logo} />
      <Text style={styles.title}>Login to EcoBin</Text>

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secureText}
        />
        <TouchableOpacity onPress={() => setSecureText(!secureText)}>
          <Ionicons name={secureText ? 'eye-off' : 'eye'} size={20} color="gray" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.signUpPrompt}>Don't have an account?</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.signUpLink}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  logo: { width: 80, height: 80, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
  input: { width: '100%', backgroundColor: '#fff', padding: 12, marginBottom: 16, borderRadius: 8, borderColor: '#ddd', borderWidth: 1 },
  passwordContainer: { width: '100%', flexDirection: 'row', backgroundColor: '#fff', alignItems: 'center', borderRadius: 8, borderColor: '#ddd', borderWidth: 1, paddingHorizontal: 12, marginBottom: 24 },
  passwordInput: { flex: 1, paddingVertical: 12 },
  button: { width: '100%', backgroundColor: '#00796B', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  signUpPrompt: { fontSize: 14, color: '#444' },
  signUpLink: { fontSize: 14, color: '#00796B', fontWeight: '600', marginTop: 4 },
});
