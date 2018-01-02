/* @flow */
import type {
  ArrayABI,
  Param,
  ParamInternal,
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
} from '../types'; // eslint-disable-line
import { InvalidArgumentError } from '../errors';

import * as args from '../args';
import * as utils from '../utils';

const params = {
  // eslint-disable-next-line
  String: (param: ?Param, parameter: StringABI): ?ParamInternal =>
    args.assertString('String', param),
  // eslint-disable-next-line
  Hash160: (param: ?Param, parameter: Hash160ABI): ?ParamInternal =>
    args.assertHash160(param),
  // eslint-disable-next-line
  Hash256: (param: ?Param, parameter: Hash256ABI): ?ParamInternal =>
    args.assertHash256(param),
  // eslint-disable-next-line
  PublicKey: (param: ?Param, parameter: PublicKeyABI): ?ParamInternal =>
    args.assertPublicKey(param),
  // eslint-disable-next-line
  Integer: (param: ?Param, parameter: IntegerABI): ?ParamInternal => {
    const value = args.assertBigNumber(param);

    return utils.bigNumberToBN(value, parameter.decimals);
  },
  // eslint-disable-next-line
  Boolean: (param: ?Param, parameter: BooleanABI): ?ParamInternal =>
    args.assertBoolean(param),
  // eslint-disable-next-line
  ByteArray: (param: ?Param, parameter: ByteArrayABI): ?ParamInternal =>
    args.assertBuffer(param),
  // eslint-disable-next-line
  Signature: (param: ?Param, parameter: SignatureABI): ?ParamInternal =>
    args.assertBuffer(param),
  Array: (param: ?Param, parameter: ArrayABI): ?ParamInternal => {
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
  ): ?ParamInternal => {
    throw new InvalidArgumentError('InteropInterface is not a valid parameter');
  },
  // eslint-disable-next-line
  Void: (param: ?Param, parameter: VoidABI): ?ParamInternal => {
    if (param != null) {
      throw new InvalidArgumentError(`Expected Void: ${String(param)}`);
    }

    return param;
  },
};

export default params;
