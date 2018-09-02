import { createContextForSnippet } from '../../createContext';

export const createContext = () => createContextForSnippet('', { withTestHarness: true }).context;
