import { ContractManifestClient } from '@neo-one/client-common';
import { ContractRegister } from '@neo-one/client-full-core';
import { tsUtils } from '@neo-one/ts-utils';
import { normalizePath } from '@neo-one/utils';
import _ from 'lodash';
import { RawSourceMap } from 'source-map';
import ts from 'typescript';
import { compile, WithLinked } from './compile';
import { DebugInfo } from './contract';
import { createContextForPath, updateContext } from './createContext';
import { transpile } from './transpile';
import { CompilerHost } from './types';

export interface CompileContractOptions extends WithLinked {
  readonly host: CompilerHost;
  readonly filePath: string;
}

export interface CompileContractResult {
  readonly manifest: ContractManifestClient;
  readonly diagnostics: ReadonlyArray<ts.Diagnostic>;
  readonly contract: ContractRegister;
  readonly sourceMap: Promise<RawSourceMap>;
  readonly debugInfo: DebugInfo;
}

export const compileContract = ({
  filePath: filePathIn,
  host,
  linked: linkedIn = {},
}: CompileContractOptions): CompileContractResult => {
  const filePath = normalizePath(filePathIn);
  const linked = _.fromPairs(Object.entries(linkedIn).map(([key, value]) => [normalizePath(key), value]));
  const transpileContext = createContextForPath(filePath, host);
  const transpileResult = transpile({
    sourceFile: tsUtils.file.getSourceFileOrThrow(transpileContext.program, filePath),
    context: transpileContext,
  });
  const context =
    transpileResult === undefined
      ? transpileContext
      : updateContext(transpileContext, { [filePath]: transpileResult.text });

  const { manifest, sourceMap: finalSourceMap, contract, debugInfo } = compile({
    sourceFile: tsUtils.file.getSourceFileOrThrow(context.program, filePath),
    context,
    linked,
    sourceMaps: transpileResult === undefined ? {} : { [filePath]: transpileResult.sourceMap },
  });

  return {
    diagnostics: context.diagnostics,
    sourceMap: finalSourceMap,
    manifest,
    contract,
    debugInfo,
  };
};
