import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';
import * as constants from '../../constants';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class TryStatementCompiler extends NodeCompiler<ts.TryStatement> {
  public readonly kind = ts.SyntaxKind.TryStatement;

  public visitNode(sb: ScriptBuilder, node: ts.TryStatement, options: VisitOptions): void {
    const catchClause = tsUtils.statement.getCatchClause(node);
    const finallyBlock = tsUtils.statement.getFinallyBlock(node);

    const pushFinally = () => {
      if (finallyBlock !== undefined) {
        // [finally]
        sb.emitPushInt(node, constants.FINALLY_COMPLETION);
        // [finally, finally]
        sb.emitPushInt(node, constants.FINALLY_COMPLETION);
        // [finally, finally, finally]
        sb.emitPushInt(node, constants.FINALLY_COMPLETION);
      }
    };

    sb.withProgramCounter((finallyPC) => {
      sb.withProgramCounter((catchPC) => {
        let pcOptions =
          catchClause === undefined ? sb.noCatchPCOptions(options) : sb.catchPCOptions(options, catchPC.getLast());
        pcOptions = finallyBlock === undefined ? pcOptions : sb.finallyPCOptions(pcOptions, finallyPC.getLast());
        sb.visit(tsUtils.statement.getTryBlock(node), pcOptions);
        pushFinally();
        sb.emitJmp(node, 'JMP', finallyPC.getLast());
      });

      const finallyOptions = finallyBlock === undefined ? options : sb.finallyPCOptions(options, finallyPC.getLast());
      if (catchClause !== undefined) {
        const variable = tsUtils.statement.getOnlyVariableDeclaration(catchClause);
        // [val]
        sb.emitOp(node, 'DROP');
        if (variable === undefined) {
          // []
          sb.emitOp(node, 'DROP');
          // []
          sb.visit(tsUtils.statement.getBlock(catchClause), finallyOptions);
        } else {
          sb.withScope(node, finallyOptions, (innerOptions) => {
            // []
            sb.visit(variable, sb.setValueOptions(innerOptions));
            // []
            sb.visit(tsUtils.statement.getBlock(catchClause), innerOptions);
          });
        }

        pushFinally();
      }
    });

    if (finallyBlock !== undefined) {
      const completion = sb.scope.addUnique();
      const val = sb.scope.addUnique();
      // [completion, val]
      sb.emitOp(finallyBlock, 'DROP');
      // [val]
      sb.scope.set(sb, finallyBlock, options, completion);
      // []
      sb.scope.set(sb, finallyBlock, options, val);
      // []
      sb.visit(finallyBlock, options);
      // [completion]
      sb.scope.get(sb, finallyBlock, options, completion);

      const condition = (value: number) => () => {
        sb.emitOp(finallyBlock, 'DUP');
        sb.emitPushInt(finallyBlock, value);
        sb.emitOp(finallyBlock, 'NUMEQUAL');
      };
      sb.emitHelper(
        finallyBlock,
        options,
        sb.helpers.case(
          [
            {
              condition: condition(constants.FINALLY_COMPLETION),
              whenTrue: () => {
                sb.emitOp(finallyBlock, 'DROP');
              },
            },
            {
              condition: condition(constants.THROW_COMPLETION),
              whenTrue: () => {
                sb.emitOp(finallyBlock, 'DROP');
                sb.scope.get(sb, finallyBlock, options, val);
                sb.emitHelper(finallyBlock, options, sb.helpers.throwCompletion);
              },
            },
            {
              condition: condition(constants.NORMAL_COMPLETION),
              whenTrue: () => {
                sb.emitOp(finallyBlock, 'DROP');
                sb.scope.get(sb, finallyBlock, options, val);
                sb.emitHelper(finallyBlock, options, sb.helpers.return);
              },
            },
            options.breakPC === undefined
              ? undefined
              : {
                  condition: condition(constants.BREAK_COMPLETION),
                  whenTrue: () => {
                    sb.emitOp(finallyBlock, 'DROP');
                    sb.emitHelper(finallyBlock, options, sb.helpers.break);
                  },
                },
            options.continuePC === undefined
              ? undefined
              : {
                  condition: condition(constants.CONTINUE_COMPLETION),
                  whenTrue: () => {
                    sb.emitOp(finallyBlock, 'DROP');
                    sb.emitHelper(finallyBlock, options, sb.helpers.continue);
                  },
                },
          ].filter(utils.notNull),
          () => {
            sb.emitOp(finallyBlock, 'DROP');
          },
        ),
      );
    }
  }
}
