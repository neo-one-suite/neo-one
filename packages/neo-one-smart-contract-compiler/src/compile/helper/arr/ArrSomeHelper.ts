import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrSomeHelperOptions {
  readonly map?: (options: VisitOptions) => void;
}

// Input: [arr]
// Output: [boolean]
export class ArrSomeHelper extends Helper {
  private readonly map: (options: VisitOptions) => void;

  public constructor(options: ArrSomeHelperOptions) {
    super();
    this.map =
      options.map === undefined
        ? () => {
            // do nothing
          }
        : options.map;
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
      sb.helpers.rawEnumeratorSome({
        each: this.map,
      }),
    );
  }
}
