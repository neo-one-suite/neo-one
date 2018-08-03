import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

interface DefaultAccum {
  readonly found: boolean;
  readonly statements: ReadonlyArray<ts.Statement>;
}

export class SwitchStatementCompiler extends NodeCompiler<ts.SwitchStatement> {
  public readonly kind = ts.SyntaxKind.SwitchStatement;

  public visitNode(sb: ScriptBuilder, node: ts.SwitchStatement, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    sb.withProgramCounter((pc) => {
      const switchExpr = tsUtils.expression.getExpression(node);
      const switchExprType = sb.getType(switchExpr);

      const breakOptions = sb.breakPCOptions(sb.noPushValueOptions(options), pc.getLast());

      const caseBlock = tsUtils.statement.getCaseBlock(node);
      const clauses = tsUtils.statement.getClauses(caseBlock);
      const { found: defaultFound, statements: defaultClauseStatements } = clauses.reduce<DefaultAccum>(
        (acc, clause) => {
          const { found, statements } = acc;
          if (found) {
            return {
              found,
              statements: statements.concat(tsUtils.statement.getStatements(clause)),
            };
          }

          if (ts.isDefaultClause(clause)) {
            return { found: true, statements: tsUtils.statement.getStatements(clause) };
          }

          return { found: false, statements };
        },
        { found: false, statements: [] },
      );

      const matched = sb.scope.addUnique();
      const val = sb.scope.addUnique();

      // [val]
      sb.visit(switchExpr, options);
      // []
      sb.scope.set(sb, node, options, val);
      // [matched]
      sb.emitPushBoolean(switchExpr, false);
      // []
      sb.scope.set(sb, node, options, matched);
      // []
      clauses.forEach((clause) => {
        if (ts.isDefaultClause(clause)) {
          return;
        }

        sb.emitHelper(
          clause,
          options,
          sb.helpers.if({
            condition: () => {
              const expr = tsUtils.expression.getExpression(clause);
              // [val]
              sb.scope.get(sb, node, options, val);
              // [clauseVal, val]
              sb.visit(expr, options);
              // [boolean]
              sb.emitHelper(
                expr,
                options,
                sb.helpers.equalsEqualsEquals({ leftType: switchExprType, rightType: sb.getType(expr) }),
              );
              // [boolean, boolean]
              sb.scope.get(sb, node, options, matched);
              // [boolean]
              sb.emitOp(node, 'BOOLOR');
            },
            whenTrue: () => {
              // [true]
              sb.emitPushBoolean(node, true);
              // []
              sb.scope.set(sb, node, options, matched);
              // []
              tsUtils.statement.getStatements(clause).forEach((statement) => {
                sb.visit(statement, breakOptions);
              });
            },
          }),
        );
      });

      if (defaultFound) {
        defaultClauseStatements.forEach((statement) => {
          sb.visit(statement, breakOptions);
        });
      }
    });
  }
}
