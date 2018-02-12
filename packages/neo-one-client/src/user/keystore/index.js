/* @flow */
export { default as LocalKeyStore } from './LocalKeyStore';
export { default as LocalMemoryStore } from './LocalMemoryStore';
export { default as LocalStringStore } from './LocalStringStore';

export type {
  Store as LocalStore,
  Wallet as LocalWallet,
} from './LocalKeyStore';
