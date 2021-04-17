import { ContractMethodDescriptorClient } from '@neo-one/client-common';
import { tsUtils } from '@neo-one/ts-utils';
import { RawSourceMap } from 'source-map';
import ts from 'typescript';
import { Context } from '../Context';
import { processMethods } from '../utils';
import { getSmartContractInfo } from './getSmartContractInfo';
import { createHelpers } from './helper';
import {
  DiagnosticScriptBuilder,
  EmittingScriptBuilder,
  HelperCapturingScriptBuilder,
  ScopeCapturingScriptBuilder,
} from './sb';
import { CompileResult, LinkedContracts } from './types';

const DUMMY_METHOD: ContractMethodDescriptorClient = {
  name: 'dummy',
  parameters: [],
  returnType: { type: 'Void' },
  offset: 0,
  safe: true,
};

export interface BaseCompileOptions {
  readonly sourceFile: ts.SourceFile;
  readonly context: Context;
  readonly addDummyMethod?: boolean;
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

export const compile = async ({
  context,
  sourceFile,
  linked = {},
  sourceMaps = {},
  addDummyMethod = false,
}: CompileOptions): Promise<CompileResult> => {
  const helpers = createHelpers();
  const { name, contractInfo, manifest, debugInfo } = getSmartContractInfo(context, sourceFile);

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
  const script = finalResult.code.toString('hex');

  const methods = (
    await processMethods({
      context,
      manifest,
      debugInfo,
      finalResult,
      filePath: tsUtils.file.getFilePath(sourceFile),
    })
  ).concat(addDummyMethod ? [DUMMY_METHOD] : []);

  const compiler = 'neo-one 3.0.0-rc1';

  return {
    contract: {
      nefFile: {
        compiler,
        script,
        tokens: [], // TODO: need to implement this
      },
      script,
      manifest: {
        name,
        ...manifest,
        abi: {
          ...manifest.abi,
          methods,
        },
      },
      compiler,
    },
    context,
    debugInfo,
    sourceMap: finalResult.sourceMap,
  };
};
