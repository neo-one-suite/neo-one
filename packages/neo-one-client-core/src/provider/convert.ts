import {
  ActionJSON,
  CallReceiptJSON,
  ContractParameter,
  ContractParameterJSON,
  InvocationResultJSON,
  JSONHelper,
  RawAction,
  RawCallReceipt,
  RawInvocationResult,
  scriptHashToAddress,
  VMState,
} from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import BN from 'bn.js';

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

export function convertContractParameters(parameters: readonly ContractParameterJSON[]): readonly ContractParameter[] {
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
    case 'Map':
      return {
        type: 'Map',
        value: parameter.value.map<[ContractParameter, ContractParameter]>(([key, val]) => [
          convertContractParameter(key),
          convertContractParameter(val),
        ]),
      };
    case 'PublicKey':
      return parameter;
    case 'Signature':
      return parameter;
    case 'String':
      return parameter;
    case 'Void':
      return parameter;
    /* istanbul ignore next */
    default:
      utils.assertNever(parameter);
      throw new Error('For TS');
  }
}
