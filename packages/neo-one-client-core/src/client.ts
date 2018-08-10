import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import { ActionJSON } from './action';
import { CallReceiptJSON } from './CallReceipt';
import { ContractParameterJSON } from './contractParameter';
import { InvocationResultJSON } from './invocationResult';
import { ActionRaw, ContractParameter, RawCallReceipt, RawInvocationResult } from './types';
import { JSONHelper } from './utils';
import { VMState } from './vm';

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
): ActionRaw {
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
      scriptHash: action.scriptHash,
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
    scriptHash: action.scriptHash,
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
  if (parameter.type === 'Integer') {
    return {
      type: 'Integer',
      value: new BN(parameter.value, 10),
    };
  }
  if (parameter.type === 'Array') {
    return {
      type: 'Array',
      value: convertContractParameters(parameter.value),
    };
  }

  return parameter;
}

export const bigNumberToBN = (value: BigNumber, decimals: number): BN => {
  const dBigNumber = new BigNumber(10 ** decimals);

  return new BN(value.times(dBigNumber).toString(), 10);
};
