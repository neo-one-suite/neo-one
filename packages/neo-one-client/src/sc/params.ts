import { bigNumberToBN, common, ScriptBuilderParam } from '@neo-one/client-core';
import * as args from '../args';
import { InvalidArgumentError } from '../errors';
import { addressToScriptHash } from '../helpers';
import {
  AddressABI,
  ArrayABI,
  BooleanABI,
  BufferABI,
  Hash256ABI,
  IntegerABI,
  Param,
  PublicKeyABI,
  SignatureABI,
  StringABI,
  VoidABI,
} from '../types';

export const params = {
  String: (name: string, param: Param, parameter: StringABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined ? undefined : args.assertString(name, param),
  Address: (name: string, param: Param, parameter: AddressABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined
      ? undefined
      : common.stringToUInt160(addressToScriptHash(args.assertAddress(name, param))),
  Hash256: (name: string, param: Param, parameter: Hash256ABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined ? undefined : common.stringToUInt256(args.assertHash256(name, param)),
  PublicKey: (name: string, param: Param, parameter: PublicKeyABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined ? undefined : common.stringToECPoint(args.assertPublicKey(name, param)),
  Integer: (name: string, param: Param, parameter: IntegerABI): ScriptBuilderParam | undefined => {
    if (parameter.optional && param === undefined) {
      return undefined;
    }

    const value = args.assertBigNumber(name, param);

    return bigNumberToBN(value, parameter.decimals);
  },
  Boolean: (name: string, param: Param, parameter: BooleanABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined ? undefined : args.assertBoolean(name, param),
  Buffer: (name: string, param: Param, parameter: BufferABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined ? undefined : Buffer.from(args.assertBuffer(name, param), 'hex'),
  Signature: (name: string, param: Param, parameter: SignatureABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined ? undefined : Buffer.from(args.assertBuffer(name, param), 'hex'),
  Array: (name: string, param: Param, parameter: ArrayABI): ScriptBuilderParam | undefined => {
    if (parameter.optional && param === undefined) {
      return undefined;
    }

    const paramArray = args.assertArray(name, param);

    const { value } = parameter;
    // tslint:disable-next-line no-any
    const checker = params[value.type] as any;

    return paramArray.map((val) => checker(name, val, value));
  },
  Void: (name: string, param: Param, _parameter: VoidABI): ScriptBuilderParam | undefined => {
    if (param !== undefined) {
      throw new InvalidArgumentError('Void', name, param);
    }

    return param;
  },
};
