import {
  ABIReturn,
  addressToScriptHash,
  AnyABI,
  ArrayABI,
  BooleanABI,
  BufferABI,
  common,
  ForwardValueABI,
  Hash160ABI,
  Hash256ABI,
  IntegerABI,
  MapABI,
  ObjectABI,
  Param,
  PublicKeyABI,
  ScriptBuilderParam,
  SignatureABI,
  StringABI,
  utils,
  VoidABI,
} from '@neo-one/client-common';
import * as args from '../args';
import { InvalidArgumentError } from '../errors';

export const params = {
  Any: (_name: string, _param: Param, _parameter: AnyABI): ScriptBuilderParam | undefined => undefined,
  String: (name: string, param: Param, parameter: StringABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined ? undefined : args.assertString(name, param),
  Address: (name: string, param: Param, parameter: Hash160ABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined
      ? undefined
      : common.stringToUInt160(addressToScriptHash(args.assertAddress(name, param))),
  Hash160: (name: string, param: Param, parameter: Hash160ABI): ScriptBuilderParam | undefined =>
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

    return utils.bigNumberToBN(value, parameter.decimals);
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
  Map: (name: string, param: Param, parameter: MapABI): ScriptBuilderParam | undefined => {
    if (parameter.optional && param === undefined) {
      return undefined;
    }

    const paramMap = args.assertMap(name, param);

    const { key, value } = parameter;
    // tslint:disable-next-line no-any
    const keyChecker = params[key.type] as any;
    // tslint:disable-next-line no-any
    const valueChecker = params[value.type] as any;

    const output = new Map<ScriptBuilderParam | undefined, ScriptBuilderParam | undefined>();
    paramMap.forEach((v, k) => {
      output.set(keyChecker(name, k, key), valueChecker(name, v, value));
    });

    return output;
  },
  Object: (name: string, param: Param, parameter: ObjectABI): ScriptBuilderParam | undefined => {
    if (parameter.optional && param === undefined) {
      return undefined;
    }

    const paramObject = args.assertObject(name, param);

    return Object.entries(paramObject).reduce<{ readonly [key: string]: ScriptBuilderParam }>(
      (acc, [keyParam, val]) => {
        const key = args.assertString(name, keyParam);
        const value = parameter.properties[key] as ABIReturn | undefined;
        if (value === undefined) {
          throw new Error('Invalid abi');
        }
        // tslint:disable-next-line no-any
        const checker = params[value.type] as any;

        return {
          ...acc,
          [key]: checker(name, val, value),
        };
      },
      {},
    );
  },
  Void: (name: string, param: Param, _parameter: VoidABI): ScriptBuilderParam | undefined => {
    if (param !== undefined) {
      throw new InvalidArgumentError('Void', name, param);
    }

    return param;
  },
  ForwardValue: (name: string, param: Param, parameter: ForwardValueABI): ScriptBuilderParam | undefined =>
    parameter.optional && param === undefined ? undefined : args.assertForwardValue(name, param).converted,
};
