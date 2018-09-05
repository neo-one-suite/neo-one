import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface MapSomeHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [map]
// Output: [boolean]
export class MapSomeHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: MapSomeHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [iterator]
    sb.emitSysCall(node, 'Neo.Iterator.Create');
    // [accum]
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorSome({
        each: this.each,
      }),
    );
  }
}
