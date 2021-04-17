import { StackItemType } from '@neo-one/client-common';
import ts from 'typescript';
import { Types, WrappableType } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { ForBuiltinTypeHelperOptions } from '../types';

export interface EqualsEqualsEqualsHelperOptions {
  readonly leftType: ts.Type | undefined;
  readonly leftKnownType?: Types;
  readonly rightType: ts.Type | undefined;
  readonly rightKnownType?: Types;
}

// Input: [right, left]
// Output: [boolean]
export class EqualsEqualsEqualsHelper extends Helper {
  private readonly leftType: ts.Type | undefined;
  private readonly leftKnownType?: Types;
  private readonly rightType: ts.Type | undefined;
  private readonly rightKnownType?: Types;

  public constructor(options: EqualsEqualsEqualsHelperOptions) {
    super();
    this.leftType = options.leftType;
    this.leftKnownType = options.leftKnownType;
    this.rightType = options.rightType;
    this.rightKnownType = options.rightKnownType;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    const pushFalse = () => {
      // [right]
      sb.emitOp(node, 'DROP');
      // []
      sb.emitOp(node, 'DROP');
      // [boolean]
      sb.emitPushBoolean(node, false);
    };

    const pushTrue = () => {
      // [right]
      sb.emitOp(node, 'DROP');
      // []
      sb.emitOp(node, 'DROP');
      // [boolean]
      sb.emitPushBoolean(node, true);
    };

    const compare = (type: WrappableType) => (innerOptions: VisitOptions) => {
      sb.emitHelper(node, innerOptions, sb.helpers.unwrapVal({ type }));
      sb.emitOp(node, 'SWAP');
      sb.emitHelper(node, innerOptions, sb.helpers.unwrapVal({ type }));
      if (type === Types.Boolean) {
        sb.emitOp(node, 'NUMEQUAL');
      } else if (type === Types.String) {
        // [bytestring, buffer]
        sb.emitOp(node, 'CONVERT', Buffer.from([StackItemType.ByteString]));
        // [buffer, bytestring]
        sb.emitOp(node, 'SWAP');
        // [bytestring, bytestring]
        sb.emitOp(node, 'CONVERT', Buffer.from([StackItemType.ByteString]));
        // [boolean]
        sb.emitOp(node, 'EQUAL');
      } else {
        sb.emitOp(node, 'EQUAL');
      }
    };

    const compareStorageValue = () => {
      sb.emitPushInt(node, 1);
      sb.emitOp(node, 'PICKITEM');
      sb.emitOp(node, 'SWAP');
      sb.emitPushInt(node, 1);
      sb.emitOp(node, 'PICKITEM');
      sb.emitOp(node, 'EQUAL');
    };

    const compareNumber = (innerOptions: VisitOptions) => {
      sb.emitHelper(node, innerOptions, sb.helpers.unwrapNumber);
      sb.emitOp(node, 'CONVERT', Buffer.from([StackItemType.Integer]));
      sb.emitOp(node, 'SWAP');
      sb.emitHelper(node, innerOptions, sb.helpers.unwrapNumber);
      sb.emitOp(node, 'CONVERT', Buffer.from([StackItemType.Integer]));
      sb.emitOp(node, 'NUMEQUAL');
    };

    const createProcess = (
      value: keyof ForBuiltinTypeHelperOptions,
      type: WrappableType,
      compareValue = compare(type),
    ) => (innerOptions: VisitOptions) => {
      sb.emitOp(node, 'SWAP');
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.forBuiltinType({
          type: this.leftType,
          knownType: this.leftKnownType,
          array: pushFalse,
          arrayStorage: pushFalse,
          boolean: pushFalse,
          buffer: pushFalse,
          null: pushFalse,
          number: pushFalse,
          object: pushFalse,
          string: pushFalse,
          symbol: pushFalse,
          undefined: pushFalse,
          map: pushFalse,
          mapStorage: pushFalse,
          set: pushFalse,
          setStorage: pushFalse,
          error: pushFalse,
          forwardValue: pushFalse,
          iteratorResult: pushFalse,
          iterable: pushFalse,
          iterableIterator: pushFalse,
          transaction: pushFalse,
          attribute: pushFalse,
          contract: pushFalse,
          block: pushFalse,
          contractManifest: pushFalse,
          contractABI: pushFalse,
          contractMethod: pushFalse,
          contractEvent: pushFalse,
          contractParameter: pushFalse,
          contractGroup: pushFalse,
          contractPermission: pushFalse,
          [value]: compareValue,
        }),
      );
    };

    const createProcessStorage = (value: keyof ForBuiltinTypeHelperOptions) => (innerOptions: VisitOptions) => {
      sb.emitOp(node, 'SWAP');
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.forBuiltinType({
          type: this.leftType,
          knownType: this.leftKnownType,
          array: pushFalse,
          arrayStorage: pushFalse,
          boolean: pushFalse,
          buffer: pushFalse,
          null: pushFalse,
          number: pushFalse,
          object: pushFalse,
          string: pushFalse,
          symbol: pushFalse,
          undefined: pushFalse,
          map: pushFalse,
          mapStorage: pushFalse,
          set: pushFalse,
          setStorage: pushFalse,
          error: pushFalse,
          forwardValue: pushFalse,
          iteratorResult: pushFalse,
          iterable: pushFalse,
          iterableIterator: pushFalse,
          transaction: pushFalse,
          attribute: pushFalse,
          contract: pushFalse,
          block: pushFalse,
          contractManifest: pushFalse,
          contractABI: pushFalse,
          contractMethod: pushFalse,
          contractEvent: pushFalse,
          contractParameter: pushFalse,
          contractGroup: pushFalse,
          contractPermission: pushFalse,
          [value]: compareStorageValue,
        }),
      );
    };

    const createProcessNullOrUndefined = (value: keyof ForBuiltinTypeHelperOptions) => (innerOptions: VisitOptions) => {
      sb.emitOp(node, 'SWAP');
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.forBuiltinType({
          type: this.leftType,
          knownType: this.leftKnownType,
          array: pushFalse,
          arrayStorage: pushFalse,
          boolean: pushFalse,
          buffer: pushFalse,
          null: pushFalse,
          number: pushFalse,
          object: pushFalse,
          string: pushFalse,
          symbol: pushFalse,
          undefined: pushFalse,
          map: pushFalse,
          mapStorage: pushFalse,
          set: pushFalse,
          setStorage: pushFalse,
          error: pushFalse,
          forwardValue: pushFalse,
          iteratorResult: pushFalse,
          iterable: pushFalse,
          iterableIterator: pushFalse,
          transaction: pushFalse,
          attribute: pushFalse,
          contract: pushFalse,
          block: pushFalse,
          contractManifest: pushFalse,
          contractABI: pushFalse,
          contractMethod: pushFalse,
          contractEvent: pushFalse,
          contractParameter: pushFalse,
          contractGroup: pushFalse,
          contractPermission: pushFalse,
          [value]: pushTrue,
        }),
      );
    };

    const createProcessIterable = () => (innerOptions: VisitOptions) => {
      sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
    };

    sb.emitHelper(
      node,
      options,
      sb.helpers.forBuiltinType({
        type: this.rightType,
        knownType: this.rightKnownType,
        array: createProcess('array', Types.Array),
        arrayStorage: createProcessStorage('arrayStorage'),
        boolean: createProcess('boolean', Types.Boolean),
        buffer: createProcess('buffer', Types.Buffer),
        null: createProcessNullOrUndefined('null'),
        number: createProcess('number', Types.Number, compareNumber),
        object: createProcess('object', Types.Object),
        string: createProcess('string', Types.String),
        symbol: createProcess('symbol', Types.Symbol),
        undefined: createProcessNullOrUndefined('undefined'),
        map: createProcess('map', Types.Map),
        mapStorage: createProcessStorage('mapStorage'),
        set: createProcess('set', Types.Set),
        setStorage: createProcessStorage('setStorage'),
        error: createProcess('error', Types.Error),
        forwardValue: createProcess('error', Types.ForwardValue),
        iteratorResult: createProcess('iteratorResult', Types.IteratorResult),
        iterable: createProcessIterable(),
        iterableIterator: createProcess('iterableIterator', Types.IterableIterator),
        transaction: createProcess('transaction', Types.Transaction),
        attribute: createProcess('attribute', Types.Attribute),
        contract: createProcess('contract', Types.Contract),
        block: createProcess('block', Types.Block),
        contractManifest: createProcess('contractManifest', Types.ContractManifest),
        contractABI: createProcess('contractABI', Types.ContractABI),
        contractMethod: createProcess('contractMethod', Types.ContractMethod),
        contractEvent: createProcess('contractEvent', Types.ContractEvent),
        contractParameter: createProcess('contractParameter', Types.ContractParameter),
        contractGroup: createProcess('contractGroup', Types.ContractGroup),
        contractPermission: createProcess('contractPermission', Types.ContractPermission),
      }),
    );
  }
}
