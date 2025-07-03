import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import authReducer from './authSlice';
import postsReducer from './postsSlice';
import organizationsReducer from './organizationsSlice';
import uiReducer from './uiSlice';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { setHasHydrated } from './authSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'posts', 'organizations', 'ui'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  posts: postsReducer,
  organizations: organizationsReducer,
  ui: uiReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// Listen for rehydration and set hasHydrated flag
let hasSetHydrated = false;
store.subscribe(() => {
  const state = store.getState();
  if (!hasSetHydrated && state._persist && state._persist.rehydrated && !state.auth.hasHydrated) {
    hasSetHydrated = true;
    store.dispatch(setHasHydrated(true));
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 