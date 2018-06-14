import { ForStatement, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ForStatementCompiler extends NodeCompiler<ForStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.ForStatement;

  public visitNode(sb: ScriptBuilder, node: ForStatement, options: VisitOptions): void {
    let initializer;
    const exprInitializer = node.getInitializer();
    if (exprInitializer !== undefined) {
      initializer = () => {
        sb.visit(exprInitializer, sb.noPushValueOptions(options));
      };
    }

    let condition;
    const exprCondition = node.getCondition();
    if (exprCondition !== undefined) {
      condition = () => {
        sb.visit(exprCondition, sb.pushValueOptions(options));
        sb.emitHelper(
          exprCondition,
          sb.pushValueOptions(options),
          sb.helpers.toBoolean({
            type: sb.getType(exprCondition),
          }),
        );
      };
    }

    let incrementor;
    const exprIncrementor = node.getIncrementor();
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
          sb.visit(node.getStatement(), sb.noPushValueOptions(innerOptions));
        },
      }),
    );
  }
}
