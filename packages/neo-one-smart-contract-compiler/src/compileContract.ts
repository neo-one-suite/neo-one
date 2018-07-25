import { ABI, ContractRegister } from '@neo-one/client';
import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import { RawSourceMap } from 'source-map';
import ts from 'typescript';
import { compile } from './compile';
import { createContextForPath, updateContext } from './createContext';
import { transpile } from './transpile';

export interface CompileContractOptions {
  readonly filePath: string;
  readonly name: string;
}

export interface CompileContractResult {
  readonly abi: ABI;
  readonly diagnostics: ReadonlyArray<ts.Diagnostic>;
  readonly contract: ContractRegister;
  readonly sourceMap: RawSourceMap;
}

export const compileContract = async ({ filePath, name }: CompileContractOptions): Promise<CompileContractResult> => {
  const transpileContext = await createContextForPath(filePath);
  const smartContract = tsUtils.statement.getClassOrThrow(
    tsUtils.file.getSourceFileOrThrow(transpileContext.program, filePath),
    name,
  );
  const { sourceFiles, abi, contract } = transpile({ smartContract, context: transpileContext });
  const context = updateContext(transpileContext, _.mapValues(sourceFiles, ({ text }) => text));

  const { code, sourceMap } = compile({
    sourceFile: tsUtils.file.getSourceFileOrThrow(context.program, filePath),
    context,
  });

  return {
    diagnostics: context.diagnostics,
    sourceMap,
    abi,
    contract: {
      ...contract,
      script: code.toString('hex'),
    },
  };
};
