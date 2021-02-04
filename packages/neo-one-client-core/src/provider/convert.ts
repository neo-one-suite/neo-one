import {
  // ActionJSON,
  CallReceiptJSON,
  common,
  ContractParameter,
  ContractParameterJSON,
  // InvocationResultJSON,
  JSONHelper,
  LogJSON,
  NotificationJSON,
  // RawAction,
  RawCallReceipt,
  RawLog,
  RawNotification,
  RawStackItem,
  scriptHashToAddress,
  StackItemJSON,
} from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';

export function convertCallReceipt(receipt: CallReceiptJSON): RawCallReceipt {
  return {
    script: JSONHelper.readBuffer(receipt.script),
    state: receipt.state,
    gasConsumed: common.fixedToDecimal(new BN(receipt.gasconsumed), 0),
    stack: typeof receipt.stack === 'string' ? receipt.stack : receipt.stack.map(convertContractParameter),
    notifications: receipt.notifications.map(convertNotification),
    logs: receipt.logs.map(convertLog),
  };
}

export function convertLog(log: LogJSON): RawLog {
  return {
    type: 'Log',
    containerHash: log.containerhash ? common.stringToUInt256(log.containerhash) : undefined,
    callingScriptHash: common.stringToUInt160(log.callingscripthash),
    message: log.message,
    // position: log.position,
  };
}

export function convertStackItem(item: StackItemJSON): RawStackItem {
  switch (item.type) {
    case 'Any':
      return { type: 'Any', value: undefined };
    case 'Boolean':
      return { type: 'Boolean', value: item.value };
    case 'Pointer':
      return { type: 'Pointer', value: item.value };
    case 'Integer':
      return { type: 'Integer', value: new BigNumber(item.value) };
    case 'Buffer':
      return { type: 'Buffer', value: Buffer.from(item.value, 'hex') };
    case 'ByteString':
      return { type: 'ByteString', value: Buffer.from(item.value, 'base64').toString('ascii') };
    case 'Array':
      return { type: 'Array', value: item.value.map(convertStackItem) };
    case 'Map':
      return {
        type: 'Map',
        value: item.value.map<readonly [RawStackItem, RawStackItem]>(({ key, value }) => [
          convertStackItem(key),
          convertStackItem(value),
        ]),
      };
    default:
      utils.assertNever(item);
      throw new Error('Problem converting stack item');
  }
}

export function convertNotification(notification: NotificationJSON): RawNotification {
  return {
    type: 'Notification',
    scriptHash: common.stringToUInt160(notification.scripthash),
    eventName: notification.eventname,
    state: typeof notification.state === 'string' ? notification.state : convertContractParameters(notification.state),
  };
}

// TODO: delete or re-implement
// export function convertAction(
//   blockHash: string,
//   blockIndex: number,
//   transactionHash: string,
//   transactionIndex: number,
//   index: number,
//   action: ActionJSON,
// ): RawAction {
//   if (action.type === 'Log') {
//     return {
//       type: 'Log',
//       version: action.version,
//       blockIndex,
//       blockHash,
//       transactionIndex,
//       transactionHash,
//       index,
//       globalIndex: JSONHelper.readUInt64(action.index),
//       address: scriptHashToAddress(action.scriptHash),
//       message: action.message,
//     };
//   }

//   return {
//     type: 'Notification',
//     version: action.version,
//     blockIndex,
//     blockHash,
//     transactionIndex,
//     transactionHash,
//     index,
//     globalIndex: JSONHelper.readUInt64(action.index),
//     address: scriptHashToAddress(action.scriptHash),
//     args: convertContractParameters(action.args),
//   };
// }

// export function convertInvocationResult(result: InvocationResultJSON): RawInvocationResult {
//   if (result.state === 'FAULT') {
//     return {
//       state: 'FAULT',
//       gasConsumed: new BigNumber(result.gas_consumed),
//       stack: convertContractParameters(result.stack),
//       message: result.message,
//       script: result.script,
//     };
//   }

//   return {
//     state: 'HALT',
//     gasConsumed: new BigNumber(result.gas_consumed),
//     stack: convertContractParameters(result.stack),
//     script: result.script,
//   };
// }

export function convertContractParameters(parameters: readonly ContractParameterJSON[]): readonly ContractParameter[] {
  return parameters.map(convertContractParameter);
}

export function convertContractParameter(parameter: ContractParameterJSON): ContractParameter {
  switch (parameter.type) {
    case 'Any':
      return {
        type: 'Any',
        value: undefined,
      };
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
        type: 'Hash160',
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
        value: parameter.value.map<readonly [ContractParameter, ContractParameter]>(([key, val]) => [
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
