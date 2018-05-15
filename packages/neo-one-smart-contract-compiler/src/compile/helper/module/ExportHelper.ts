import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

export interface ExportHelperOptions {
  name?: string;
  defaultExport?: boolean;
}

// Input: [val, exports]
// Output: []
export class ExportHelper extends Helper {
  private readonly name: string | undefined;
  private readonly defaultExport: boolean;

  constructor({ name, defaultExport }: ExportHelperOptions) {
    super();
    this.name = name;
    this.defaultExport = defaultExport || false;
  }

  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    if (this.name != null) {
      sb.addExport(this.name);
      // [name, val, exports]
      sb.emitPushString(node, this.name);
    } else if (this.defaultExport) {
      // [name, val, exports]
      sb.emitPushString(node, 'default');
    } else {
      sb.reportUnsupported(node);
    }

    // [val, name, exports]
    sb.emitOp(node, 'SWAP');
    // []
    sb.emitOp(node, 'SETITEM');
  }
}
