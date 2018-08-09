import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { ForBuiltinTypeHelperOptions } from '../types';
import { Types, WrappableType } from '../types/Types';

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
      sb.emitOp(node, 'EQUAL');
    };

    const createProcess = (value: keyof ForBuiltinTypeHelperOptions, type: WrappableType) => (
      innerOptions: VisitOptions,
    ) => {
      sb.emitOp(node, 'SWAP');
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.forBuiltinType({
          type: this.leftType,
          knownType: this.leftKnownType,
          array: pushFalse,
          boolean: pushFalse,
          buffer: pushFalse,
          null: pushFalse,
          number: pushFalse,
          object: pushFalse,
          string: pushFalse,
          symbol: pushFalse,
          undefined: pushFalse,
          transaction: pushFalse,
          output: pushFalse,
          attribute: pushFalse,
          input: pushFalse,
          account: pushFalse,
          asset: pushFalse,
          contract: pushFalse,
          header: pushFalse,
          block: pushFalse,
          [value]: compare(type),
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
          boolean: pushFalse,
          buffer: pushFalse,
          null: pushFalse,
          number: pushFalse,
          object: pushFalse,
          string: pushFalse,
          symbol: pushFalse,
          undefined: pushFalse,
          transaction: pushFalse,
          output: pushFalse,
          attribute: pushFalse,
          input: pushFalse,
          account: pushFalse,
          asset: pushFalse,
          contract: pushFalse,
          header: pushFalse,
          block: pushFalse,
          [value]: pushTrue,
        }),
      );
    };

    sb.emitHelper(
      node,
      options,
      sb.helpers.forBuiltinType({
        type: this.rightType,
        knownType: this.rightKnownType,
        array: createProcess('array', Types.Array),
        boolean: createProcess('boolean', Types.Boolean),
        buffer: createProcess('buffer', Types.Buffer),
        null: createProcessNullOrUndefined('null'),
        number: createProcess('number', Types.Number),
        object: createProcess('object', Types.Object),
        string: createProcess('string', Types.String),
        symbol: createProcess('symbol', Types.Symbol),
        undefined: createProcessNullOrUndefined('undefined'),
        transaction: createProcess('transaction', Types.Transaction),
        output: createProcess('output', Types.Output),
        attribute: createProcess('attribute', Types.Attribute),
        input: createProcess('input', Types.Input),
        account: createProcess('account', Types.Account),
        asset: createProcess('asset', Types.Asset),
        contract: createProcess('contract', Types.Contract),
        header: createProcess('header', Types.Header),
        block: createProcess('block', Types.Block),
      }),
    );
  }
}
