import { createStore } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import * as SecureStore from 'expo-secure-store';
import { rootReducer } from './reducers';

const persistConfig = {
  key: 'root', // Valid key (alphanumeric)
  storage: {
    setItem: async (key, value) => SecureStore.setItemAsync(key, value),
    getItem: async (key) => SecureStore.getItemAsync(key),
    removeItem: async (key) => SecureStore.deleteItemAsync(key),
  },
};

const persistedReducer = persistReducer(persistConfig, rootReducer);
const store = createStore(persistedReducer);
const persistor = persistStore(store);

export { store, persistor };