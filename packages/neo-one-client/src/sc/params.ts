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
  String: (param: Param | undefined, _parameter: StringABI): ScriptBuilderParam | undefined =>
    args.assertString('String', param),
  Hash160: (param: Param | undefined, _parameter: Hash160ABI): ScriptBuilderParam | undefined =>
    common.stringToUInt160(args.assertHash160(param)),
  Hash256: (param: Param | undefined, _parameter: Hash256ABI): ScriptBuilderParam | undefined =>
    common.stringToUInt256(args.assertHash256(param)),
  PublicKey: (param: Param | undefined, _parameter: PublicKeyABI): ScriptBuilderParam | undefined =>
    common.stringToECPoint(args.assertPublicKey(param)),
  Integer: (param: Param | undefined, _parameter: IntegerABI): ScriptBuilderParam | undefined => {
    const value = args.assertBigNumber(param);

    return utils.bigNumberToBN(value, _parameter.decimals);
  },
  Boolean: (param: Param | undefined, _parameter: BooleanABI): ScriptBuilderParam | undefined =>
    args.assertBoolean(param),
  ByteArray: (param: Param | undefined, _parameter: ByteArrayABI): ScriptBuilderParam | undefined =>
    Buffer.from(args.assertBuffer(param), 'hex'),
  Signature: (param: Param | undefined, _parameter: SignatureABI): ScriptBuilderParam | undefined =>
    Buffer.from(args.assertBuffer(param), 'hex'),
  Array: (param: Param | undefined, parameter: ArrayABI): ScriptBuilderParam | undefined => {
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
