import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { getForwardedValueType } from '../../../utils';
import { Types } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { hasArray } from './array';
import { hasArrayStorage } from './arrayStorage';
import { hasAttribute } from './attribute';
import { hasBlock } from './block';
import { hasBoolean } from './boolean';
import { hasBuffer } from './buffer';
import { hasContract } from './contract';
import { hasError } from './error';
import { hasForwardValue } from './forwardValue';
import { hasIterable } from './iterable';
import { hasIterableIterator } from './iterableIterator';
import { hasIteratorResult } from './iteratorResult';
import { hasMap } from './map';
import { hasMapStorage } from './mapStorage';
import { hasNull } from './null';
import { hasNumber } from './number';
import { hasObject } from './object';
import { hasSet } from './set';
import { hasSetStorage } from './setStorage';
import { hasString } from './string';
import { hasSymbol } from './symbol';
import { hasTransaction } from './transaction';
import { hasUndefined } from './undefined';

type ProcessType = (options: VisitOptions) => void;

export interface ForBuiltinTypeHelperOptions {
  readonly type: ts.Type | undefined;
  readonly knownType?: Types;
  readonly single?: boolean;
  readonly singleUndefined?: ProcessType;
  readonly singleFalse?: ProcessType;
  readonly optional?: boolean;
  readonly array: ProcessType;
  readonly map: ProcessType;
  readonly set: ProcessType;
  readonly boolean: ProcessType;
  readonly buffer: ProcessType;
  readonly null: ProcessType;
  readonly number: ProcessType;
  readonly object: ProcessType;
  readonly string: ProcessType;
  readonly symbol: ProcessType;
  readonly undefined: ProcessType;
  readonly arrayStorage: ProcessType;
  readonly mapStorage: ProcessType;
  readonly setStorage: ProcessType;
  readonly error: ProcessType;
  readonly iteratorResult: ProcessType;
  readonly iterable: ProcessType;
  readonly iterableIterator: ProcessType;
  readonly transaction: ProcessType;
  readonly attribute: ProcessType;
  readonly contract: ProcessType;
  readonly block: ProcessType;
  readonly forwardValue: ProcessType;
}

// Input: [val]
// Output: []
export class ForBuiltinTypeHelper extends Helper {
  private readonly type: ts.Type | undefined;
  private readonly knownType?: Types;
  private readonly single?: boolean;
  private readonly singleUndefined?: ProcessType;
  private readonly singleFalse?: ProcessType;
  private readonly optional?: boolean;
  private readonly array: ProcessType;
  private readonly map: ProcessType;
  private readonly set: ProcessType;
  private readonly boolean: ProcessType;
  private readonly buffer: ProcessType;
  private readonly null: ProcessType;
  private readonly number: ProcessType;
  private readonly object: ProcessType;
  private readonly string: ProcessType;
  private readonly symbol: ProcessType;
  private readonly undefined: ProcessType;
  private readonly arrayStorage: ProcessType;
  private readonly mapStorage: ProcessType;
  private readonly setStorage: ProcessType;
  private readonly error: ProcessType;
  private readonly iteratorResult: ProcessType;
  private readonly iterable: ProcessType;
  private readonly iterableIterator: ProcessType;
  private readonly transaction: ProcessType;
  private readonly attribute: ProcessType;
  private readonly contract: ProcessType;
  private readonly block: ProcessType;
  private readonly forwardValue: ProcessType;

  public constructor({
    type,
    knownType,
    single,
    singleUndefined,
    singleFalse,
    optional,
    array,
    map,
    set,
    boolean: processBoolean,
    buffer,
    null: processNull,
    number: processNumber,
    object,
    string: processString,
    symbol,
    undefined: processUndefined,
    arrayStorage,
    mapStorage,
    setStorage,
    error,
    iteratorResult,
    iterable,
    iterableIterator,
    transaction,
    attribute,
    contract,
    block,
    forwardValue,
  }: ForBuiltinTypeHelperOptions) {
    super();
    this.type = type;
    this.knownType = knownType;
    this.single = single;
    this.singleUndefined = singleUndefined;
    this.singleFalse = singleFalse;
    this.optional = optional;
    this.array = array;
    this.map = map;
    this.set = set;
    this.boolean = processBoolean;
    this.buffer = buffer;
    this.null = processNull;
    this.number = processNumber;
    this.object = object;
    this.string = processString;
    this.symbol = symbol;
    this.undefined = processUndefined;
    this.arrayStorage = arrayStorage;
    this.mapStorage = mapStorage;
    this.setStorage = setStorage;
    this.error = error;
    this.iteratorResult = iteratorResult;
    this.iterable = iterable;
    this.iterableIterator = iterableIterator;
    this.transaction = transaction;
    this.attribute = attribute;
    this.contract = contract;
    this.block = block;
    this.forwardValue = forwardValue;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (this.knownType !== undefined) {
      this.processKnownType(this.knownType, options);

      return;
    }

    let tpe = this.type;
    if (tpe !== undefined && sb.context.builtins.isType(node, tpe, 'ForwardedValue')) {
      tpe = getForwardedValueType(tpe);
    }

    sb.emitHelper(
      node,
      options,
      sb.helpers.forType({
        type: tpe,
        single: this.single,
        singleUndefined: this.singleUndefined,
        singleFalse: this.singleFalse,
        optional: this.optional,
        types: [
          {
            hasType: (type) => hasUndefined(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isUndefined);
            },
            process: this.undefined,
          },
          {
            hasType: (type) => hasNull(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isNull);
            },
            process: this.null,
          },
          {
            hasType: (type) => hasBoolean(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isBoolean);
            },
            process: this.boolean,
          },
          {
            hasType: (type) => hasNumber(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isNumber);
            },
            process: this.number,
          },
          {
            hasType: (type) => hasString(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isString);
            },
            process: this.string,
          },
          {
            hasType: (type) => hasSymbol(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isSymbol);
            },
            process: this.symbol,
          },
          {
            hasType: (type) => hasBuffer(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isBuffer);
            },
            process: this.buffer,
          },
          {
            hasType: (type) => hasArray(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isArray);
            },
            process: this.array,
          },
          {
            hasType: (type) => hasArrayStorage(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isArrayStorage);
            },
            process: this.arrayStorage,
          },
          {
            hasType: (type) => hasMap(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isMap);
            },
            process: this.map,
          },
          {
            hasType: (type) => hasMapStorage(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isMapStorage);
            },
            process: this.mapStorage,
          },
          {
            hasType: (type) => hasSet(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isSet);
            },
            process: this.set,
          },
          {
            hasType: (type) => hasSetStorage(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isSetStorage);
            },
            process: this.setStorage,
          },
          {
            hasType: (type) => hasError(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isError);
            },
            process: this.error,
          },
          {
            hasType: (type) => hasIteratorResult(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isIteratorResult);
            },
            process: this.iteratorResult,
          },
          {
            hasType: (type) => hasIterableIterator(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isIterableIterator);
            },
            process: this.iterableIterator,
          },
          {
            hasType: (type) => hasForwardValue(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isForwardValue);
            },
            process: this.forwardValue,
          },
          {
            hasType: (type) => hasTransaction(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isTransaction);
            },
            process: this.transaction,
          },
          {
            hasType: (type) => hasAttribute(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isAttribute);
            },
            process: this.attribute,
          },
          {
            hasType: (type) => hasContract(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isContract);
            },
            process: this.contract,
          },
          {
            hasType: (type) => hasBlock(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isBlock);
            },
            process: this.block,
          },
          {
            hasType: (type) => hasIterable(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isIterable);
            },
            process: this.iterable,
          },
          {
            hasType: (type) => hasObject(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isObject);
            },
            process: this.object,
          },
        ],
      }),
    );
  }

  private processKnownType(knownType: Types, options: VisitOptions): void {
    switch (knownType) {
      case Types.Array:
        this.array(options);
        break;
      case Types.ArrayStorage:
        this.arrayStorage(options);
        break;
      case Types.Map:
        // tslint:disable-next-line
        this.map(options);
        break;
      case Types.MapStorage:
        this.mapStorage(options);
        break;
      case Types.Set:
        this.set(options);
        break;
      case Types.SetStorage:
        this.setStorage(options);
        break;
      case Types.Error:
        this.error(options);
        break;
      case Types.IteratorResult:
        this.iteratorResult(options);
        break;
      case Types.Iterable:
        this.iterable(options);
        break;
      case Types.IterableIterator:
        this.iterableIterator(options);
        break;
      case Types.Boolean:
        this.boolean(options);
        break;
      case Types.Buffer:
        this.buffer(options);
        break;
      case Types.ForwardValue:
        this.forwardValue(options);
        break;
      case Types.Null:
        this.null(options);
        break;
      case Types.Number:
        this.number(options);
        break;
      case Types.Object:
        this.object(options);
        break;
      case Types.String:
        this.string(options);
        break;
      case Types.Symbol:
        this.symbol(options);
        break;
      case Types.Undefined:
        this.undefined(options);
        break;
      case Types.Transaction:
        this.transaction(options);
        break;
      case Types.Attribute:
        this.attribute(options);
        break;
      case Types.Contract:
        this.contract(options);
        break;
      case Types.Block:
        this.block(options);
        break;
      default:
        /* istanbul ignore next */
        utils.assertNever(knownType);
    }
  }
}
