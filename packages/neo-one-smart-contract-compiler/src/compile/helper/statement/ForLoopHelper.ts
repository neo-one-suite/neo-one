import ts from 'typescript';
import * as constants from '../../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export type ForLoopHelperFunction = (() => void) | undefined;
export interface ForLoopHelperOptions {
  readonly each: (options: VisitOptions) => void;
  readonly condition: ForLoopHelperFunction;
  readonly incrementor?: ForLoopHelperFunction;
  readonly handleReturn?: ForLoopHelperFunction;
  readonly cleanup: () => void;
}

export class ForLoopHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;
  private readonly condition: ForLoopHelperFunction;
  private readonly incrementor: ForLoopHelperFunction;
  private readonly handleReturn: () => void;
  private readonly cleanup: () => void;

  public constructor({ each, cleanup, condition, incrementor, handleReturn }: ForLoopHelperOptions) {
    super();
    this.each = each;
    this.condition = condition;
    this.incrementor = incrementor;
    this.handleReturn = handleReturn === undefined ? cleanup : handleReturn;
    this.cleanup = cleanup;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.withProgramCounter((loopPC) => {
      if (this.condition !== undefined) {
        this.condition();
      }

      if (!loopPC.getFirst().equals(loopPC.getCurrent())) {
        sb.emitJmp(node, 'JMPIFNOT_L', loopPC.getLast());
      }

      sb.withProgramCounter((finallyPC) => {
        this.each(
          sb.finallyPCOptions(
            sb.breakPCOptions(
              sb.continuePCOptions(sb.noCatchPCOptions(options), finallyPC.getLast()),
              finallyPC.getLast(),
            ),
            finallyPC.getLast(),
          ),
        );

        if (this.incrementor !== undefined) {
          this.incrementor();
        }

        sb.emitJmp(node, 'JMP_L', loopPC.getFirst());
      });

      // Drop finally completion
      // [completion, val]
      sb.emitOp(node, 'DROP');
      const condition = (value: number) => () => {
        sb.emitOp(node, 'DUP');
        sb.emitPushInt(node, value);
        sb.emitOp(node, 'NUMEQUAL');
      };
      const val = sb.scope.addUnique();
      sb.emitHelper(
        node,
        options,
        sb.helpers.case(
          [
            {
              condition: condition(constants.THROW_COMPLETION),
              whenTrue: () => {
                // [val]
                sb.emitOp(node, 'DROP');
                // []
                sb.scope.set(sb, node, options, val);
                // []
                this.handleReturn();
                // [val]
                sb.scope.get(sb, node, options, val);
                // []
                sb.emitHelper(node, options, sb.helpers.throwCompletionBase);
              },
            },
            {
              condition: condition(constants.NORMAL_COMPLETION),
              whenTrue: () => {
                // [val]
                sb.emitOp(node, 'DROP');
                // []
                sb.scope.set(sb, node, options, val);
                // []
                this.handleReturn();
                // [val]
                sb.scope.get(sb, node, options, val);
                // []
                sb.emitHelper(node, options, sb.helpers.return);
              },
            },
            {
              condition: condition(constants.BREAK_COMPLETION),
              whenTrue: () => {
                // [val]
                sb.emitOp(node, 'DROP');
                // []
                sb.emitOp(node, 'DROP');
              },
            },
          ],
          () => {
            // [val]
            sb.emitOp(node, 'DROP');
            // []
            sb.emitOp(node, 'DROP');
            if (this.incrementor !== undefined) {
              this.incrementor();
            }
            sb.emitJmp(node, 'JMP_L', loopPC.getFirst());
          },
        ),
      );
    });
    // []
    this.cleanup();
  }
}
