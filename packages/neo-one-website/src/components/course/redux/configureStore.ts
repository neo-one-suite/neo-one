import { createStore } from 'redux';
import { persistStore } from 'redux-persist';
import { root } from './reducers';

export const configureStore = () => {
  const store = createStore(root);
  const persistor = persistStore(store);

  return { store, persistor };
};
