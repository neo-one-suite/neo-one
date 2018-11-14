import { createCompilerHost } from '@neo-one/smart-contract-compiler-node';
import { createContextForSnippet } from '../../createContext';

export const createContext = () => createContextForSnippet('', createCompilerHost(), { withTestHarness: true }).context;
