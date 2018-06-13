import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { ExportHelperOptions } from './ExportHelper';

// Input: [val]
// Output: []
export class ExportSingleHelper extends Helper {
  private readonly options: ExportHelperOptions;

  constructor(options: ExportHelperOptions) {
    super();
    this.options = options;
  }

  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [exports, val]
    sb.emitHelper(node, options, sb.helpers.getCurrentModule);
    // [val, exports]
    sb.emitOp(node, 'SWAP');
    // []
    sb.emitHelper(node, options, sb.helpers.export(this.options));
  }
}
