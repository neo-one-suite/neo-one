import { utils } from '@neo-one/utils';
import Project, { Node, SourceFile } from 'ts-simple-ast';
import { Context } from '../../Context';
import { Helper, Helpers } from '../helper';
import { ResolvedScope } from '../scope';
import { BaseScriptBuilder } from './BaseScriptBuilder';
import { ScriptBuilder } from './ScriptBuilder';

export interface EmittingScriptBuilderOptions {
  readonly context: Context;
  readonly ast: Project;
  readonly sourceFile: SourceFile;
  readonly scopes: Map<Node, Map<number, ResolvedScope>>;
  readonly helpers: Helpers;
  readonly allHelpers: ReadonlyArray<Helper>;
}

export class EmittingScriptBuilder extends BaseScriptBuilder<ResolvedScope> implements ScriptBuilder {
  private readonly scopes: Map<Node, Map<number, ResolvedScope>>;

  public constructor({ context, scopes, helpers, ast, sourceFile, allHelpers }: EmittingScriptBuilderOptions) {
    super(context, helpers, ast, sourceFile, allHelpers);
    this.scopes = scopes;
  }

  protected createScope(node: Node, index: number): ResolvedScope {
    return utils.nullthrows(utils.nullthrows(this.scopes.get(node)).get(index));
  }
}
