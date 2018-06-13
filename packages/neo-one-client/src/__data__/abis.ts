import { ABI, ABIEvent, ABIFunction, ABIParameter, ABIReturn } from '../types';

export const returns = {
  Signature: { type: 'Signature' } as ABIReturn,
  Boolean: { type: 'Boolean' } as ABIReturn,
  Hash160: { type: 'Hash160' } as ABIReturn,
  Hash256: { type: 'Hash256' } as ABIReturn,
  ByteArray: { type: 'ByteArray' } as ABIReturn,
  PublicKey: { type: 'PublicKey' } as ABIReturn,
  String: { type: 'String' } as ABIReturn,
  InteropInterface: { type: 'InteropInterface' } as ABIReturn,
  Void: { type: 'Void' } as ABIReturn,
  Integer: { type: 'Integer', decimals: 7 } as ABIReturn,
  Array: { type: 'Array', value: { type: 'String' } } as ABIReturn,
};

export const parameters = {
  Signature: { name: 'signatureName', type: 'Signature' } as ABIParameter,
  Boolean: { name: 'booleanName', type: 'Boolean' } as ABIParameter,
  Integer: { name: 'intName', type: 'Integer', decimals: 7 } as ABIParameter,
  Hash160: { name: 'hash160Name', type: 'Hash160' } as ABIParameter,
  Hash256: { name: 'hash256Name', type: 'Hash256' } as ABIParameter,
  ByteArray: { name: 'byteName', type: 'ByteArray' } as ABIParameter,
  PublicKey: { name: 'pubkeyName', type: 'PublicKey' } as ABIParameter,
  String: { name: 'stringName', type: 'String' } as ABIParameter,
  Array: {
    name: 'arrayName',
    type: 'Array',
    value: {
      name: 'stringName',
      type: 'String',
    },
  } as ABIParameter,

  InteropInterface: {
    name: 'interopName',
    type: 'InteropInterface',
  } as ABIParameter,
  Void: { name: 'voidName', type: 'Void' } as ABIParameter,
};

export const abiFunction = (
  constant: boolean = false,
  params: ABIParameter[] = [parameters.String],
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
  params: ABIParameter[] = [parameters.String],
): ABIEvent => ({
  name,
  parameters: params,
});

export const abi = (
  functions: ABIFunction[] = [abiFunction()],
  events: ABIEvent[] = [],
): ABI => ({
  functions,
  events,
});
