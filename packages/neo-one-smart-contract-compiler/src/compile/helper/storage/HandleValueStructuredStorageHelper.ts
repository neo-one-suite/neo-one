import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [size, iterator]
// Output: [keyVal, valVal]
export class HandleValueStructuredStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    // [iterator, size]
    sb.emitOp(node, 'SWAP');
    // [value]
    sb.emitSysCall(node, 'Neo.Enumerator.Value');
    // [arr]
    sb.emitSysCall(node, 'Neo.Runtime.Deserialize');
    // [2, keyVal, valVal]
    sb.emitOp(node, 'UNPACK');
    // [keyVal, valVal]
    sb.emitOp(node, 'DROP');
    // [size, keyVal, valVal]
    sb.emitOp(node, 'ROT');
    // [keyVal, valVal]
    sb.emitHelper(node, options, sb.helpers.handlePrefixKeyStructuredStorage);
  }
}
