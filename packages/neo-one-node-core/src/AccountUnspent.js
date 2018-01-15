/* @flow */
import AccountInput, {
  type AccountInputAdd,
  type AccountInputKey,
  type AccountInputsKey,
} from './AccountInput';

export type AccountUnspentAdd = AccountInputAdd;
export type AccountUnspentKey = AccountInputKey;
export type AccountUnspentsKey = AccountInputsKey;

export default class AccountUnspent extends AccountInput {}
