import { RawSourceMap } from 'source-map';
import ts from 'typescript';
import { Context } from '../Context';
import { createHelpers } from './helper';
import {
  DiagnosticScriptBuilder,
  EmittingScriptBuilder,
  HelperCapturingScriptBuilder,
  ScopeCapturingScriptBuilder,
} from './sb';
import { CompileResult, LinkedContracts } from './types';

export interface BaseCompileOptions {
  readonly sourceFile: ts.SourceFile;
  readonly context: Context;
}
export interface WithLinked {
  readonly linked?: LinkedContracts;
}
export interface DiagnosticCompileOptions extends BaseCompileOptions {
  readonly sourceMaps?: { readonly [filePath: string]: RawSourceMap };
}
export interface CompileOptions extends DiagnosticCompileOptions, WithLinked {}

export const compileForDiagnostics = ({ context, sourceFile }: DiagnosticCompileOptions): void => {
  const helpers = createHelpers();
  const scriptBuilder = new DiagnosticScriptBuilder(context, helpers, sourceFile);
  scriptBuilder.process();
};

export const compile = ({ context, sourceFile, linked = {}, sourceMaps = {} }: CompileOptions): CompileResult => {
  const helpers = createHelpers();

  const helperScriptBuilder = new HelperCapturingScriptBuilder(context, helpers, sourceFile, linked);
  helperScriptBuilder.process();

  const scopeScriptBuilder = new ScopeCapturingScriptBuilder(
    context,
    helpers,
    sourceFile,
    linked,
    helperScriptBuilder.getHelpers(),
  );
  scopeScriptBuilder.process();

  const emittingScriptBuilder = new EmittingScriptBuilder({
    context,
    scopes: scopeScriptBuilder.getScopes(),
    sourceFile,
    helpers,
    linked,
    allHelpers: helperScriptBuilder.getHelpers(),
  });
  emittingScriptBuilder.process();

  const finalResult = emittingScriptBuilder.getFinalResult(sourceMaps);

  return {
    ...finalResult,
    context,
  };
};
