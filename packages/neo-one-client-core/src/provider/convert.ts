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
} from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';

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
  return {
    state: result.state,
    gasConsumed: new BigNumber(result.gas_consumed),
    stack: convertContractParameters(result.stack),
    script: result.script,
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
        value: parameter.value.map<readonly [ContractParameter, ContractParameter]>(
          ([key, val]) => [convertContractParameter(key), convertContractParameter(val)] as const,
        ),
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
