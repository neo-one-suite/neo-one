import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { Types } from './Types';

type ProcessType = (options: VisitOptions) => void;

export interface ForBuiltinTypeHelperOptions {
  readonly type: ts.Type | undefined;
  readonly knownType?: Types;
  readonly array: ProcessType;
  readonly boolean: ProcessType;
  readonly buffer: ProcessType;
  readonly null: ProcessType;
  readonly number: ProcessType;
  readonly object: ProcessType;
  readonly string: ProcessType;
  readonly symbol: ProcessType;
  readonly undefined: ProcessType;
}

// Input: [val]
// Output: []
export class ForBuiltinTypeHelper extends Helper {
  private readonly type: ts.Type | undefined;
  private readonly knownType?: Types;
  private readonly array: ProcessType;
  private readonly boolean: ProcessType;
  private readonly buffer: ProcessType;
  private readonly null: ProcessType;
  private readonly number: ProcessType;
  private readonly object: ProcessType;
  private readonly string: ProcessType;
  private readonly symbol: ProcessType;
  private readonly undefined: ProcessType;

  public constructor({
    type,
    knownType,
    array,
    boolean: processBoolean,
    buffer,
    null: processNull,
    number: processNumber,
    object,
    string: processString,
    symbol,
    undefined: processUndefined,
  }: ForBuiltinTypeHelperOptions) {
    super();
    this.type = type;
    this.knownType = knownType;
    this.array = array;
    this.boolean = processBoolean;
    this.buffer = buffer;
    this.null = processNull;
    this.number = processNumber;
    this.object = object;
    this.string = processString;
    this.symbol = symbol;
    this.undefined = processUndefined;
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
        types: [
          {
            hasType: (type) => tsUtils.type_.hasUndefined(type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isUndefined);
            },
            process: this.undefined,
          },
          {
            hasType: (type) => tsUtils.type_.hasNull(type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isNull);
            },
            process: this.null,
          },
          {
            hasType: (type) => tsUtils.type_.hasBooleanish(type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isBoolean);
            },
            process: this.boolean,
          },
          {
            hasType: (type) => tsUtils.type_.hasNumberish(type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isNumber);
            },
            process: this.number,
          },
          {
            hasType: (type) => tsUtils.type_.hasStringish(type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isString);
            },
            process: this.string,
          },
          {
            hasType: (type) => tsUtils.type_.hasSymbolish(type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isSymbol);
            },
            process: this.symbol,
          },
          {
            hasType: (type) => sb.hasGlobal(node, type, 'Buffer'),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isBuffer);
            },
            process: this.buffer,
          },
          {
            hasType: (type) => tsUtils.type_.hasArrayish(type),
            isRuntimeType: (innerOptions) => {
              sb.emitHelper(node, innerOptions, sb.helpers.isArray);
            },
            process: this.array,
          },
          {
            hasType: (type) =>
              tsUtils.type_.hasType(
                type,
                (tpe) =>
                  !tsUtils.type_.isOnlyType(
                    tpe,
                    (tp) =>
                      tsUtils.type_.isOnlyPrimitiveish(tp) ||
                      tsUtils.type_.isOnlyArrayish(tp) ||
                      sb.isGlobal(node, type, 'Buffer'),
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
      default:
        /* istanbul ignore next */
        utils.assertNever(knownType);
    }
  }
}
