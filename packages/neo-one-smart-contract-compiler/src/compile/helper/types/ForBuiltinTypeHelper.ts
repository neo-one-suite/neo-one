import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { Types } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { hasAccount } from './account';
import { hasArray, isOnlyArray } from './array';
import { hasArrayStorage, isOnlyArrayStorage } from './arrayStorage';
import { hasAsset } from './asset';
import { hasAttribute, isOnlyAttribute } from './attribute';
import { hasBlock } from './block';
import { hasBoolean, isOnlyBoolean } from './boolean';
import { hasBuffer, isOnlyBuffer } from './buffer';
import { hasContract } from './contract';
import { hasError, isOnlyError } from './error';
import { hasHeader } from './header';
import { hasInput, isOnlyInput } from './input';
import { hasIterable, isOnlyIterable } from './iterable';
import { hasIterableIterator, isOnlyIterableIterator } from './iterableIterator';
import { hasIteratorResult, isOnlyIteratorResult } from './iteratorResult';
import { hasMap, isOnlyMap } from './map';
import { hasMapStorage, isOnlyMapStorage } from './mapStorage';
import { hasNull, isOnlyNull } from './null';
import { hasNumber, isOnlyNumber } from './number';
import { hasOutput, isOnlyOutput } from './output';
import { hasSet, isOnlySet } from './set';
import { hasSetStorage, isOnlySetStorage } from './setStorage';
import { hasString, isOnlyString } from './string';
import { hasSymbol, isOnlySymbol } from './symbol';
import { hasTransaction, isOnlyTransaction } from './transaction';
import { hasUndefined, isOnlyUndefined } from './undefined';

type ProcessType = (options: VisitOptions) => void;

export interface ForBuiltinTypeHelperOptions {
  readonly type: ts.Type | undefined;
  readonly knownType?: Types;
  readonly single?: boolean;
  readonly singleUndefined?: ProcessType;
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
  readonly output: ProcessType;
  readonly attribute: ProcessType;
  readonly input: ProcessType;
  readonly account: ProcessType;
  readonly asset: ProcessType;
  readonly contract: ProcessType;
  readonly header: ProcessType;
  readonly block: ProcessType;
}

// Input: [val]
// Output: []
export class ForBuiltinTypeHelper extends Helper {
  private readonly type: ts.Type | undefined;
  private readonly knownType?: Types;
  private readonly single?: boolean;
  private readonly singleUndefined?: ProcessType;
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
  private readonly output: ProcessType;
  private readonly attribute: ProcessType;
  private readonly input: ProcessType;
  private readonly account: ProcessType;
  private readonly asset: ProcessType;
  private readonly contract: ProcessType;
  private readonly header: ProcessType;
  private readonly block: ProcessType;

  public constructor({
    type,
    knownType,
    single,
    singleUndefined,
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
    output,
    attribute,
    input,
    account,
    asset,
    contract,
    header,
    block,
  }: ForBuiltinTypeHelperOptions) {
    super();
    this.type = type;
    this.knownType = knownType;
    this.single = single;
    this.singleUndefined = singleUndefined;
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
    this.output = output;
    this.attribute = attribute;
    this.input = input;
    this.account = account;
    this.asset = asset;
    this.contract = contract;
    this.header = header;
    this.block = block;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (this.knownType !== undefined) {
      this.processKnownType(this.knownType, options);

      return;
    }

    sb.emitHelper(
      node,
      options,
      sb.helpers.forType({
        type: this.type,
        single: this.single,
        singleUndefined: this.singleUndefined,
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
            hasType: (type) => hasTransaction(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isTransaction);
            },
            process: this.transaction,
          },
          {
            hasType: (type) => hasOutput(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isOutput);
            },
            process: this.output,
          },
          {
            hasType: (type) => hasAttribute(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isAttribute);
            },
            process: this.attribute,
          },
          {
            hasType: (type) => hasInput(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isInput);
            },
            process: this.input,
          },
          {
            hasType: (type) => hasAccount(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isAccount);
            },
            process: this.account,
          },
          {
            hasType: (type) => hasAsset(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isAsset);
            },
            process: this.asset,
          },
          {
            hasType: (type) => hasContract(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isContract);
            },
            process: this.contract,
          },
          {
            hasType: (type) => hasHeader(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isHeader);
            },
            process: this.header,
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
            hasType: (type) =>
              tsUtils.type_.hasType(
                type,
                (tpe) =>
                  !tsUtils.type_.isOnlyType(
                    tpe,
                    (tp) =>
                      isOnlyUndefined(sb.context, node, tp) ||
                      isOnlyNull(sb.context, node, tp) ||
                      isOnlyBoolean(sb.context, node, tp) ||
                      isOnlyNumber(sb.context, node, tp) ||
                      isOnlyString(sb.context, node, tp) ||
                      isOnlySymbol(sb.context, node, tp) ||
                      isOnlyBuffer(sb.context, node, tp) ||
                      isOnlyArray(sb.context, node, tp) ||
                      isOnlyArrayStorage(sb.context, node, tp) ||
                      isOnlyMap(sb.context, node, tp) ||
                      isOnlyMapStorage(sb.context, node, tp) ||
                      isOnlySet(sb.context, node, tp) ||
                      isOnlySetStorage(sb.context, node, tp) ||
                      isOnlyError(sb.context, node, tp) ||
                      isOnlyIteratorResult(sb.context, node, tp) ||
                      isOnlyIterable(sb.context, node, tp) ||
                      isOnlyIterableIterator(sb.context, node, tp) ||
                      isOnlyTransaction(sb.context, node, tp) ||
                      isOnlyOutput(sb.context, node, tp) ||
                      isOnlyAttribute(sb.context, node, tp) ||
                      isOnlyInput(sb.context, node, tp),
                  ),
              ),
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
      case Types.Output:
        this.output(options);
        break;
      case Types.Attribute:
        this.attribute(options);
        break;
      case Types.Input:
        this.input(options);
        break;
      case Types.Account:
        this.account(options);
        break;
      case Types.Asset:
        this.asset(options);
        break;
      case Types.Contract:
        this.contract(options);
        break;
      case Types.Header:
        this.header(options);
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
