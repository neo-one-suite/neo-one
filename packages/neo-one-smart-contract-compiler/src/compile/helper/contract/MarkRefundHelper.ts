// tslint:disable prefer-switch
import ts from 'typescript';
import * as constants from '../../../constants';
import { Types } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface MarkRefundHelperOptions {
  readonly isInvalid: () => void;
  readonly execute: (options: VisitOptions) => void;
}

// Input: []
// Output: []
export class MarkRefundHelper extends Helper {
  private readonly isInvalid: () => void;
  private readonly execute: (options: VisitOptions) => void;

  public constructor({ isInvalid, execute }: MarkRefundHelperOptions) {
    super();
    this.isInvalid = isInvalid;
    this.execute = execute;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const mark = (prefix: string) => {
      // [val]
      sb.emitHelper(
        node,
        options,
        sb.helpers.createStructuredStorage({
          prefix,
          type: Types.SetStorage,
        }),
      );
      // [transaction, val]
      sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
      // [hash, val]
      sb.emitSysCall(node, 'Neo.Transaction.GetHash');
      // [hashVal, val]
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
      // [boolean, hashVal, val]
      sb.emitPushBoolean(node, true);
      // [val, hashVal, val]
      sb.emitHelper(node, options, sb.helpers.wrapBoolean);
      // []
      sb.emitHelper(
        node,
        options,
        sb.helpers.setStructuredStorage({
          type: Types.SetStorage,
          keyType: undefined,
          knownKeyType: Types.Buffer,
        }),
      );
    };
    const markRefund = () => {
      mark(constants.ContractPropertyName.allowedRefunds);
    };
    const markProcessed = () => {
      mark(constants.ContractPropertyName.processedTransactions);
    };

    // [transaction]
    sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
    // [hash]
    sb.emitSysCall(node, 'Neo.Transaction.GetHash');
    // [hash, hash]
    sb.emitOp(node, 'DUP');
    // [isProcessedTransaction, hash]
    sb.emitHelper(node, options, sb.helpers.isProcessedTransaction);
    // [hash, isProcessedTransaction]
    sb.emitOp(node, 'SWAP');
    // [isAllowedRefund, isProcessedTransaction]
    sb.emitHelper(node, options, sb.helpers.isAllowedRefund);
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [boolean]
          sb.emitOp(node, 'BOOLOR');
        },
        whenTrue: () => {
          // If it's already processed or marked as a refund, bail
          // [boolean]
          sb.emitPushBoolean(node, false);
        },
        whenFalse: () => {
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: this.isInvalid,
              whenTrue: () => {
                // If it's invalid, mark as refund and bail
                // []
                markRefund();
                // [boolean]
                sb.emitPushBoolean(node, false);
              },
              whenFalse: () => {
                sb.emitHelper(
                  node,
                  options,
                  sb.helpers.if({
                    condition: () => {
                      sb.withProgramCounter((catchPC) => {
                        // [boolean]
                        this.execute(sb.catchPCOptions(options, catchPC.getLast()));
                        // [number, boolean]
                        sb.emitPushInt(node, constants.THROW_COMPLETION);
                      });
                      // [boolean]
                      sb.emitOp(node, 'DROP');
                    },
                    whenTrue: () => {
                      // [boolean]
                      markProcessed();
                      // [boolean]
                      sb.emitPushBoolean(node, true);
                    },
                    whenFalse: () => {
                      // If it's invalid, mark as refund
                      // []
                      markRefund();
                      // [boolean]
                      sb.emitPushBoolean(node, false);
                    },
                  }),
                );
              },
            }),
          );
        },
      }),
    );
  }
}
