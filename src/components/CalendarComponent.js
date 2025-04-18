// src/components/CalendarComponent.js
import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, Button, Image } from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as Animatable from 'react-native-animatable';
import { useSelector, useDispatch } from 'react-redux';
import { syncToCalendar } from '../shared/api';

const CalendarComponent = () => {
  const events = useSelector((state) => state.events) || [];
  const clashes = useSelector((state) => state.clashes) || [];
  const calendar = useSelector((state) => state.calendar) || {};
  const dispatch = useDispatch();

  useEffect(() => {
    const syncEvents = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      for (const event of events) {
        try {
          await syncToCalendar(event);
        } catch (error) {
          console.error('Sync error:', error);
        }
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    };
    if (events.length > 0) syncEvents();
  }, [events]);

  const renderEvent = ({ item }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text>
        {new Date(item.start).toLocaleString()} - {new Date(item.end).toLocaleString()}
      </Text>
    </View>
  );

  const renderClash = ({ item }) => (
    <View style={styles.clashItem}>
      <Text>Clash: {item.event1.title} vs {item.event2.title}</Text>
      <Button
        title="Keep First"
        onPress={() => {
          dispatch({ type: 'RESOLVE_CLASH', payload: item.id });
          dispatch({
            type: 'SET_EVENTS',
            payload: events.filter((e) => e.id !== item.event2.id),
          });
        }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Animatable.Image
        animation="pulse"
        iterationCount="infinite"
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      />
      <Calendar
        markedDates={calendar}
        style={styles.calendar}
        theme={{
          selectedDayBackgroundColor: '#6200ee',
          todayTextColor: '#6200ee',
          arrowColor: '#6200ee',
        }}
      />
      <Animatable.View animation="fadeIn" duration={1000} style={styles.eventList}>
        <Text style={styles.header}>Upcoming Events</Text>
        {clashes.length > 0 && (
          <>
            <Text style={styles.subHeader}>Clashes</Text>
            <FlatList
              data={clashes}
              renderItem={renderClash}
              keyExtractor={(item) => item.id}
              style={styles.clashList}
            />
          </>
        )}
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
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
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginVertical: 20,
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
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#d32f2f',
  },
  eventItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,
  },
  clashItem: {
    padding: 10,
    backgroundColor: '#ffe6e6',
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  clashList: {
    marginBottom: 20,
  },
});

export default CalendarComponent;