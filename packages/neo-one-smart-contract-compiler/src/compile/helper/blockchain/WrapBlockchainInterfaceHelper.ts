import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import {
  BlockchainInterfaceName,
  InternalBlockchainInterfaceProperties,
} from './InternalBlockchainInterfaceProperties';

export interface WrapBlockchainInterfaceHelperOptions {
  name: BlockchainInterfaceName;
}

// Input: [blockchainInterface]
// Output: [objectVal]
export class WrapBlockchainInterfaceHelper extends Helper {
  private readonly name: BlockchainInterfaceName;

  constructor(options: WrapBlockchainInterfaceHelperOptions) {
    super();
    this.name = options.name;
  }

  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    const options = sb.pushValueOptions(optionsIn);
    // [objectVal, blockchainInterface]
    sb.emitHelper(node, options, sb.helpers.createObject);
    // [objectVal, blockchainInterface, objectVal]
    sb.emitOp(node, 'TUCK');
    // ['__brand', objectVal, blockchainInterface, objectVal]
    sb.emitPushString(node, '__brand');
    // [name, '__brand', objectVal, blockchainInterface, objectVal]
    sb.emitPushString(node, this.name);
    // [nameVal, '__brand', objectVal, blockchainInterface, objectVal]
    sb.emitHelper(node, options, sb.helpers.createString);
    // [blockchainInterface, objectVal]
    sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
    // [objectVal, blockchainInterface, objectVal]
    sb.emitOp(node, 'OVER');
    // ['blockchain_interface', objectVal, blockchainInterface, objectVal]
    sb.emitPushString(
      node,
      InternalBlockchainInterfaceProperties.BLOCKCHAIN_INTERFACE,
    );
    // [blockchainInterface, 'blockchain_interface', objectVal, objectVal]
    sb.emitOp(node, 'ROT');
    // [objectVal]
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }
}
