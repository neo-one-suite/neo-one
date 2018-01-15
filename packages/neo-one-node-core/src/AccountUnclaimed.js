/* @flow */
import AccountInput, {
  type AccountInputAdd,
  type AccountInputKey,
  type AccountInputsKey,
} from './AccountInput';

export type AccountUnclaimedAdd = AccountInputAdd;
export type AccountUnclaimedKey = AccountInputKey;
export type AccountUnclaimedsKey = AccountInputsKey;

export default class AccountUnclaimed extends AccountInput {}
