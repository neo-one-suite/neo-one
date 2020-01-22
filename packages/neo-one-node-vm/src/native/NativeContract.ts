import { PolicyContract } from './PolicyContract';
import { GasToken, NeoToken } from './tokens';

export interface NativeContract {
  readonly 'Neo.Native.Policy': PolicyContract;
  readonly 'Neo.Native.Tokens.GAS': GasToken;
  readonly 'Neo.Native.Tokens.NEO': NeoToken;
}

export const NativeContract: NativeContract = {
  'Neo.Native.Policy': new PolicyContract(),
  'Neo.Native.Tokens.GAS': new GasToken(),
  'Neo.Native.Tokens.NEO': new NeoToken(),
};
