import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import NetInfo from '@react-native-community/netinfo';
import { Alert, Platform, ToastAndroid } from 'react-native';
import * as Notifications from 'expo-notifications';
import LoginComponent from './LoginComponent';
import CalendarComponent from './CalendarComponent';
import EmailSetupComponent from './EmailSetupComponent';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createStackNavigator();

const MainComponent = () => {
  // Network connectivity check
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        if (Platform.OS === 'ios') {
          Alert.alert('No Network', 'Please check your internet connection.');
        } else {
          ToastAndroid.show('No Network Connection', ToastAndroid.SHORT);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Request notification permissions
  useEffect(() => {
    async function configureNotifications() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Notifications are required for event alerts.');
      }
    }
    configureNotifications();
  }, []);

  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginComponent} options={{ headerShown: false }} />
      <Stack.Screen name="Main" component={MainScreen} options={{ title: 'Manage Me' }} />
      <Stack.Screen name="Calendar" component={CalendarComponent} options={{ title: 'Calendar' }} />
      <Stack.Screen name="EmailSetup" component={EmailSetupComponent} options={{ title: 'Link Email' }} />
    </Stack.Navigator>
  );
};

// Main screen (home screen)
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

const MainScreen = () => {
  const navigation = useNavigation();

  return (
    <Animatable.View animation="fadeIn" duration={1000} style={styles.container}>
      <Text h3 style={styles.header}>Welcome to Manage Me</Text>
      <Button
        title="View Calendar"
        onPress={() => navigation.navigate('Calendar')}
        buttonStyle={styles.button}
        containerStyle={styles.buttonContainer}
      />
      <Button
        title="Link Email Accounts"
        onPress={() => navigation.navigate('EmailSetup')}
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
    alignItems: 'center',
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
});

export default MainComponent;