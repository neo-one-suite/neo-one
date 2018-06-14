// tslint:disable no-any
import { Node, StatementedNode } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ProcessStatementsHelperOptions {
  readonly createScope: boolean;
}

export class ProcessStatementsHelper extends Helper<Node & StatementedNode> {
  private readonly createScope: boolean;
  public constructor({ createScope }: ProcessStatementsHelperOptions) {
    super();
    this.createScope = createScope;
  }
  public emit(sb: ScriptBuilder, node: Node & StatementedNode, options: VisitOptions): void {
    if (this.createScope) {
      sb.withScope(node, options, (innerOptions) => {
        this.emitStatements(sb, node, innerOptions);
      });
    } else {
      this.emitStatements(sb, node, options);
    }
  }

  private emitStatements(sb: ScriptBuilder, node: Node & StatementedNode, options: VisitOptions): void {
    node.getFunctions().forEach((func) => {
      sb.scope.add(func.getName());
    });
    node.getVariableDeclarations().forEach((decl) => {
      sb.scope.add(decl.getName());
    });

    const compilerStatements = (node.compilerNode as any).statements;
    const statements =
      compilerStatements === undefined
        ? node.getStatements()
        : compilerStatements.map((statement: any) => (node as any).getNodeFromCompilerNode(statement));
    statements.forEach((statement: any) => {
      sb.visit(statement, sb.noValueOptions(options));
    });
  }
}
