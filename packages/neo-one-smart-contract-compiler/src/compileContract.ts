import { ABI, ContractRegister } from '@neo-one/client';
import { ts } from 'ts-simple-ast';
import { compile } from './compile';
import { transpile } from './transpile';
import * as utils from './utils';

export interface CompileContractOptions {
  readonly filePath: string;
  readonly name: string;
}

export interface CompileContractResult {
  readonly abi: ABI;
  readonly diagnostics: ReadonlyArray<ts.Diagnostic>;
  readonly contract: ContractRegister;
}

export const compileContract = async ({ filePath, name }: CompileContractOptions): Promise<CompileContractResult> => {
  const ast = await utils.getAstForPath(filePath);
  const smartContract = ast.getSourceFileOrThrow(filePath).getClassOrThrow(name);
  const { ast: transpiledAst, sourceFile, abi, context, contract } = transpile({
    ast,
    smartContract,
  });
  const { code, context: finalContext } = compile({
    ast: transpiledAst,
    sourceFile,
    context,
  });

  return {
    diagnostics: finalContext.diagnostics,
    abi,
    contract: {
      ...contract,
      script: code.toString('hex'),
    },
  };
};
