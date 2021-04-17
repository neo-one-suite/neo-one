import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface SetArrValToObjectPropertyHelperOptions {
  readonly index: number;
  readonly key: string;
}

// Input: [objectVal, struct]
// Output: [objectVal]
export class SetArrValToObjectPropertyHelper extends Helper {
  private readonly index: number;
  private readonly key: string;

  public constructor({ index, key }: SetArrValToObjectPropertyHelperOptions) {
    super();
    this.index = index;
    this.key = key;
  }
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [objectVal, objectVal, struct]
    sb.emitOp(node, 'DUP');
    // [stringProp, objectVal, objectVal, struct]
    sb.emitPushString(node, this.key);
    // [number, stringProp, objectVal, objectVal, struct]
    sb.emitPushInt(node, 3);
    // [struct, stringProp, objectVal, objectVal]
    sb.emitOp(node, 'ROLL');
    // [number, struct, stringProp, objectVal, objectVal]
    sb.emitPushInt(node, this.index);
    // [val, stringProp, objectVal, objectVal]
    sb.emitOp(node, 'PICKITEM');
    // [objectVal]
    sb.emitHelper(node, options, sb.helpers.setPropertyObjectProperty);
  }
}
