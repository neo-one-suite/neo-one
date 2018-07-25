import ts from 'typescript';
import { Context } from '../Context';
import { createHelpers } from './helper';
import { EmittingScriptBuilder, HelperCapturingScriptBuilder, ScopeCapturingScriptBuilder } from './sb';
import { CompileResult } from './types';

export interface CompileOptions {
  readonly sourceFile: ts.SourceFile;
  readonly context: Context;
}

export const compile = ({ context, sourceFile }: CompileOptions): CompileResult => {
  const helpers = createHelpers();

  const helperScriptBuilder = new HelperCapturingScriptBuilder(context, helpers, sourceFile);
  helperScriptBuilder.process();

  const scopeScriptBuilder = new ScopeCapturingScriptBuilder(
    context,
    helpers,
    sourceFile,
    helperScriptBuilder.getHelpers(),
  );
  scopeScriptBuilder.process();

  const emittingScriptBuilder = new EmittingScriptBuilder({
    context,
    scopes: scopeScriptBuilder.getScopes(),
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
