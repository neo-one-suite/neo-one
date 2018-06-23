import Project, { SourceFile } from 'ts-simple-ast';

import { Context } from '../Context';
import { getGlobals, getLibAliases, getLibs } from '../symbols';
import { createHelpers } from './helper';
import { EmittingScriptBuilder, HelperCapturingScriptBuilder, ScopeCapturingScriptBuilder } from './sb';
import { CompileResult } from './types';

export interface CompileOptions {
  readonly ast: Project;
  readonly sourceFile: SourceFile;
  readonly context?: Context;
}

export const compile = ({
  ast,
  sourceFile,
  context = new Context(getGlobals(ast), getLibs(ast), getLibAliases(ast)),
}: CompileOptions): CompileResult => {
  const helpers = createHelpers();

  const helperScriptBuilder = new HelperCapturingScriptBuilder(context, helpers, ast, sourceFile);
  helperScriptBuilder.process();

  const scopeScriptBuilder = new ScopeCapturingScriptBuilder(
    context,
    helpers,
    ast,
    sourceFile,
    helperScriptBuilder.getHelpers(),
  );
  scopeScriptBuilder.process();

  const emittingScriptBuilder = new EmittingScriptBuilder({
    context,
    scopes: scopeScriptBuilder.getScopes(),
    ast,
    sourceFile,
    helpers,
    allHelpers: helperScriptBuilder.getHelpers(),
  });
  emittingScriptBuilder.process();

  return {
    ...emittingScriptBuilder.getFinalResult(),
    context,
  };
};
