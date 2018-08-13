import { bigNumberToBN, common, ScriptBuilderParam } from '@neo-one/client-core';
import * as args from '../args';
import { InvalidArgumentError } from '../errors';
import {
  ArrayABI,
  BooleanABI,
  ByteArrayABI,
  Hash160ABI,
  Hash256ABI,
  IntegerABI,
  InteropInterfaceABI,
  Param,
  PublicKeyABI,
  SignatureABI,
  StringABI,
  VoidABI,
} from '../types';

export const params = {
  String: (param: Param | undefined, parameter: StringABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined ? undefined : args.assertString('String', param),
  Hash160: (param: Param | undefined, parameter: Hash160ABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined ? undefined : common.stringToUInt160(args.assertHash160(param)),
  Hash256: (param: Param | undefined, parameter: Hash256ABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined ? undefined : common.stringToUInt256(args.assertHash256(param)),
  PublicKey: (param: Param | undefined, parameter: PublicKeyABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined ? undefined : common.stringToECPoint(args.assertPublicKey(param)),
  Integer: (param: Param | undefined, parameter: IntegerABI): ScriptBuilderParam | undefined => {
    if (parameter.optional && param === undefined) {
      return undefined;
    }

    const value = args.assertBigNumber(param);

    return bigNumberToBN(value, parameter.decimals);
  },
  Boolean: (param: Param | undefined, parameter: BooleanABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined ? undefined : args.assertBoolean(param),
  ByteArray: (param: Param | undefined, parameter: ByteArrayABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined ? undefined : Buffer.from(args.assertBuffer(param), 'hex'),
  Signature: (param: Param | undefined, parameter: SignatureABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined ? undefined : Buffer.from(args.assertBuffer(param), 'hex'),
  Array: (param: Param | undefined, parameter: ArrayABI): ScriptBuilderParam | undefined => {
    if (parameter.optional && param === undefined) {
      return undefined;
    }

    if (!Array.isArray(param)) {
      throw new InvalidArgumentError(`Expected Array, found: ${String(param)}`);
    }
    const { value } = parameter;
    // tslint:disable-next-line no-any
    const checker = params[value.type] as any;

    return param.map((val) => checker(val, value));
  },
  InteropInterface: (_param: Param | undefined, _parameter: InteropInterfaceABI): ScriptBuilderParam | undefined => {
    throw new InvalidArgumentError('InteropInterface is not a valid parameter');
  },
  Void: (param: Param | undefined, _parameter: VoidABI): ScriptBuilderParam | undefined => {
    if (param !== undefined) {
      throw new InvalidArgumentError(`Expected Void: ${String(param)}`);
    }

    return param;
  },
};
