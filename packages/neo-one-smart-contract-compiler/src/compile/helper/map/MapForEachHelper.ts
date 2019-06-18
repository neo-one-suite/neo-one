import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface MapForEachHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [map]
// Output: []
export class MapForEachHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: MapForEachHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [iterator]
    sb.emitSysCall(node, 'Neo.Iterator.Create');
    // []
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorForEach({
        each: this.each,
      }),
    );
  }
}
