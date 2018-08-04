import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { BlockchainInterfaceName } from './BlockchainInterfaceName';

export interface IsBlockchainInterfaceHelperOptions {
  readonly name: BlockchainInterfaceName;
}

// Input: [objectVal]
// Output: [boolean]
export class IsBlockchainInterfaceHelper extends Helper {
  private readonly name: BlockchainInterfaceName;

  public constructor(options: IsBlockchainInterfaceHelperOptions) {
    super();
    this.name = options.name;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    const options = sb.pushValueOptions(optionsIn);
    // ['__brand', objectVal]
    sb.emitPushString(node, '__brand');
    // [brandVal]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
    // [brand]
    sb.emitHelper(node, options, sb.helpers.getString);
    // [name, brand]
    sb.emitPushString(node, this.name);
    // [boolean]
    sb.emitOp(node, 'EQUAL');
  }
}
