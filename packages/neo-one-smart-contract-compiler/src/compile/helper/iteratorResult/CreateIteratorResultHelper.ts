import ts from 'typescript';
import { IteratorResultSlots } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [doneVal, valueVal]
// Output: [val]
export class CreateIteratorResultHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    // [map, doneVal, valueVal]
    sb.emitOp(node, 'NEWMAP');
    // [map, doneVal, map, valueVal]
    sb.emitOp(node, 'TUCK');
    // [number, map, doneVal, map, valueVal]
    sb.emitPushInt(node, IteratorResultSlots.done);
    // [doneVal, number, map, map, valueVal]
    sb.emitOp(node, 'ROT');
    // [map, valueVal]
    sb.emitOp(node, 'SETITEM');
    // [map, valueVal, map]
    sb.emitOp(node, 'TUCK');
    // [number, map, valueVal, map]
    sb.emitPushInt(node, IteratorResultSlots.value);
    // [valueVal, number, map, map]
    sb.emitOp(node, 'ROT');
    // [map]
    sb.emitOp(node, 'SETITEM');
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapIteratorResult);
  }
}
