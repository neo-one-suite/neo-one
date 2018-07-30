import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { InternalBufferProperties } from './InternalBufferProperties';

// Input: [byteArray, objectVal]
// Output: []
export class SetBufferValueHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // ['data', byteArray, objectVal]
    sb.emitPushString(node, InternalBufferProperties.Data);
    // [byteArray, 'data', objectVal]
    sb.emitOp(node, 'SWAP');
    // []
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }
}
