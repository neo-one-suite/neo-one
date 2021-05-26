import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface MapEveryHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [map]
// Output: [boolean]
export class MapEveryHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: MapEveryHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [iterator]
    sb.emitHelper(node, options, sb.helpers.createMapIterator);
    // [accum]
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorEvery({
        each: this.each,
      }),
    );
  }
}
