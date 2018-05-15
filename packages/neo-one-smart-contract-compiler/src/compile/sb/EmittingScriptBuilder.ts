import Ast, { Node, SourceFile } from 'ts-simple-ast';

import { BaseScriptBuilder } from './BaseScriptBuilder';
import { Context } from '../../Context';
import { ResolvedScope } from '../scope';
import { ScriptBuilder } from './ScriptBuilder';
import { Helper, Helpers } from '../helper';

export interface EmittingScriptBuilderOptions {
  context: Context;
  ast: Ast;
  sourceFile: SourceFile;
  scopes: Map<Node, Map<number, ResolvedScope>>;
  helpers: Helpers;
  allHelpers: Helper[];
}

export class EmittingScriptBuilder extends BaseScriptBuilder<ResolvedScope>
  implements ScriptBuilder {
  private readonly scopes: Map<Node, Map<number, ResolvedScope>>;

  constructor({
    context,
    scopes,
    helpers,
    ast,
    sourceFile,
    allHelpers,
  }: EmittingScriptBuilderOptions) {
    super(context, helpers, ast, sourceFile, allHelpers);
    this.scopes = scopes;
  }

  protected createScope(node: Node, index: number): ResolvedScope {
    return this.assertNotNull(
      this.assertNotNull(this.scopes.get(node)).get(index),
    );
  }
}
