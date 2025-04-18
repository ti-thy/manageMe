// src/components/AuthScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text } from 'react-native-elements';
import * as Animatable from 'react-native-animatable';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { authenticateWithGoogle } from '../shared/api';
import { MAX_EMAIL_ACCOUNTS } from '../shared/constants';

const AuthScreen = () => {
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const emails = useSelector((state) => state.user.emails) || [];

  const handleAuth = async () => {
    try {
      const account = await authenticateWithGoogle(emails);
      dispatch({
        type: 'ADD_EMAIL',
        payload: { email: account.email, events: [] }, // Events fetched in EmailSetup
      });
      navigation.navigate('EmailSetup');
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', err.message);
    }
  };

  return (
    <Animatable.View animation="fadeIn" duration={1000} style={styles.container}>
      <Text h3 style={styles.header}>
        Link Google Account ({emails.length}/{MAX_EMAIL_ACCOUNTS})
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Button
        title="Sign in with Google"
        onPress={handleAuth}
        buttonStyle={styles.button}
        containerStyle={styles.buttonContainer}
      />
      {emails.length > 0 && (
        <Button
          title="Continue to Email Setup"
          onPress={() => navigation.navigate('EmailSetup')}
          buttonStyle={styles.button}
          containerStyle={styles.buttonContainer}
        />
      )}
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
  button: {
    backgroundColor: '#6200ee',
  },
  buttonContainer: {
    width: '100%',
    marginVertical: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default AuthScreen;