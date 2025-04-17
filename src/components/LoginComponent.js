import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Input, Button, Text } from 'react-native-elements';
import * as Animatable from 'react-native-animatable';
import { useDispatch } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';

// Redux action to add user
const addUser = (user) => ({
  type: 'ADD_USER',
  payload: user,
});

const LoginComponent = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();
  const navigation = useNavigation();

  // Basic email validation
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSignUp = async () => {
    if (!username.trim() || !email.trim()) {
      Alert.alert('Error', 'Please enter both username and email.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    try {
      const user = { username, emails: [email] };
      // Dispatch user to Redux
      dispatch(addUser(user));
      // Store securely
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      // Navigate to Main screen
      navigation.navigate('Main');
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
      console.error(error);
    }
  };

  return (
    <Animatable.View animation="fadeIn" duration={1000} style={styles.container}>
      <Text h3 style={styles.header}>Create Account</Text>
      <Input
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        containerStyle={styles.input}
        leftIcon={{ type: 'font-awesome', name: 'user' }}
      />
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        containerStyle={styles.input}
        leftIcon={{ type: 'font-awesome', name: 'envelope' }}
        keyboardType="email-address"
      />
      <Button
        title="Sign Up"
        onPress={handleSignUp}
        buttonStyle={styles.button}
        containerStyle={styles.buttonContainer}
      />
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6200ee',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
});

export default LoginComponent;