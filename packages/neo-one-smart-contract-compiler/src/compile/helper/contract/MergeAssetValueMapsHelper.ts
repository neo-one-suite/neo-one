import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface MergeAssetValueMapsHelperOptions {
  readonly add: boolean;
}

// Input: [outputs, map]
// Output: [map]
export class MergeAssetValueMapsHelper extends Helper {
  private readonly add: boolean;

  public constructor({ add }: MergeAssetValueMapsHelperOptions) {
    super();
    this.add = add;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [map, outputs]
    sb.emitOp(node, 'SWAP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrReduce({
        each: () => {
          // [map, output, map]
          sb.emitOp(node, 'TUCK');
          // [map, output, map, map]
          sb.emitOp(node, 'TUCK');
          // [output, map, output, map, map]
          sb.emitOp(node, 'OVER');
          // [hash, map, output, map, map]
          sb.emitSysCall(node, 'Neo.Output.GetScriptHash');
          // [hash, hash, map, output, map, map]
          sb.emitSysCall(node, 'System.ExecutionEngine.GetExecutingScriptHash');
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [boolean, map, output, map, map]
                sb.emitOp(node, 'EQUAL');
              },
              whenTrue: () => {
                // [output, map, output, map, map]
                sb.emitOp(node, 'OVER');
                // [map, output, map, output, map, map]
                sb.emitOp(node, 'OVER');
                // [output, map, map, output, map, map]
                sb.emitOp(node, 'SWAP');
                // [hash, map, map, output, map, map]
                sb.emitSysCall(node, 'Neo.Output.GetAssetId');
                // [hash, map, hash, map, output, map, map]
                sb.emitOp(node, 'TUCK');
                sb.emitHelper(
                  node,
                  options,
                  sb.helpers.if({
                    condition: () => {
                      // [hasKey, hash, map, output, map, map]
                      sb.emitOp(node, 'HASKEY');
                    },
                    whenTrue: () => {
                      // [hash, map, hash, output, map, map]
                      sb.emitOp(node, 'TUCK');
                      // [value, hash, output, map, map]
                      sb.emitOp(node, 'PICKITEM');
                      // [output, value, hash, map, map]
                      sb.emitOp(node, 'ROT');
                      // [value, value, hash, map, map]
                      sb.emitSysCall(node, 'Neo.Output.GetValue');
                      if (this.add) {
                        // [value, hash, map, map]
                        sb.emitOp(node, 'ADD');
                      } else {
                        // [value, hash, map, map]
                        sb.emitOp(node, 'SUB');
                      }

                      // [map]
                      sb.emitOp(node, 'SETITEM');
                    },
                    whenFalse: () => {
                      // [output, hash, map, map, map]
                      sb.emitOp(node, 'ROT');
                      // [value, hash, map, map, map]
                      sb.emitSysCall(node, 'Neo.Output.GetValue');
                      if (!this.add) {
                        // [value, hash, map, map, map]
                        sb.emitOp(node, 'NEGATE');
                      }
                      // [map, map]
                      sb.emitOp(node, 'SETITEM');
                      // [map]
                      sb.emitOp(node, 'DROP');
                    },
                  }),
                );
              },
              whenFalse: () => {
                // [output, map, map]
                sb.emitOp(node, 'DROP');
                // [map, map]
                sb.emitOp(node, 'DROP');
                // [map]
                sb.emitOp(node, 'DROP');
              },
            }),
          );
        },
      }),
    );

    if (!optionsIn.pushValue) {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
