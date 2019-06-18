import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ContractPropertyName } from '../../../constants';
import { Types } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { createWrapParam } from './utils';

export interface HandleSendHelperOptions {
  readonly method: ts.MethodDeclaration | ts.PropertyDeclaration;
  readonly returnType: ts.Type | undefined;
}

// Input: []
// Output: [boolean]
export class HandleSendHelper extends Helper {
  private readonly method: ts.MethodDeclaration | ts.PropertyDeclaration;
  private readonly returnType: ts.Type | undefined;

  public constructor({ method, returnType }: HandleSendHelperOptions) {
    super();
    this.method = method;
    this.returnType = returnType;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const method = this.method;
    if (ts.isPropertyDeclaration(method)) {
      sb.context.reportUnsupported(method);

      return;
    }

    // isProcessed(Blockchain.currentTransaction.hash)
    // [transaction]
    sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
    // [hash]
    sb.emitSysCall(node, 'Neo.Transaction.GetHash');
    // [boolean]
    sb.emitHelper(node, options, sb.helpers.isProcessedTransaction);

    // !firstOutputToSelf()
    // [transaction, boolean]
    sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
    // [outputs, boolean]
    sb.emitSysCall(node, 'Neo.Transaction.GetOutputs');
    // [outputs, outputs, boolean]
    sb.emitOp(node, 'DUP');
    // [outputs, outputs, outputs, boolean]
    sb.emitOp(node, 'DUP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [size, outputs, outputs, boolean]
          sb.emitOp(node, 'ARRAYSIZE');
          // [0, size, outputs, outputs, boolean]
          sb.emitPushInt(node, 0);
          // [size <= 0, outputs, outputs, boolean]
          sb.emitOp(node, 'LTE');
        },
        whenTrue: () => {
          // [outputs, boolean]
          sb.emitOp(node, 'DROP');
          // [boolean, outputs, boolean]
          sb.emitPushBoolean(node, true);
        },
        whenFalse: () => {
          // [0, outputs, outputs, boolean]
          sb.emitPushInt(node, 0);
          // [output, outputs, boolean]
          sb.emitOp(node, 'PICKITEM');
          // [buffer, outputs, boolean]
          sb.emitSysCall(node, 'Neo.Output.GetScriptHash');
          // [buffer, buffer, outputs, boolean]
          sb.emitSysCall(node, 'System.ExecutionEngine.GetExecutingScriptHash');
          // [firstOutputToSelf, outputs, boolean]
          sb.emitOp(node, 'EQUAL');
          // [boolean, outputs, boolean]
          sb.emitOp(node, 'NOT');
        },
      }),
    );

    // [boolean, boolean, outputs]
    sb.emitOp(node, 'ROT');
    // [boolean, outputs]
    sb.emitOp(node, 'BOOLOR');

    // !allInputsAreProcessedAndUnclaimed()
    // [transaction, boolean, outputs]
    sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
    // [inputs, boolean, outputs]
    sb.emitSysCall(node, 'Neo.Transaction.GetInputs');
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrEvery({
        map: (innerOptions) => {
          // [input, input]
          sb.emitOp(node, 'DUP');
          // [buffer, input]
          sb.emitSysCall(node, 'Neo.Input.GetHash');
          // [buffer, buffer, input]
          sb.emitOp(node, 'DUP');
          // [boolean, buffer, input]
          sb.emitHelper(node, innerOptions, sb.helpers.isProcessedTransaction);
          // [buffer, boolean, input]
          sb.emitOp(node, 'SWAP');
          // [boolean, boolean, input]
          sb.emitHelper(node, innerOptions, sb.helpers.isClaimedTransaction);
          // [boolean, boolean, input]
          sb.emitOp(node, 'NOT');
          // [input, boolean, boolean]
          sb.emitOp(node, 'ROT');
          // [number, boolean, boolean]
          sb.emitSysCall(node, 'Neo.Input.GetIndex');
          // [0, number, boolean, boolean]
          sb.emitPushInt(node, 0);
          // [number === 0, boolean, boolean]
          sb.emitOp(node, 'NUMEQUAL');
          // [number !== 0, boolean, boolean]
          sb.emitOp(node, 'NOT');
          // [boolean, boolean]
          sb.emitOp(node, 'BOOLOR');
          // [boolean]
          sb.emitOp(node, 'BOOLAND');
        },
      }),
    );
    // [boolean, boolean, outputs]
    sb.emitOp(node, 'NOT');
    // [boolean, outputs]
    sb.emitOp(node, 'BOOLOR');

    // !netZero()
    // [outputs, boolean, outputs]
    sb.emitOp(node, 'OVER');
    // [map, boolean, outputs]
    sb.emitHelper(node, options, sb.helpers.getOutputAssetValueMap);
    // [transaction, map, boolean, outputs]
    sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
    // [references, map, boolean, outputs]
    sb.emitSysCall(node, 'Neo.Transaction.GetReferences');
    // [map, boolean, outputs]
    sb.emitHelper(node, options, sb.helpers.mergeAssetValueMaps({ add: false }));
    // [boolean, boolean, outputs]
    sb.emitHelper(
      node,
      optionsIn,
      sb.helpers.mapEvery({
        each: () => {
          // [value]
          sb.emitOp(node, 'DROP');
          // [0, value]
          sb.emitPushInt(node, 0);
          // [boolean]
          sb.emitOp(node, 'NUMEQUAL');
        },
      }),
    );
    // [boolean, boolean, outputs]
    sb.emitOp(node, 'NOT');

    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [boolean, outputs]
          sb.emitOp(node, 'BOOLOR');
        },
        whenTrue: () => {
          // []
          sb.emitOp(node, 'DROP');
          // [boolean]
          sb.emitPushBoolean(node, false);
        },
        whenFalse: () => {
          // [0, outputs]
          sb.emitPushInt(node, 0);
          // [output]
          sb.emitOp(node, 'PICKITEM');
          // [number, output]
          sb.emitPushInt(node, 1);
          // [arg, output]
          sb.emitHelper(node, options, sb.helpers.getArgument);
          // [output, arg, output]
          sb.emitOp(node, 'OVER');
          // [arg, output, arg, output]
          sb.emitOp(node, 'OVER');
          // [arg, arg, output, arg, output]
          sb.emitOp(node, 'DUP');
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [size, arg, output, arg, output]
                sb.emitOp(node, 'ARRAYSIZE');
                // [size, size, arg, output, arg, output]
                sb.emitOp(node, 'DUP');
                // [0, size, size, arg, output, arg, output]
                sb.emitPushInt(node, 0);
                // [size == 0, size, arg, output, arg, output]
                sb.emitOp(node, 'NUMEQUAL');
              },
              whenTrue: () => {
                // [arg, output, arg, output]
                sb.emitOp(node, 'DROP');
                // [output, arg, output]
                sb.emitOp(node, 'DROP');
                // [arg, output]
                sb.emitOp(node, 'DROP');
                // [output]
                sb.emitOp(node, 'DROP');
                // []
                sb.emitOp(node, 'DROP');
                // [boolean]
                sb.emitPushBoolean(node, false);
              },
              whenFalse: () => {
                // [size - 1, arg, output, arg, output]
                sb.emitOp(node, 'DEC');
                // [arg, size - 1, arg, output, arg, output]
                sb.emitOp(node, 'OVER');
                // [size - 1, arg, size - 1, arg, output, arg, output]
                sb.emitOp(node, 'OVER');
                // [receiver, size - 1, arg, output, arg, output]
                sb.emitOp(node, 'PICKITEM');
                // [arg, receiver, size - 1, output, arg, output]
                sb.emitOp(node, 'ROT');
                // [size - 1, arg, receiver, output, arg, output]
                sb.emitOp(node, 'ROT');
                // [receiver, output, arg, output]
                sb.emitOp(node, 'REMOVE');
                // [transfer, receiver, output, arg, output]
                sb.emitOp(node, 'NEWMAP');
                // [transfer, receiver, transfer, output, arg, output]
                sb.emitOp(node, 'TUCK');
                // [receiver, transfer, receiver, transfer, output, arg, output]
                sb.emitOp(node, 'OVER');
                // ['to', receiver, transfer, receiver, transfer, output, arg, output]
                sb.emitPushString(node, 'to');
                // [receiver, 'to', transfer, receiver, transfer, output, arg, output]
                sb.emitOp(node, 'SWAP');
                // [receiver, transfer, output, arg, output]
                sb.emitOp(node, 'SETITEM');
                // [output, receiver, transfer, arg, output]
                sb.emitOp(node, 'ROT');
                // [transfer, output, receiver, arg, output]
                sb.emitOp(node, 'ROT');
                // [transfer, output, transfer, receiver, arg, output]
                sb.emitOp(node, 'TUCK');
                // ['asset', transfer, output, transfer, receiver, arg, output]
                sb.emitPushString(node, 'asset');
                // [output, 'asset', transfer, transfer, receiver, arg, output]
                sb.emitOp(node, 'ROT');
                // [buffer, 'asset', transfer, transfer, receiver, arg, output]
                sb.emitSysCall(node, 'Neo.Output.GetAssetId');
                // [transfer, receiver, arg, output]
                sb.emitOp(node, 'SETITEM');
                // [arg, transfer, receiver, output]
                sb.emitOp(node, 'ROT');
                // [arg, transfer, arg, receiver, output]
                sb.emitOp(node, 'TUCK');
                // [transfer, arg, transfer, arg, receiver, output]
                sb.emitOp(node, 'OVER');
                // [transfer, arg, receiver, output]
                sb.emitOp(node, 'APPEND');
                // ['amount', transfer, arg, receiver, output]
                sb.emitPushString(node, 'amount');
                // [4, 'amount', transfer, arg, receiver, output]
                sb.emitPushInt(node, 4);
                // [output, 'amount', transfer, arg, receiver]
                sb.emitOp(node, 'ROLL');
                // [value, 'amount', transfer, arg, receiver]
                sb.emitSysCall(node, 'Neo.Output.GetValue');
                // [arg, receiver]
                sb.emitOp(node, 'SETITEM');
                sb.withScope(node, options, (innerOptions) => {
                  // [receiver]
                  sb.emitHelper(
                    node,
                    innerOptions,
                    sb.helpers.parameters({
                      params: tsUtils.parametered.getParameters(method),
                      mapParam: createWrapParam(sb),
                    }),
                  );

                  // [val, receiver]
                  sb.emitHelper(node, innerOptions, sb.helpers.invokeSmartContractMethod({ method }));
                  // [value, receiver]
                  sb.emitHelper(node, innerOptions, sb.helpers.unwrapValRecursive({ type: this.returnType }));
                  // [receiver, value]
                  sb.emitOp(node, 'SWAP');
                  // [transaction, receiver, value]
                  sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
                  // [hash, receiver, value]
                  sb.emitSysCall(node, 'Neo.Transaction.GetHash');
                  // [bufferVal, receiver, value]
                  sb.emitHelper(node, innerOptions, sb.helpers.wrapBuffer);
                  // [receiver, bufferVal, value]
                  sb.emitOp(node, 'SWAP');
                  // [val, receiver, bufferVal, value]
                  sb.emitHelper(
                    node,
                    innerOptions,
                    sb.helpers.createStructuredStorage({
                      prefix: ContractPropertyName.claimedTransactions,
                      type: Types.MapStorage,
                    }),
                  );
                  // [bufferVal, val, receiver, value]
                  sb.emitOp(node, 'ROT');
                  // [receiver, bufferVal, val, value]
                  sb.emitOp(node, 'ROT');
                  // [receiverVal, bufferVal, val, value]
                  sb.emitHelper(node, innerOptions, sb.helpers.wrapBuffer);
                  // [value]
                  sb.emitHelper(
                    node,
                    options,
                    sb.helpers.setStructuredStorage({
                      type: Types.MapStorage,
                      keyType: undefined,
                      knownKeyType: Types.Buffer,
                    }),
                  );
                  // [value]
                  sb.emitHelper(node, innerOptions, sb.helpers.setProcessedTransaction);
                });
              },
            }),
          );
        },
      }),
    );
  }
}
