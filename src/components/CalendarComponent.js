import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as Animatable from 'react-native-animatable';
import * as Notifications from 'expo-notifications';
import { useSelector } from 'react-redux';
import { syncToCalendar } from '../shared/api';

const CalendarComponent = () => {
  const events = useSelector(state => state.events) || [];

  // Detect clashes and sync events
  useEffect(() => {
    const checkClashesAndSync = async () => {
      // Sync events to calendar
      for (const event of events) {
        await syncToCalendar(event);
      }

      // Check for clashes
      const clashes = [];
      for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
          const event1 = events[i];
          const event2 = events[j];
          const start1 = new Date(event1.start);
          const end1 = new Date(event1.end);
          const start2 = new Date(event2.start);
          const end2 = new Date(event2.end);

          if (start1 < end2 && start2 < end1) {
            clashes.push({ event1, event2 });
          }
        }
      }

      // Notify user of clashes
      if (clashes.length > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Event Clash Detected',
            body: `You have ${clashes.length} event clash(es). Please resolve manually.`,
          },
          trigger: null,
        });
        Alert.alert('Event Clash', 'You have conflicting events. Please resolve manually.');
      }
    };

    checkClashesAndSync();
  }, [events]);

  // Format events for Calendar
  const markedDates = events.reduce((acc, event) => {
    const date = event.start.split('T')[0];
    acc[date] = { marked: true, dotColor: '#6200ee' };
    return acc;
  }, {});

  const renderEvent = ({ item }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text>{new Date(item.start).toLocaleString()} - {new Date(item.end).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        style={styles.calendar}
        theme={{
          selectedDayBackgroundColor: '#6200ee',
          todayTextColor: '#6200ee',
          arrowColor: '#6200ee',
        }}
      />
      <Animatable.View animation="fadeIn" duration={1000} style={styles.eventList}>
        <Text style={styles.header}>Upcoming Events</Text>
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={item => item.id}
          ListEmptyComponent={<Text>No events scheduled.</Text>}
        />
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  calendar: {
    margin: 10,
  },
  eventList: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  eventItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CalendarComponent;