import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { createWrapParam } from './utils';

export interface HandleSendUnsafeReceiveHelperBaseOptions {
  readonly method: ts.MethodDeclaration;
  readonly returnType: ts.Type | undefined;
  readonly opposite: boolean;
}

// Input: []
// Output: [boolean]
export abstract class HandleSendUnsafeReceiveHelperBase extends Helper {
  protected abstract readonly lessThan: boolean;
  private readonly method: ts.MethodDeclaration;
  private readonly returnType: ts.Type | undefined;
  private readonly opposite: boolean;

  public constructor({ method, returnType, opposite }: HandleSendUnsafeReceiveHelperBaseOptions) {
    super();
    this.method = method;
    this.returnType = returnType;
    this.opposite = opposite;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // isProcessed(Blockchain.currentTransaction.hash)
    // [transaction]
    sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
    // [hash]
    sb.emitSysCall(node, 'Neo.Transaction.GetHash');
    // [boolean]
    sb.emitHelper(node, options, sb.helpers.isProcessedTransaction);

    // !isReceiveMethod() && !onlySentAssets()
    if (!this.opposite) {
      // [transaction, boolean]
      sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
      // [outputs, boolean]
      sb.emitSysCall(node, 'Neo.Transaction.GetOutputs');
      // [map, boolean]
      sb.emitHelper(node, options, sb.helpers.getOutputAssetValueMap);
      // [transaction, map, boolean]
      sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
      // [outputs, map, boolean]
      sb.emitSysCall(node, 'Neo.Transaction.GetReferences');
      // [map, boolean]
      sb.emitHelper(node, options, sb.helpers.mergeAssetValueMaps({ add: false }));
      // [boolean, boolean]
      sb.emitHelper(
        node,
        optionsIn,
        sb.helpers.mapEvery({
          each: () => {
            // [value]
            sb.emitOp(node, 'DROP');
            // [0, value]
            sb.emitPushInt(node, 0);
            // [value > 0]
            sb.emitOp(node, this.lessThan ? 'LT' : 'GT');
          },
        }),
      );
      // [boolean, boolean]
      sb.emitOp(node, 'NOT');
      // [boolean]
      sb.emitOp(node, 'BOOLOR');
    }

    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // do nothing
        },
        whenTrue: () => {
          // [boolean]
          sb.emitPushBoolean(node, false);
        },
        whenFalse: () => {
          // [number]
          sb.emitPushInt(node, 1);
          // [arg]
          sb.emitHelper(node, options, sb.helpers.getArgument);
          sb.withScope(node, options, (innerOptions) => {
            // []
            sb.emitHelper(
              node,
              innerOptions,
              sb.helpers.parameters({
                params: tsUtils.parametered.getParameters(this.method),
                mapParam: createWrapParam(sb),
              }),
            );

            // [val]
            sb.emitHelper(node, innerOptions, sb.helpers.invokeSmartContractMethod({ method: this.method }));
            // [value]
            sb.emitHelper(node, innerOptions, sb.helpers.unwrapValRecursive({ type: this.returnType }));
            // [value]
            sb.emitHelper(node, innerOptions, sb.helpers.setProcessedTransaction);
          });
        },
      }),
    );
  }
}
