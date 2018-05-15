import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

export interface Case {
  condition: () => void;
  whenTrue: () => void;
}

// Input: []
// Output: []
export class CaseHelper extends Helper {
  private readonly cases: Case[];
  private readonly defaultCase: () => void;

  constructor(cases: Case[], defaultCase: () => void) {
    super();
    this.cases = cases;
    this.defaultCase = defaultCase;
  }

  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    this.addCase(sb, node, options);
  }

  public addCase(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    idx: number = 0,
  ): void {
    if (idx >= this.cases.length) {
      this.defaultCase();
    } else {
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: this.cases[idx].condition,
          whenTrue: this.cases[idx].whenTrue,
          whenFalse: () => this.addCase(sb, node, options, idx + 1),
        }),
      );
    }
  }
}
