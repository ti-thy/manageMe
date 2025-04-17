import * as SecureStore from 'expo-secure-store';

// Mock email event fetching (replace with Google API in debugging phase)
export const fetchEmailEvents = async (email) => {
  // Simulate fetching events from email
  // In production, use expo-auth-session and Google Gmail API
  return [
    { id: '1', title: 'Meeting with Team', start: '2025-04-18T10:00:00Z', end: '2025-04-18T11:00:00Z' },
    { id: '2', title: 'Lunch with Client', start: '2025-04-18T12:00:00Z', end: '2025-04-18T13:00:00Z' },
  ];
};

// Mock calendar sync (just for the test run, will be replaced with Google Calendar API)
export const syncToCalendar = async (event) => {
  // Simulate adding event to calendar
  console.log('Syncing event to calendar:', event);
  return true;
};

// Store email account token (mock OAuth)
export const storeEmailToken = async (email, token) => {
  await SecureStore.setItemAsync(`email_${email}`, token);
};

export const getEmailToken = async (email) => {
  return await SecureStore.getItemAsync(`email_${email}`);
};