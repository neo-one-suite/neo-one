import { upperCaseFirst, utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import { ActionJSON } from './action';
import { CallReceiptJSON } from './CallReceipt';
import { common } from './common';
import { ContractParameterJSON } from './contractParameter';
import { crypto } from './crypto';
import { InvocationResultJSON } from './invocationResult';
import { ABIFunction, AddressString, ContractParameter, RawAction, RawCallReceipt, RawInvocationResult } from './types';
import { JSONHelper } from './utils';
import { VMState } from './vm';

export const scriptHashToAddress = (scriptHash: string): AddressString =>
  crypto.scriptHashToAddress({
    addressVersion: common.NEO_ADDRESS_VERSION,
    scriptHash: common.stringToUInt160(scriptHash),
  });

export function convertCallReceipt(receipt: CallReceiptJSON): RawCallReceipt {
  return {
    result: convertInvocationResult(receipt.result),
    actions: receipt.actions.map((action, idx) =>
      convertAction(
        '0x​​​​​0000000000000000000000000000000000000000000000000000000000000000​​​​​',
        0,
        '0x​​​​​0000000000000000000000000000000000000000000000000000000000000000​​​​​',
        0,
        idx,
        action,
      ),
    ),
  };
}

export function convertAction(
  blockHash: string,
  blockIndex: number,
  transactionHash: string,
  transactionIndex: number,
  index: number,
  action: ActionJSON,
): RawAction {
  if (action.type === 'Log') {
    return {
      type: 'Log',
      version: action.version,
      blockIndex,
      blockHash,
      transactionIndex,
      transactionHash,
      index,
      globalIndex: JSONHelper.readUInt64(action.index),
      address: scriptHashToAddress(action.scriptHash),
      message: action.message,
    };
  }

  return {
    type: 'Notification',
    version: action.version,
    blockIndex,
    blockHash,
    transactionIndex,
    transactionHash,
    index,
    globalIndex: JSONHelper.readUInt64(action.index),
    address: scriptHashToAddress(action.scriptHash),
    args: convertContractParameters(action.args),
  };
}

export function convertInvocationResult(result: InvocationResultJSON): RawInvocationResult {
  if (result.state === VMState.Fault) {
    return {
      state: 'FAULT',
      gasConsumed: new BigNumber(result.gas_consumed),
      gasCost: new BigNumber(result.gas_cost),
      stack: convertContractParameters(result.stack),
      message: result.message,
    };
  }

  return {
    state: 'HALT',
    gasConsumed: new BigNumber(result.gas_consumed),
    gasCost: new BigNumber(result.gas_cost),
    stack: convertContractParameters(result.stack),
  };
}

export function convertContractParameters(
  parameters: ReadonlyArray<ContractParameterJSON>,
): ReadonlyArray<ContractParameter> {
  return parameters.map(convertContractParameter);
}

export function convertContractParameter(parameter: ContractParameterJSON): ContractParameter {
  switch (parameter.type) {
    case 'Array':
      return {
        type: 'Array',
        value: convertContractParameters(parameter.value),
      };
    case 'Boolean':
      return parameter;
    case 'ByteArray':
      return {
        type: 'Buffer',
        value: parameter.value,
      };
    case 'Hash160':
      return {
        type: 'Address',
        value: scriptHashToAddress(parameter.value),
      };
    case 'Hash256':
      return parameter;
    case 'Integer':
      return {
        type: 'Integer',
        value: new BN(parameter.value, 10),
      };
    case 'InteropInterface':
      return parameter;
    case 'PublicKey':
      return parameter;
    case 'Signature':
      return parameter;
    case 'String':
      return parameter;
    case 'Void':
      return parameter;
    default:
      utils.assertNever(parameter);
      throw new Error('For TS');
  }
}

export const bigNumberToBN = (value: BigNumber, decimals: number): BN => {
  const dBigNumber = new BigNumber(10 ** decimals);

  return new BN(value.times(dBigNumber).toString(), 10);
};

export const createForwardedValueFuncArgsName = (func: ABIFunction) => `forward${upperCaseFirst(func.name)}Args`;
export const createForwardedValueFuncReturnName = (func: ABIFunction) => `forward${upperCaseFirst(func.name)}Return`;
