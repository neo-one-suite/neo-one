/* @flow */
import { type Param as ScriptBuilderParam, common } from '@neo-one/client-core';

import type {
  ArrayABI,
  Param,
  SignatureABI,
  BooleanABI,
  Hash160ABI,
  Hash256ABI,
  ByteArrayABI,
  PublicKeyABI,
  StringABI,
  InteropInterfaceABI,
  VoidABI,
  IntegerABI,
} from '../types';
import { InvalidArgumentError } from '../errors';

import * as args from '../args';
import * as utils from '../utils';

const params = {
  // eslint-disable-next-line
  String: (param: ?Param, parameter: StringABI): ?ScriptBuilderParam =>
    args.assertString('String', param),
  // eslint-disable-next-line
  Hash160: (param: ?Param, parameter: Hash160ABI): ?ScriptBuilderParam =>
    common.stringToUInt160(args.assertHash160(param)),
  // eslint-disable-next-line
  Hash256: (param: ?Param, parameter: Hash256ABI): ?ScriptBuilderParam =>
    common.stringToUInt256(args.assertHash256(param)),
  // eslint-disable-next-line
  PublicKey: (param: ?Param, parameter: PublicKeyABI): ?ScriptBuilderParam =>
    common.stringToECPoint(args.assertPublicKey(param)),
  Integer: (param: ?Param, parameter: IntegerABI): ?ScriptBuilderParam => {
    const value = args.assertBigNumber(param);

    return utils.bigNumberToBN(value, parameter.decimals);
  },
  // eslint-disable-next-line
  Boolean: (param: ?Param, parameter: BooleanABI): ?ScriptBuilderParam =>
    args.assertBoolean(param),
  // eslint-disable-next-line
  ByteArray: (param: ?Param, parameter: ByteArrayABI): ?ScriptBuilderParam =>
    Buffer.from(args.assertBuffer(param), 'hex'),
  // eslint-disable-next-line
  Signature: (param: ?Param, parameter: SignatureABI): ?ScriptBuilderParam =>
    Buffer.from(args.assertBuffer(param), 'hex'),
  Array: (param: ?Param, parameter: ArrayABI): ?ScriptBuilderParam => {
    if (!Array.isArray(param)) {
      throw new InvalidArgumentError(`Expected Array, found: ${String(param)}`);
    }
    const { value } = parameter;
    const checker = params[value.type];
    return param.map(val => checker(val, (value: $FlowFixMe)));
  },
  InteropInterface: (
    param: ?Param,
    // eslint-disable-next-line
    parameter: InteropInterfaceABI,
  ): ?ScriptBuilderParam => {
    throw new InvalidArgumentError('InteropInterface is not a valid parameter');
  },
  // eslint-disable-next-line
  Void: (param: ?Param, parameter: VoidABI): ?ScriptBuilderParam => {
    if (param != null) {
      throw new InvalidArgumentError(`Expected Void: ${String(param)}`);
    }

    return param;
  },
};

export default params;
