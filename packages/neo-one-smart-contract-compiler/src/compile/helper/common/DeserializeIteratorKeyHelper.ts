import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { prefixSize } from '../iterator';

// Input: [keyBuffer]
// Output: [keyBuffer]
export class DeserializeIteratorKeyHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [key, key]
    sb.emitOp(node, 'DUP');
    // [keySize, key]
    sb.emitOp(node, 'SIZE');
    // [prefixSize, keySize, key]
    sb.emitPushInt(node, prefixSize);
    // [keySize - prefixSize, key]
    sb.emitOp(node, 'SUB');
    // [key]
    sb.emitOp(node, 'RIGHT');
    // [key]
    sb.emitHelper(node, options, sb.helpers.binaryDeserialize);
  }
}
