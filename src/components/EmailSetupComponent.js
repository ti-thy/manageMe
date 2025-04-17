import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Input, Button, Text } from 'react-native-elements';
import { useSelector, useDispatch } from 'react-redux';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { fetchEmailEvents, storeEmailToken } from '../shared/api';
import { MAX_EMAIL_ACCOUNTS } from '../shared/constants';

// Redux actions
const addEmail = (email, events) => ({
  type: 'ADD_EMAIL',
  payload: { email, events },
});

const EmailSetupComponent = () => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const emails = user?.emails || [];

  // 3D button animation
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  const handleButtonPress = () => {
    rotateX.value = withTiming(360, { duration: 1000, easing: Easing.inOut(Easing.quad) });
    rotateY.value = withTiming(360, { duration: 1000, easing: Easing.inOut(Easing.quad) });
  };

  const handleAddEmail = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (emails.includes(email)) {
      Alert.alert('Error', 'This email is already linked.');
      return;
    }

    if (emails.length >= MAX_EMAIL_ACCOUNTS) {
      Alert.alert('Limit Reached', `You can only link up to ${MAX_EMAIL_ACCOUNTS} email accounts.`);
      return;
    }

    try {
      // Mock OAuth token (replace with expo-auth-session in debugging phase)
      const token = `mock-token-${email}`;
      await storeEmailToken(email, token);

      // Fetch email events
      const events = await fetchEmailEvents(email);
      dispatch(addEmail(email, events));

      // Notify user
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Email Linked',
          body: `Successfully linked ${email}. ${events.length} events fetched.`,
        },
        trigger: null,
      });

      setEmail('');
    } catch (error) {
      Alert.alert('Error', 'Failed to link email. Please try again.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text h4 style={styles.header}>Link Email Accounts</Text>
      <Text style={styles.subheader}>
        {emails.length}/{MAX_EMAIL_ACCOUNTS} accounts linked
      </Text>
      {emails.map((e, index) => (
        <Text key={index} style={styles.emailItem}>• {e}</Text>
      ))}
      <Input
        placeholder="Enter email address"
        value={email}
        onChangeText={setEmail}
        containerStyle={styles.input}
        leftIcon={{ type: 'font-awesome', name: 'envelope' }}
        keyboardType="email-address"
      />
      <Animated.View style={[styles.buttonContainer, animatedStyle]}>
        <Button
          title="Add Email"
          onPress={() => {
            handleButtonPress();
            handleAddEmail();
          }}
          buttonStyle={styles.button}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subheader: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  emailItem: {
    fontSize: 16,
    marginVertical: 5,
  },
  input: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6200ee',
  },
  buttonContainer: {
    width: '100%',
    marginVertical: 10,
  },
});

export default EmailSetupComponent;