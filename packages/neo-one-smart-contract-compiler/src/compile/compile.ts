import { RawSourceMap } from 'source-map';
import ts from 'typescript';
import { Context } from '../Context';
import { createHelpers } from './helper';
import { EmittingScriptBuilder, HelperCapturingScriptBuilder, ScopeCapturingScriptBuilder } from './sb';
import { CompileResult } from './types';

export interface BaseCompileOptions {
  readonly sourceFile: ts.SourceFile;
  readonly context: Context;
}
export interface CompileOptions extends BaseCompileOptions {
  readonly sourceMaps?: { readonly [filePath: string]: RawSourceMap };
}

export const compileForDiagnostics = ({ context, sourceFile }: CompileOptions): EmittingScriptBuilder => {
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

  return emittingScriptBuilder;
};

export const compile = ({ context, sourceFile, sourceMaps = {} }: CompileOptions): CompileResult => {
  const emittingScriptBuilder = compileForDiagnostics({ context, sourceFile });

  const finalResult = emittingScriptBuilder.getFinalResult(sourceMaps);

  return {
    ...finalResult,
    context,
  };
};
