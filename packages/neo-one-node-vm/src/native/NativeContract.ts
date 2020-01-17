import { PolicyContract } from './PolicyContract';
import { GasToken, NeoToken } from './tokens';

export interface NativeContract {
  readonly 'Neo.Native.Policy': PolicyContract;
  readonly 'Neo.Native.Tokens.Gas': GasToken;
  readonly 'Neo.Native.Tokens.Neo': NeoToken;
}

export const NativeContract: NativeContract = {
  'Neo.Native.Policy': new PolicyContract(),
  'Neo.Native.Tokens.Gas': new GasToken(),
  'Neo.Native.Tokens.Neo': new NeoToken(),
};
