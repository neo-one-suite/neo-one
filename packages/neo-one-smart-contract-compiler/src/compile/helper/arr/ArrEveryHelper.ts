import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrEveryHelperOptions {
  readonly map?: (options: VisitOptions) => void;
}

// Input: [arr]
// Output: [boolean]
export class ArrEveryHelper extends Helper {
  private readonly map: (options: VisitOptions) => void;

  public constructor(options: ArrEveryHelperOptions) {
    super();
    this.map =
      options.map === undefined
        ? () => {
            // do nothing
          }
        : options.map;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [enumerator]
    sb.emitSysCall(node, 'Neo.Enumerator.Create');
    // [val]
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawEnumeratorEvery({
        each: this.map,
      }),
    );
  }
}
