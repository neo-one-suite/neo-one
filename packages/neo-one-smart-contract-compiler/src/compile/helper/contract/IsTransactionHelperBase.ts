import ts from 'typescript';
import { Types } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [buffer]
// Output: [boolean]
export abstract class IsTransactionHelperBase extends Helper {
  protected abstract readonly prefix: string;

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [val, buffer]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createStructuredStorage({
        prefix: this.prefix,
        type: Types.SetStorage,
      }),
    );
    // [bufferVal, val]
    sb.emitOp(node, 'SWAP');
    // [hashVal, val]
    sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    // [val]
    sb.emitHelper(
      node,
      options,
      sb.helpers.hasStructuredStorage({
        type: Types.SetStorage,
        keyType: undefined,
        knownKeyType: Types.Buffer,
      }),
    );

    if (optionsIn.pushValue) {
      // [boolean]
      sb.emitHelper(node, options, sb.helpers.unwrapBoolean);
    } else {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
