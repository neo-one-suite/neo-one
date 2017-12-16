/* @flow */
import type BigNumber from 'bignumber.js';
import {
  type Input as InputModel,
  type UInt160,
  JSONHelper,
  common,
} from '@neo-one/core';

import type {
  Account,
  Action,
  Block,
  ClientProvider,
  GetActionsFilter,
  InvocationResult,
  Output,
  StorageItem,
  Transaction,
} from '../types';
import JSONRPCBasicClientBaseProvider from './JSONRPCBasicClientBaseProvider';

export default class JSONRPCClientProvider extends JSONRPCBasicClientBaseProvider<
  Block,
  Transaction,
  Account,
  InvocationResult,
> implements ClientProvider {
  getOutput(input: InputModel): Promise<Output> {
    return this._provider.request({
      method: 'getoutput',
      params: [JSONHelper.writeUInt256(input.hash), input.index],
    });
  }

  getClaimAmount(input: InputModel): Promise<BigNumber> {
    return this._provider
      .request({
        method: 'getclaimamount',
        params: [JSONHelper.writeUInt256(input.hash), input.index],
      })
      .then(res => common.fixed8ToDecimal(JSONHelper.readFixed8(res)));
  }

  getAllStorage(hash: UInt160): Promise<Array<StorageItem>> {
    return this._provider.request({
      method: 'getallstorage',
      params: [JSONHelper.writeUInt160(hash)],
    });
  }

  getActions(filter: {|
    ...GetActionsFilter,
    scriptHash?: UInt160,
  |}): Promise<Array<Action>> {
    return this._provider.request({
      method: 'getactions',
      params: [
        {
          ...filter,
          scriptHash:
            filter.scriptHash == null
              ? undefined
              : JSONHelper.writeUInt160((filter.scriptHash: $FlowFixMe)),
        },
      ],
    });
  }

  testInvocation(value: Buffer): Promise<InvocationResult> {
    return this._provider.request({
      method: 'testinvocation',
      params: [JSONHelper.writeBuffer(value)],
    });
  }
}
