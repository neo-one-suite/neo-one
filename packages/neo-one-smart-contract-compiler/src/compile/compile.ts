import { RawSourceMap } from 'source-map';
import ts from 'typescript';
import { Context } from '../Context';
import { createBuiltIns } from './builtins';
import { createHelpers } from './helper';
import { EmittingScriptBuilder, HelperCapturingScriptBuilder, ScopeCapturingScriptBuilder } from './sb';
import { CompileResult } from './types';

export interface CompileOptions {
  readonly sourceFile: ts.SourceFile;
  readonly context: Context;
  readonly sourceMaps?: { readonly [filePath: string]: RawSourceMap };
}

export const compile = async ({ context, sourceFile, sourceMaps = {} }: CompileOptions): Promise<CompileResult> => {
  const builtIns = createBuiltIns(context.program, context.typeChecker);
  const helpers = createHelpers();

  const helperScriptBuilder = new HelperCapturingScriptBuilder(context, helpers, builtIns, sourceFile);
  helperScriptBuilder.process();

  const scopeScriptBuilder = new ScopeCapturingScriptBuilder(
    context,
    helpers,
    builtIns,
    sourceFile,
    helperScriptBuilder.getHelpers(),
  );
  scopeScriptBuilder.process();

  const emittingScriptBuilder = new EmittingScriptBuilder({
    context,
    scopes: scopeScriptBuilder.getScopes(),
    sourceFile,
    helpers,
    builtIns,
    allHelpers: helperScriptBuilder.getHelpers(),
  });
  emittingScriptBuilder.process();

  const finalResult = await emittingScriptBuilder.getFinalResult(sourceMaps);

  return {
    ...finalResult,
    context,
  };
};
