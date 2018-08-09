import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ExportHelperOptions {
  readonly name?: string;
  readonly defaultExport?: boolean;
}

// Input: [val, exports]
// Output: []
export class ExportHelper extends Helper {
  private readonly name: string | undefined;
  private readonly defaultExport: boolean;

  public constructor({ name, defaultExport }: ExportHelperOptions) {
    super();
    this.name = name;
    this.defaultExport = defaultExport || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, _optionsIn: VisitOptions): void {
    if (this.name !== undefined) {
      sb.addExport(this.name);
      // [name, val, exports]
      sb.emitPushString(node, this.name);
    } else if (this.defaultExport) {
      // [name, val, exports]
      sb.emitPushString(node, 'default');
    } else {
      sb.context.reportUnsupported(node);
    }

    // [val, name, exports]
    sb.emitOp(node, 'SWAP');
    // []
    sb.emitOp(node, 'SETITEM');
  }
}
