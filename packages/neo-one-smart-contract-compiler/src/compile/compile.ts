import { RawSourceMap } from 'source-map';
import ts from 'typescript';
import { Context } from '../Context';
import { getSmartContractInfo } from './getSmartContractInfo';
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
  const { contractInfo } = getSmartContractInfo(context, sourceFile);

  const scriptBuilder = new DiagnosticScriptBuilder(context, helpers, sourceFile, contractInfo);
  scriptBuilder.process();
};

export const compile = ({ context, sourceFile, linked = {}, sourceMaps = {} }: CompileOptions): CompileResult => {
  const helpers = createHelpers();
  const { contractInfo, abi, contract, debugInfo } = getSmartContractInfo(context, sourceFile);

  const helperScriptBuilder = new HelperCapturingScriptBuilder(
    context,
    createHelpers(helpers),
    sourceFile,
    contractInfo,
    linked,
  );
  helperScriptBuilder.process();

  const scopeScriptBuilder = new ScopeCapturingScriptBuilder(
    context,
    createHelpers(helpers),
    sourceFile,
    contractInfo,
    linked,
    helperScriptBuilder.getHelpers(),
  );
  scopeScriptBuilder.process();

  const emittingScriptBuilder = new EmittingScriptBuilder({
    context,
    scopes: scopeScriptBuilder.getScopes(),
    sourceFile,
    helpers: createHelpers(helpers),
    linked,
    allHelpers: helperScriptBuilder.getHelpers(),
    contractInfo,
  });
  emittingScriptBuilder.process();

  const finalResult = emittingScriptBuilder.getFinalResult(sourceMaps);

  return {
    contract: {
      script: finalResult.code.toString('hex'),
      ...contract,
      ...finalResult.features,
    },
    abi,
    context,
    debugInfo,
    sourceMap: finalResult.sourceMap,
  };
};
