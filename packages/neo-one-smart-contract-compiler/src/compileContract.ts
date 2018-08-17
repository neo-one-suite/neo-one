import { ABI, ContractRegister } from '@neo-one/client';
import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import { RawSourceMap } from 'source-map';
import ts from 'typescript';
import { compile } from './compile';
import { createContextForPath, updateContext } from './createContext';
import { transpile } from './transpile';
import { normalizePath } from './utils';

export interface CompileContractOptions {
  readonly filePath: string;
  readonly name: string;
}

export interface CompileContractResult {
  readonly abi: ABI;
  readonly diagnostics: ReadonlyArray<ts.Diagnostic>;
  readonly contract: ContractRegister;
  readonly sourceMap: Promise<RawSourceMap>;
}

export const compileContract = ({ filePath: filePathIn, name }: CompileContractOptions): CompileContractResult => {
  const filePath = normalizePath(filePathIn);
  const transpileContext = createContextForPath(filePath);
  const smartContract = tsUtils.statement.getClassOrThrow(
    tsUtils.file.getSourceFileOrThrow(transpileContext.program, filePath),
    name,
  );
  const { sourceFiles, abi, contract } = transpile({ smartContract, context: transpileContext });
  const context = updateContext(transpileContext, _.mapValues(sourceFiles, ({ text }) => text));

  const { code, sourceMap: finalSourceMap, features } = compile({
    sourceFile: tsUtils.file.getSourceFileOrThrow(context.program, filePath),
    context,
    sourceMaps: _.mapValues(sourceFiles, ({ sourceMap }) => sourceMap),
  });

  return {
    diagnostics: context.diagnostics,
    sourceMap: finalSourceMap,
    abi,
    contract: {
      ...contract,
      script: code.toString('hex'),
      storage: features.storage,
      dynamicInvoke: features.dynamicInvoke,
      payable: contract.payable,
    },
  };
};
