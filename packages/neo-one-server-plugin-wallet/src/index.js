/* @flow */
import type MasterWalletResourceAdapter from './MasterWalletResourceAdapter';
import WalletPlugin from './WalletPlugin';

export { default as constants } from './constants';

export default WalletPlugin;

export type { MasterWalletResourceAdapter };
export type {
  SmartContract,
  SmartContractRegister,
} from './SmartContractResourceType';
export type { Wallet } from './WalletResourceType';
