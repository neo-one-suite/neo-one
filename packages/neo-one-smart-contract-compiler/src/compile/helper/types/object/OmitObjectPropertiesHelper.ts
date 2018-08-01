import ts from 'typescript';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [propertyArr, symbolArr, objectVal]
// Output: []
export class OmitObjectPropertiesHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [objectVal, propertyArr, symbolArr]
    sb.emitOp(node, 'ROT');
    // [objectVal, propertyArr, objectVal, symbolArr]
    sb.emitOp(node, 'TUCK');
    // [propertyArr, objectVal, objectVal, symbolArr]
    sb.emitOp(node, 'SWAP');
    // [objectVal, symbolArr]
    sb.emitHelper(node, options, sb.helpers.omitPropertyObjectProperties);
    // [symbolArr, objectVal]
    sb.emitOp(node, 'SWAP');
    // []
    sb.emitHelper(node, options, sb.helpers.omitSymbolObjectProperties);
  }
}
