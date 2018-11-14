import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { Context } from '../../Context';
import { ContractInfo } from '../../contract';
import { Helper, Helpers } from '../helper';
import { ResolvedScope } from '../scope';
import { LinkedContracts } from '../types';
import { BaseScriptBuilder } from './BaseScriptBuilder';
import { ScriptBuilder } from './ScriptBuilder';

export interface EmittingScriptBuilderOptions {
  readonly context: Context;
  readonly sourceFile: ts.SourceFile;
  readonly scopes: Map<ts.Node, Map<number, ResolvedScope>>;
  readonly helpers: Helpers;
  readonly linked: LinkedContracts;
  readonly allHelpers: ReadonlyArray<Helper>;
  readonly contractInfo?: ContractInfo;
}

export class EmittingScriptBuilder extends BaseScriptBuilder<ResolvedScope> implements ScriptBuilder {
  private readonly scopes: Map<ts.Node, Map<number, ResolvedScope>>;

  public constructor({
    context,
    scopes,
    helpers,
    sourceFile,
    linked,
    contractInfo,
    allHelpers,
  }: EmittingScriptBuilderOptions) {
    super(context, helpers, sourceFile, contractInfo, linked, allHelpers);
    this.scopes = scopes;
  }

  protected createScope(node: ts.Node, index: number): ResolvedScope {
    return utils.nullthrows(utils.nullthrows(this.scopes.get(node)).get(index));
  }
}
