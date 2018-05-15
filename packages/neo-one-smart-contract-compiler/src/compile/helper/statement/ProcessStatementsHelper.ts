import { Node, StatementedNode } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

export interface ProcessStatementsHelperOptions {
  createScope: boolean;
}

export class ProcessStatementsHelper extends Helper<Node & StatementedNode> {
  private readonly createScope: boolean;
  constructor({ createScope }: ProcessStatementsHelperOptions) {
    super();
    this.createScope = createScope;
  }
  public emit(
    sb: ScriptBuilder,
    node: Node & StatementedNode,
    options: VisitOptions,
  ): void {
    if (this.createScope) {
      sb.withScope(node, options, (innerOptions) => {
        this.emitStatements(sb, node, innerOptions);
      });
    } else {
      this.emitStatements(sb, node, options);
    }
  }

  private emitStatements(
    sb: ScriptBuilder,
    node: Node & StatementedNode,
    options: VisitOptions,
  ): void {
    node.getFunctions().forEach((func) => {
      sb.scope.add(func.getName());
    });
    node.getVariableDeclarations().forEach((decl) => {
      sb.scope.add(decl.getName());
    });

    const compilerStatements = (node.compilerNode as any).statements;
    let statements;
    if (compilerStatements == null) {
      statements = node.getStatements();
    } else {
      statements = compilerStatements.map((statement: any) =>
        (node as any).getNodeFromCompilerNode(statement),
      );
    }
    statements.forEach((statement: any) => {
      // TODO: Should functions be hoisted?
      sb.visit(statement, sb.noValueOptions(options));
    });
  }
}
