import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val]
// Output: [idx]
export class GetArrayStorageLengthHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [prefix]
    sb.emitHelper(node, options, sb.helpers.unwrapArrayStorage);
    // [buffer]
    sb.emitSysCall(node, 'Neo.Runtime.Serialize');
    // [idx]
    sb.emitHelper(node, options, sb.helpers.getCommonStorage);
    // [idx]
    sb.emitHelper(
      node,
      options,
      sb.helpers.handleUndefinedStorage({
        handleUndefined: () => {
          sb.emitPushInt(node, 0);
        },
        handleDefined: () => {
          // do nothing
        },
      }),
    );
  }
}
