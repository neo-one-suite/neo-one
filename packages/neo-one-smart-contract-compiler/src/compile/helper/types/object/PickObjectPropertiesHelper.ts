import ts from 'typescript';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [propertyArr, symbolArr, objectVal]
// Output: [objectVal]
export class PickObjectPropertiesHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [outputObjectVal, propertyArr, symbolArr, objectVal]
    sb.emitHelper(node, options, sb.helpers.createObject);
    // [outputObjectVal, propertyArr, outputObjectVal, symbolArr, objectVal]
    sb.emitOp(node, 'TUCK');
    // [4, outputObjectVal, propertyArr, outputObjectVal, symbolArr, objectVal]
    sb.emitPushInt(node, 4);
    // [objectVal, outputObjectVal, propertyArr, outputObjectVal, symbolArr, objectVal]
    sb.emitOp(node, 'PICK');
    // [propertyArr, objectVal, outputObjectVal, outputObjectVal, symbolArr, objectVal]
    sb.emitOp(node, 'ROT');
    // [outputObjectVal, symbolArr, objectVal]
    sb.emitHelper(node, options, sb.helpers.pickPropertyObjectProperties);
    // [outputObjectVal, outputObjectVal, symbolArr, objectVal]
    sb.emitOp(node, 'DUP');
    // [3, outputObjectVal, outputObjectVal, symbolArr, objectVal]
    sb.emitPushInt(node, 3);
    // [objectVal, outputObjectVal, symbolArr, outputObjectVal]
    sb.emitOp(node, 'XSWAP');
    // [symbolArr, objectVal, outputObjectVal, outputObjectVal]
    sb.emitOp(node, 'ROT');
    // [outputObjectVal]
    sb.emitHelper(node, options, sb.helpers.pickSymbolObjectProperties);
  }
}
