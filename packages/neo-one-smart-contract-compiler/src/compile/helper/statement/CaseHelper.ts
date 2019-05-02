import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface Case {
  readonly condition: () => void;
  readonly whenTrue: () => void;
}

// Input: []
// Output: []
export class CaseHelper extends Helper {
  private readonly cases: readonly Case[];
  private readonly defaultCase: () => void;

  public constructor(cases: readonly Case[], defaultCase: () => void) {
    super();
    this.cases = cases;
    this.defaultCase = defaultCase;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    this.addCase(sb, node, options);
  }

  public addCase(sb: ScriptBuilder, node: ts.Node, options: VisitOptions, idx = 0): void {
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
