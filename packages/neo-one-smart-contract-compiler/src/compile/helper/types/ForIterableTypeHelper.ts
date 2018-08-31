import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { IterableTypes, Types } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { hasArray } from './array';
import { hasArrayStorage } from './arrayStorage';
import { hasIterableIterator } from './iterableIterator';
import { hasMap } from './map';
import { hasMapStorage } from './mapStorage';
import { hasSet } from './set';
import { hasSetStorage } from './setStorage';

type ProcessType = (options: VisitOptions) => void;

export interface ForIterableTypeHelperOptions {
  readonly knownType?: IterableTypes;
  readonly array: ProcessType;
  readonly map: ProcessType;
  readonly set: ProcessType;
  readonly arrayStorage: ProcessType;
  readonly mapStorage: ProcessType;
  readonly setStorage: ProcessType;
  readonly iterableIterator: ProcessType;
  readonly defaultCase?: ProcessType;
}

// Input: [val]
// Output: []
export class ForIterableTypeHelper extends Helper {
  private readonly knownType?: IterableTypes;
  private readonly array: ProcessType;
  private readonly map: ProcessType;
  private readonly set: ProcessType;
  private readonly arrayStorage: ProcessType;
  private readonly mapStorage: ProcessType;
  private readonly setStorage: ProcessType;
  private readonly iterableIterator: ProcessType;
  private readonly defaultCase?: ProcessType;

  public constructor({
    knownType,
    array,
    map,
    set,
    arrayStorage,
    mapStorage,
    setStorage,
    iterableIterator,
    defaultCase,
  }: ForIterableTypeHelperOptions) {
    super();
    this.knownType = knownType;
    this.array = array;
    this.map = map;
    this.set = set;
    this.arrayStorage = arrayStorage;
    this.mapStorage = mapStorage;
    this.setStorage = setStorage;
    this.iterableIterator = iterableIterator;
    this.defaultCase = defaultCase;
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
        type: undefined,
        defaultCase: this.defaultCase,
        types: [
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
            hasType: (type) => hasIterableIterator(sb.context, node, type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isIterableIterator);
            },
            process: this.iterableIterator,
          },
        ],
      }),
    );
  }

  private processKnownType(knownType: IterableTypes, options: VisitOptions): void {
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
      case Types.IterableIterator:
        this.iterableIterator(options);
        break;
      default:
        /* istanbul ignore next */
        utils.assertNever(knownType);
    }
  }
}
