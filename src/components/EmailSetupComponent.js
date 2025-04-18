// src/components/EmailSetupComponent.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Input, Button, Text } from 'react-native-elements';
import { useSelector, useDispatch } from 'react-redux';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { fetchEmailEvents, getEmailToken, refreshAccessToken } from '../shared/api';
import { MAX_EMAIL_ACCOUNTS } from '../shared/constants';

const EmailSetupComponent = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user) || { emails: [] };
  const events = useSelector((state) => state.events) || [];
  const emails = user.emails || [];

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

  useEffect(() => {
    const fetchAllEvents = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const allEvents = [];
        for (const email of emails) {
          let token = await getEmailToken(email);
          let accessToken = token?.accessToken;
          if (!accessToken) continue;
          try {
            const newEvents = await fetchEmailEvents(accessToken);
            allEvents.push(...newEvents.map((event) => ({ ...event, accessToken })));
          } catch (err) {
            if (err.message === 'Token expired' && token.refreshToken) {
              accessToken = await refreshAccessToken(token.refreshToken);
              token = { ...token, accessToken };
              await storeEmailToken(email, token);
              const newEvents = await fetchEmailEvents(accessToken);
              allEvents.push(...newEvents.map((event) => ({ ...event, accessToken })));
            }
          }
        }
        dispatch({ type: 'SET_EVENTS', payload: allEvents });
        checkClashes(allEvents);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch events.');
        console.error(error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    if (emails.length > 0) fetchAllEvents();
  }, [emails]);

  const checkClashes = (allEvents) => {
    const clashes = [];
    for (let i = 0; i < allEvents.length; i++) {
      for (let j = i + 1; j < allEvents.length; j++) {
        const event1 = allEvents[i];
        const event2 = allEvents[j];
        const start1 = new Date(event1.start);
        const end1 = new Date(event1.end);
        const start2 = new Date(event2.start);
        const end2 = new Date(event2.end);
        if (start1 < end2 && start2 < end1) {
          clashes.push({
            id: `${event1.id}-${event2.id}`,
            event1,
            event2,
          });
        }
      }
    }
    if (clashes.length > 0) {
      clashes.forEach((clash) => dispatch({ type: 'ADD_CLASH', payload: clash }));
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Event Clash Detected',
          body: `You have ${clashes.length} event clash(es). Please resolve manually.`,
        },
        trigger: null,
      });
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
      <Animated.View style={[styles.buttonContainer, animatedStyle]}>
        <Button
          title="Add Another Account"
          onPress={() => {
            handleButtonPress();
            navigation.navigate('Auth');
          }}
          buttonStyle={styles.button}
        />
      </Animated.View>
      {emails.length > 0 && (
        <Button
          title="View Calendar"
          onPress={() => navigation.navigate('Calendar')}
          buttonStyle={styles.button}
          containerStyle={styles.buttonContainer}
        />
      )}
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
  button: {
    backgroundColor: '#6200ee',
  },
  buttonContainer: {
    width: '100%',
    marginVertical: 10,
  },
});

export default EmailSetupComponent;