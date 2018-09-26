import { configureStore } from './configureStore';

export * from './reducers';

const { store, persistor } = configureStore();

export { store, persistor };
