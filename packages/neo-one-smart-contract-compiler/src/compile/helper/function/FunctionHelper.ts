import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface FunctionHelperOptions {
  readonly body: (options: VisitOptions) => void;
}

// Input: []
// Output: [jumpTarget]
export class FunctionHelper extends Helper {
  private readonly body: (options: VisitOptions) => void;

  public constructor({ body }: FunctionHelperOptions) {
    super();
    this.body = body;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (options.pushValue) {
      const jump = sb.jumpTable.add(sb, node, () => {
        const innerOptions = { superClass: options.superClass };
        this.body(innerOptions);
      });
      sb.emitPushInt(node, jump);
    }
  }
}
