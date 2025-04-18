import { createStore } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import * as SecureStore from 'expo-secure-store';
import { rootReducer } from './reducers';

// Custom storage with key sanitization for SecureStore
const secureStorage = {
  async setItem(key, value) {
    const safeKey = key.replace(/[^a-zA-Z0-9_.-]/g, "_");
    await SecureStore.setItemAsync(safeKey, value);
  },
  async getItem(key) {
    const safeKey = key.replace(/[^a-zA-Z0-9_.-]/g, "_");
    return await SecureStore.getItemAsync(safeKey);
  },
  async removeItem(key) {
    const safeKey = key.replace(/[^a-zA-Z0-9_.-]/g, "_");
    await SecureStore.deleteItemAsync(safeKey);
  }
};

const persistConfig = {
  key: 'root',
  storage: secureStorage,
  // You can add blacklist/whitelist here if needed
};

const persistedReducer = persistReducer(persistConfig, rootReducer);
const store = createStore(persistedReducer);
const persistor = persistStore(store);

export { store, persistor };