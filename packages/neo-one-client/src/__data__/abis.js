/* @flow */
import type {
  ABIEvent,
  ABIFunction,
  ABIParameter,
  ABIReturn,
  ABI,
} from '../types';

export const returns = {
  Signature: { type: 'Signature' },
  Boolean: { type: 'Boolean' },
  Hash160: { type: 'Hash160' },
  Hash256: { type: 'Hash256' },
  ByteArray: { type: 'ByteArray' },
  PublicKey: { type: 'PublicKey' },
  String: { type: 'String' },
  InteropInterface: { type: 'InteropInterface' },
  Void: { type: 'Void' },
  Integer: { type: 'Integer', decimals: 7 },
  Array: { type: 'Array', value: { type: 'String' } },
};

export const parameters = {
  Signature: { name: 'signatureName', type: 'Signature' },
  Boolean: { name: 'booleanName', type: 'Boolean' },
  Integer: { name: 'intName', type: 'Integer', decimals: 7 },
  Hash160: { name: 'hash160Name', type: 'Hash160' },
  Hash256: { name: 'hash256Name', type: 'Hash256' },
  ByteArray: { name: 'byteName', type: 'ByteArray' },
  PublicKey: { name: 'pubkeyName', type: 'PublicKey' },
  String: { name: 'stringName', type: 'String' },
  Array: {
    name: 'arrayName',
    type: 'Array',
    value: {
      name: 'stringName',
      type: 'String',
    },
  },
  InteropInterface: { name: 'interopName', type: 'InteropInterface' },
  Void: { name: 'voidName', type: 'Void' },
};

export const abiFunction = (
  constant: boolean = false,
  params: Array<ABIParameter> = [parameters.String],
  verify: boolean = false,
  name: string = 'funcName',
  returnType: ABIReturn = returns.Void,
): ABIFunction => ({
  name,
  constant,
  parameters: params,
  verify,
  returnType,
});

export const abiEvent = (
  name: string = 'eventName',
  params: Array<ABIParameter> = [parameters.String],
): ABIEvent => ({
  name,
  parameters: params,
});

export const abi = (
  functions: Array<ABIFunction> = [abiFunction()],
  events?: Array<ABIEvent> = [],
): ABI => ({
  functions,
  events,
});
