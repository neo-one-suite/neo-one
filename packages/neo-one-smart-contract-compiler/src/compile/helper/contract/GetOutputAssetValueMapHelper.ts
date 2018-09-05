import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [outputs]
// Output: [map]
export class GetOutputAssetValueMapHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    // [map, outputs]
    sb.emitOp(node, 'NEWMAP');
    // [outputs, map]
    sb.emitOp(node, 'SWAP');
    // [map]
    sb.emitHelper(
      node,
      optionsIn,
      sb.helpers.mergeAssetValueMaps({
        add: true,
      }),
    );
  }
}
