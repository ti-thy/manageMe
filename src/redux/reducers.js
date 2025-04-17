const initialState = {
    user: null,
    events: [],
    calendar: {},
  };
  
  export const rootReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'ADD_USER':
        return { ...state, user: action.payload };
      case 'ADD_EMAIL':
        const { email, events } = action.payload;
        const updatedUser = {
          ...state.user,
          emails: [...(state.user?.emails || []), email],
        };
        return {
          ...state,
          user: updatedUser,
          events: [...state.events, ...events],
        };
      default:
        return state;
    }
  };