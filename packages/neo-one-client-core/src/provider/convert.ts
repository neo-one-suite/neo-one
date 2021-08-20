import {
  CallReceiptJSON,
  common,
  ContractParameter,
  ContractParameterJSON,
  JSONHelper,
  LogJSON,
  NotificationJSON,
  RawCallReceipt,
  RawLog,
  RawNotification,
  scriptHashToAddress,
} from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
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
    position: log.position,
  };
}

export function convertNotification(notification: NotificationJSON): RawNotification {
  return {
    type: 'Notification',
    scriptHash: common.stringToUInt160(notification.scripthash),
    eventName: notification.eventname,
    state: typeof notification.state === 'string' ? notification.state : convertContractParameters(notification.state),
  };
}

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
