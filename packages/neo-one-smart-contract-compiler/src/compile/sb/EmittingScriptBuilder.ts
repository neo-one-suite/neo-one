import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { Context } from '../../Context';
import { Builtins } from '../builtins';
import { Helper, Helpers } from '../helper';
import { ResolvedScope } from '../scope';
import { BaseScriptBuilder } from './BaseScriptBuilder';
import { ScriptBuilder } from './ScriptBuilder';

export interface EmittingScriptBuilderOptions {
  readonly context: Context;
  readonly sourceFile: ts.SourceFile;
  readonly scopes: Map<ts.Node, Map<number, ResolvedScope>>;
  readonly helpers: Helpers;
  readonly builtins: Builtins;
  readonly allHelpers: ReadonlyArray<Helper>;
}

export class EmittingScriptBuilder extends BaseScriptBuilder<ResolvedScope> implements ScriptBuilder {
  private readonly scopes: Map<ts.Node, Map<number, ResolvedScope>>;

  public constructor({ context, scopes, helpers, builtins, sourceFile, allHelpers }: EmittingScriptBuilderOptions) {
    super(context, helpers, builtins, sourceFile, allHelpers);
    this.scopes = scopes;
  }

  protected createScope(node: ts.Node, index: number): ResolvedScope {
    return utils.nullthrows(utils.nullthrows(this.scopes.get(node)).get(index));
  }
}
