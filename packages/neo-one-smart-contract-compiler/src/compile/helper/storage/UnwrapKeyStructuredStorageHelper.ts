import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { TypedHelper } from '../types';

// Input: [valKey]
// Output: [valKeyArr]
export class UnwrapKeyStructuredStorageHelper extends TypedHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const unwrapArray = (innerOptions: VisitOptions) => {
      // [keyVal]
      sb.emitHelper(node, innerOptions, sb.helpers.unwrapArray);
    };

    const wrapArray = () => {
      // [1, val]
      sb.emitPushInt(node, 1);
      // [arr]
      sb.emitOp(node, 'PACK');
    };

    // [valKeyArr]
    sb.emitHelper(
      node,
      options,
      sb.helpers.forBuiltinType({
        type: this.type,
        knownType: this.knownType,
        array: unwrapArray,
        map: wrapArray,
        set: wrapArray,
        boolean: wrapArray,
        buffer: wrapArray,
        null: wrapArray,
        number: wrapArray,
        object: wrapArray,
        string: wrapArray,
        symbol: wrapArray,
        undefined: wrapArray,
        arrayStorage: wrapArray,
        mapStorage: wrapArray,
        setStorage: wrapArray,
        error: wrapArray,
        iteratorResult: wrapArray,
        iterable: wrapArray,
        iterableIterator: wrapArray,
        transaction: wrapArray,
        output: wrapArray,
        attribute: wrapArray,
        input: wrapArray,
        account: wrapArray,
        asset: wrapArray,
        contract: wrapArray,
        header: wrapArray,
        block: wrapArray,
      }),
    );
  }
}
