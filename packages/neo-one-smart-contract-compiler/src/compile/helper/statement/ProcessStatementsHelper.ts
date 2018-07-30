// tslint:disable no-any
import { StatementedNode, tsUtils } from '@neo-one/ts-utils';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ProcessStatementsHelperOptions {
  readonly createScope: boolean;
}

export class ProcessStatementsHelper extends Helper<StatementedNode> {
  private readonly createScope: boolean;
  public constructor({ createScope }: ProcessStatementsHelperOptions) {
    super();
    this.createScope = createScope;
  }
  public emit(sb: ScriptBuilder, node: StatementedNode, options: VisitOptions): void {
    if (this.createScope) {
      sb.withScope(node, options, (innerOptions) => {
        this.emitStatements(sb, node, innerOptions);
      });
    } else {
      this.emitStatements(sb, node, options);
    }
  }

  private emitStatements(sb: ScriptBuilder, node: StatementedNode, options: VisitOptions): void {
    tsUtils.statement.getFunctions(node).forEach((func) => {
      const name = tsUtils.node.getName(func);
      if (name !== undefined) {
        sb.scope.add(name);
      }
    });
    tsUtils.statement.getVariableDeclarations(node).forEach((decl) => {
      const name = tsUtils.node.getName(decl);
      if (name !== undefined) {
        sb.scope.add(name);
      }
    });
    tsUtils.statement.getStatements(node).forEach((statement) => {
      sb.visit(statement, sb.noValueOptions(options));
    });
  }
}
