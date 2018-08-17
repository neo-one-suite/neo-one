import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { TypedHelper } from '../TypedHelper';

// Input: [val]
// Output: [objectVal]
export class ToObjectHelper extends TypedHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    const throwTypeError = (innerOptions: VisitOptions) => {
      sb.emitOp(node, 'DROP');
      sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
    };

    const emptyObject = (innerOptions: VisitOptions) => {
      sb.emitOp(node, 'DROP');
      sb.emitHelper(node, innerOptions, sb.helpers.createObject);
    };

    const identity = () => {
      // do nothing
    };

    // [val]
    sb.emitHelper(
      node,
      options,
      sb.helpers.forBuiltinType({
        type: this.type,
        knownType: this.knownType,
        array: emptyObject,
        boolean: emptyObject,
        buffer: emptyObject,
        null: throwTypeError,
        number: emptyObject,
        object: identity,
        string: emptyObject,
        symbol: emptyObject,
        undefined: throwTypeError,
        transaction: emptyObject,
        output: emptyObject,
        attribute: emptyObject,
        input: emptyObject,
        account: emptyObject,
        asset: emptyObject,
        contract: emptyObject,
        header: emptyObject,
        block: emptyObject,
      }),
    );
  }
}
