import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { TypedHelper } from '../TypedHelper';

// Input: [val]
// Output: [boolean]
export class ToNullishBooleanHelper extends TypedHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      /* istanbul ignore next */
      sb.emitOp(node, 'DROP');

      /* istanbul ignore next */
      return;
    }

    const convertUndefinedOrNull = () => {
      sb.emitOp(node, 'DROP');
      sb.emitPushBoolean(node, false);
    };

    const convertOther = () => {
      sb.emitOp(node, 'DROP');
      sb.emitPushBoolean(node, true);
    };

    sb.emitHelper(
      node,
      options,
      sb.helpers.forBuiltinType({
        type: this.type,
        knownType: this.knownType,
        array: convertOther,
        arrayStorage: convertOther,
        boolean: convertOther,
        buffer: convertOther,
        null: convertUndefinedOrNull,
        number: convertOther,
        object: convertOther,
        string: convertOther,
        symbol: convertOther,
        undefined: convertUndefinedOrNull,
        map: convertOther,
        mapStorage: convertOther,
        set: convertOther,
        setStorage: convertOther,
        error: convertOther,
        forwardValue: convertOther,
        iteratorResult: convertOther,
        iterable: convertOther,
        iterableIterator: convertOther,
        transaction: convertOther,
        output: convertOther,
        attribute: convertOther,
        input: convertOther,
        account: convertOther,
        asset: convertOther,
        contract: convertOther,
        header: convertOther,
        block: convertOther,
      }),
    );
  }
}
