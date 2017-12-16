/* @flow */
import type {
  ABI,
  BasicAccount,
  BasicBlock,
  BasicClientProvider,
  BasicInvocationResult,
  BasicSmartContract,
  BasicTransaction,
} from './types';
import BasicClientBase from './BasicClientBase';
import { JSONRPCBasicClientProvider, JSONRPCHTTPProvider } from './json';

import createSmartContract from './createSmartContract';

export type BasicClientOptions = {|
  provider?: BasicClientProvider,
  addressVersion?: number,
  privateKeyVersion?: number,
|};

export default class BasicClient extends BasicClientBase<
  BasicBlock,
  BasicTransaction,
  BasicAccount,
  BasicInvocationResult,
  BasicSmartContract,
  BasicClientProvider,
> {
  constructor(optionsIn?: BasicClientOptions) {
    const options = optionsIn || {};
    super({
      provider:
        options.provider ||
        new JSONRPCBasicClientProvider(
          new JSONRPCHTTPProvider('https://neotracker.io/rpc'),
        ),
      addressVersion: options.addressVersion,
      privateKeyVersion: options.privateKeyVersion,
    });
  }

  contract(abi: ABI): BasicSmartContract {
    return createSmartContract({ client: this, abi, isBasicClient: true });
  }
}
