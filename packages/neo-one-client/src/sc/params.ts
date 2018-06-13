import { common, Param as ScriptBuilderParam } from '@neo-one/client-core';
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
import * as utils from '../utils';

export const params = {
  String: (
    param: Param | null,
    parameter: StringABI,
  ): ScriptBuilderParam | null => args.assertString('String', param),
  Hash160: (
    param: Param | null,
    parameter: Hash160ABI,
  ): ScriptBuilderParam | null =>
    common.stringToUInt160(args.assertHash160(param)),
  Hash256: (
    param: Param | null,
    parameter: Hash256ABI,
  ): ScriptBuilderParam | null =>
    common.stringToUInt256(args.assertHash256(param)),
  PublicKey: (
    param: Param | null,
    parameter: PublicKeyABI,
  ): ScriptBuilderParam | null =>
    common.stringToECPoint(args.assertPublicKey(param)),
  Integer: (
    param: Param | null,
    parameter: IntegerABI,
  ): ScriptBuilderParam | null => {
    const value = args.assertBigNumber(param);
    return utils.bigNumberToBN(value, parameter.decimals);
  },
  Boolean: (
    param: Param | null,
    parameter: BooleanABI,
  ): ScriptBuilderParam | null => args.assertBoolean(param),
  ByteArray: (
    param: Param | null,
    parameter: ByteArrayABI,
  ): ScriptBuilderParam | null => Buffer.from(args.assertBuffer(param), 'hex'),
  Signature: (
    param: Param | null,
    parameter: SignatureABI,
  ): ScriptBuilderParam | null => Buffer.from(args.assertBuffer(param), 'hex'),
  Array: (
    param: Param | null,
    parameter: ArrayABI,
  ): ScriptBuilderParam | null => {
    if (!Array.isArray(param)) {
      throw new InvalidArgumentError(`Expected Array, found: ${String(param)}`);
    }
    const { value } = parameter;
    const checker = params[value.type] as any;
    return param.map((val) => checker(val, value));
  },
  InteropInterface: (
    param: Param | null,
    parameter: InteropInterfaceABI,
  ): ScriptBuilderParam | null => {
    throw new InvalidArgumentError('InteropInterface is not a valid parameter');
  },
  Void: (
    param: Param | null,
    parameter: VoidABI,
  ): ScriptBuilderParam | null => {
    if (param != null) {
      throw new InvalidArgumentError(`Expected Void: ${String(param)}`);
    }

    return param;
  },
};
