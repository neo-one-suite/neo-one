import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ForStatementCompiler extends NodeCompiler<ts.ForStatement> {
  public readonly kind = ts.SyntaxKind.ForStatement;

  public visitNode(sb: ScriptBuilder, node: ts.ForStatement, options: VisitOptions): void {
    let initializer;
    const exprInitializer = tsUtils.statement.getInitializer(node);
    if (exprInitializer !== undefined) {
      initializer = () => {
        sb.visit(exprInitializer, sb.noPushValueOptions(options));
      };
    }

    let condition;
    const exprCondition = tsUtils.statement.getCondition(node);
    if (exprCondition !== undefined) {
      condition = () => {
        sb.visit(exprCondition, sb.pushValueOptions(options));
        sb.emitHelper(
          exprCondition,
          sb.pushValueOptions(options),
          sb.helpers.toBoolean({
            type: sb.context.analysis.getType(exprCondition),
          }),
        );
      };
    }

    let incrementor;
    const exprIncrementor = tsUtils.statement.getIncrementor(node);
    if (exprIncrementor !== undefined) {
      incrementor = () => {
        sb.visit(exprIncrementor, sb.noPushValueOptions(options));
      };
    }

    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        initializer,
        condition,
        incrementor,
        each: (innerOptions) => {
          sb.visit(tsUtils.statement.getStatement(node), sb.noPushValueOptions(innerOptions));
        },
      }),
    );
  }
}
