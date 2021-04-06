import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrFindHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [arr]
// Output: [val]
export class ArrFindHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: ArrFindHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [map]
    sb.emitHelper(node, options, sb.helpers.arrToMap);
    // [enumerator]
    sb.emitSysCall(node, 'System.Iterator.Create');
    // [val]
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawEnumeratorFind({
        each: this.each,
      }),
    );
  }
}
