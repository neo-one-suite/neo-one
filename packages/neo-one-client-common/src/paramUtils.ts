// tslint:disable no-any
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import _ from 'lodash';
import stringify from 'safe-stable-stringify';
import { common } from './common';
import { InvalidParamError } from './errors';
import { ForwardValue, Param, ParamToCallbacks, ScriptBuilderParam, ScriptBuilderParamToCallbacks } from './types';

export const scriptBuilderParamTo = <T>(param: ScriptBuilderParam, callbacks: ScriptBuilderParamToCallbacks<T>): T => {
  if (param === undefined) {
    return callbacks.undefined();
  }

  if (Array.isArray(param)) {
    return callbacks.array(param);
  }

  if (param instanceof Map) {
    return callbacks.map(param);
  }

  if (common.isUInt160(param)) {
    return callbacks.uInt160(param);
  }

  if (common.isUInt256(param)) {
    return callbacks.uInt256(param);
  }

  if (common.isECPoint(param)) {
    return callbacks.ecPoint(param);
  }

  if (typeof param === 'number') {
    return callbacks.number(param);
  }

  if (BN.isBN(param)) {
    return callbacks.bn(param);
  }

  if (typeof param === 'string') {
    return callbacks.string(param);
  }

  if (typeof param === 'boolean') {
    return callbacks.boolean(param);
  }

  if (param instanceof Buffer) {
    return callbacks.buffer(param);
  }

  // tslint:disable-next-line strict-type-predicates
  if (typeof param === 'object') {
    return callbacks.object(param);
  }
  /* istanbul ignore next */
  throw new InvalidParamError(typeof param);
};

export const isForwardValue = (value: any): value is ForwardValue => value.name !== undefined;

export const paramTo = <T>(param: Param, callbacks: ParamToCallbacks<T>): T => {
  if (param === undefined) {
    return callbacks.undefined();
  }

  if (Array.isArray(param)) {
    return callbacks.array(param);
  }

  if (param instanceof Map) {
    return callbacks.map(param);
  }

  if (typeof param === 'string') {
    return callbacks.string(param);
  }

  if (typeof param === 'boolean') {
    return callbacks.boolean(param);
  }

  if (BigNumber.isBigNumber(param)) {
    return callbacks.bigNumber(param);
  }

  if (isForwardValue(param)) {
    return callbacks.forwardValue(param);
  }

  // tslint:disable-next-line strict-type-predicates
  if (typeof param === 'object') {
    return callbacks.object(param);
  }
  /* istanbul ignore next */
  throw new InvalidParamError(typeof param);
};

export interface SerializedScriptBuilderParamArray extends Array<SerializedScriptBuilderParam> {}
export interface SerializedScriptBuilderParamObject extends Record<string, SerializedScriptBuilderParam> {}
export type SerializedScriptBuilderParam =
  | { readonly type: 'undefined' }
  | { readonly type: 'BN'; readonly value: string }
  | { readonly type: 'number'; readonly value: number }
  | { readonly type: 'UInt160'; readonly value: string }
  | { readonly type: 'UInt256'; readonly value: string }
  | { readonly type: 'ECPoint'; readonly value: string }
  | { readonly type: 'string'; readonly value: string }
  | { readonly type: 'Buffer'; readonly value: string }
  | { readonly type: 'boolean'; readonly value: boolean }
  | { readonly type: 'Array'; readonly value: SerializedScriptBuilderParamArray }
  | { readonly type: 'Map'; readonly value: SerializedScriptBuilderParamObject }
  | { readonly type: 'object'; readonly value: SerializedScriptBuilderParamObject };

export const serializeScriptBuilderParam = (paramIn: ScriptBuilderParam): SerializedScriptBuilderParam =>
  scriptBuilderParamTo<SerializedScriptBuilderParam>(paramIn, {
    undefined: () => ({ type: 'undefined' }),
    array: (param) => ({ type: 'Array', value: param.map(serializeScriptBuilderParam) }),
    map: (param) => ({
      type: 'Map',
      value: _.fromPairs(
        [...param.entries()].map(([k, v]) => [
          stringify(serializeScriptBuilderParam(k)),
          serializeScriptBuilderParam(v),
        ]),
      ),
    }),
    uInt160: (param) => ({ type: 'UInt160', value: common.uInt160ToString(param) }),
    uInt256: (param) => ({ type: 'UInt256', value: common.uInt256ToString(param) }),
    ecPoint: (param) => ({ type: 'ECPoint', value: common.ecPointToString(param) }),
    bn: (param) => ({ type: 'BN', value: param.toString(10) }),
    number: (param) => ({ type: 'number', value: param }),
    string: (param) => ({ type: 'string', value: param }),
    boolean: (param) => ({ type: 'boolean', value: param }),
    buffer: (param) => ({ type: 'Buffer', value: param.toString('hex') }),
    object: (param) => ({
      type: 'object',
      value: _.fromPairs(Object.entries(param).map(([k, v]) => [k, serializeScriptBuilderParam(v)])),
    }),
  });

export const deserializeScriptBuilderParam = (param: SerializedScriptBuilderParam): ScriptBuilderParam => {
  if (param.type === 'undefined') {
    return undefined;
  }

  if (param.type === 'Array') {
    return param.value.map(deserializeScriptBuilderParam);
  }

  if (param.type === 'Map') {
    return new Map(
      Object.entries(param.value).map(([k, v]) => [
        deserializeScriptBuilderParam(JSON.parse(k)),
        deserializeScriptBuilderParam(v),
      ]),
    );
  }

  if (param.type === 'UInt160') {
    return common.stringToUInt160(param.value);
  }

  if (param.type === 'UInt256') {
    return common.stringToUInt256(param.value);
  }

  if (param.type === 'ECPoint') {
    return common.stringToECPoint(param.value);
  }

  if (param.type === 'BN') {
    return new BN(param.value);
  }

  if (param.type === 'number') {
    return param.value;
  }

  if (param.type === 'string') {
    return param.value;
  }

  if (param.type === 'boolean') {
    return param.value;
  }

  if (param.type === 'Buffer') {
    return Buffer.from(param.value, 'hex');
  }

  return _.fromPairs(Object.entries(param.value).map(([k, v]) => [k, deserializeScriptBuilderParam(v)]));
};

export interface SerializedParamArray extends Array<SerializedParam> {}
export interface SerializedParamObject extends Record<string, SerializedParam> {}
export interface SerializedForwardValue {
  readonly name: string;
  readonly param: SerializedParam;
  readonly converted: SerializedScriptBuilderParam;
}
export type SerializedParam =
  | { readonly type: 'undefined' }
  | { readonly type: 'string'; readonly value: string }
  | { readonly type: 'boolean'; readonly value: boolean }
  | { readonly type: 'Array'; readonly value: SerializedParamArray }
  | { readonly type: 'BigNumber'; readonly value: string }
  | { readonly type: 'Map'; readonly value: SerializedParamObject }
  | { readonly type: 'ForwardValue'; readonly value: SerializedForwardValue }
  | { readonly type: 'object'; readonly value: SerializedParamObject };

export const serializeParam = (paramIn: Param): SerializedParam =>
  paramTo<SerializedParam>(paramIn, {
    undefined: () => ({ type: 'undefined' }),
    string: (param) => ({ type: 'string', value: param }),
    boolean: (param) => ({ type: 'boolean', value: param }),
    array: (param) => ({ type: 'Array', value: param.map(serializeParam) }),
    bigNumber: (param) => ({ type: 'BigNumber', value: param.toString(10) }),
    map: (param) => ({
      type: 'Map',
      value: _.fromPairs([...param.entries()].map(([k, v]) => [stringify(serializeParam(k)), serializeParam(v)])),
    }),
    forwardValue: (param) => ({
      type: 'ForwardValue',
      value: {
        name: param.name,
        param: serializeParam(param.param),
        converted: serializeScriptBuilderParam(param.converted),
      },
    }),
    object: (param) => ({
      type: 'object',
      value: _.fromPairs(Object.entries(param).map(([k, v]) => [k, serializeParam(v)])),
    }),
  });

export const deserializeParam = (param: SerializedParam): Param => {
  if (param.type === 'undefined') {
    return undefined;
  }

  if (param.type === 'string') {
    return param.value;
  }

  if (param.type === 'boolean') {
    return param.value;
  }

  if (param.type === 'Array') {
    return param.value.map(deserializeParam);
  }

  if (param.type === 'BigNumber') {
    return new BigNumber(param.value);
  }

  if (param.type === 'Map') {
    return new Map(Object.entries(param.value).map(([k, v]) => [deserializeParam(JSON.parse(k)), deserializeParam(v)]));
  }

  if (param.type === 'ForwardValue') {
    // tslint:disable-next-line prefer-immediate-return
    const value: ForwardValue = {
      name: param.value.name,
      param: deserializeParam(param.value.param),
      converted: deserializeScriptBuilderParam(param.value.converted),
    } as any;

    // tslint:disable-next-line no-var-before-return
    return value;
  }

  return _.fromPairs(Object.entries(param.value).map(([k, v]) => [k, deserializeParam(v)]));
};
