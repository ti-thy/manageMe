// src/redux/reducers.js
const initialState = {
  user: { username: '', emails: [] },
  events: [],
  clashes: [],
  isLoading: false,
  calendar: {},
};

export const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'ADD_USER':
      return { ...state, user: { ...action.payload, emails: action.payload.emails || [] } };
    case 'ADD_EMAIL':
      const { email, events } = action.payload;
      const updatedUser = {
        ...state.user,
        emails: [...state.user.emails, email],
      };
      const newEvents = events.map((event) => ({
        ...event,
        accessToken: events[0]?.accessToken || '',
      }));
      const markedDates = newEvents.reduce((acc, event) => {
        const date = event.start.split('T')[0];
        acc[date] = { marked: true, dotColor: '#6200ee' };
        return acc;
      }, { ...state.calendar });
      return {
        ...state,
        user: updatedUser,
        events: [...state.events, ...newEvents],
        calendar: markedDates,
      };
    case 'SET_EVENTS':
      const updatedDates = action.payload.reduce((acc, event) => {
        const date = event.start.split('T')[0];
        acc[date] = { marked: true, dotColor: '#6200ee' };
        return acc;
      }, {});
      return {
        ...state,
        events: action.payload,
        calendar: updatedDates,
      };
    case 'ADD_CLASH':
      return { ...state, clashes: [...state.clashes, action.payload] };
    case 'RESOLVE_CLASH':
      return {
        ...state,
        clashes: state.clashes.filter((c) => c.id !== action.payload),
        events: state.events.filter((e) => e.id !== action.payload.split('-')[1]),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};