import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { TypedHelper } from '../TypedHelper';

// Input: [val]
// Output: [boolean]
export class ToBooleanHelper extends TypedHelper {
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

    const convertBoolean = (innerOptions: VisitOptions) => {
      sb.emitHelper(node, innerOptions, sb.helpers.unwrapBoolean);
    };

    const convertNumber = (innerOptions: VisitOptions) => {
      sb.emitHelper(node, innerOptions, sb.helpers.unwrapNumber);
      sb.emitPushInt(node, 0);
      sb.emitOp(node, 'NUMNOTEQUAL');
    };

    const convertString = (innerOptions: VisitOptions) => {
      sb.emitHelper(node, innerOptions, sb.helpers.unwrapString);
      sb.emitPushString(node, '');
      sb.emitOp(node, 'EQUAL');
      sb.emitOp(node, 'NOT');
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
        boolean: convertBoolean,
        buffer: convertOther,
        null: convertUndefinedOrNull,
        number: convertNumber,
        object: convertOther,
        string: convertString,
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
        attribute: convertOther,
        contract: convertOther,
        block: convertOther,
        contractManifest: convertOther,
        contractABI: convertOther,
        contractMethod: convertOther,
        contractEvent: convertOther,
        contractParameter: convertOther,
        contractGroup: convertOther,
        contractPermission: convertOther,
      }),
    );
  }
}
