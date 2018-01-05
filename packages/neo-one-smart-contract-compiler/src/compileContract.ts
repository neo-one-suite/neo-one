import * as utils from './utils';
import { transpile } from './transpile';
import { compile } from './compile';
import { ts } from 'ts-simple-ast';
import { ABI } from '@neo-one/client/src';

export interface CompileContractOptions {
  readonly dir: string;
  readonly filePath: string;
  readonly name: string;
}

export interface CompileContractResult {
  code: Buffer;
  diagnostics: ts.Diagnostic[];
  abi: ABI;
}

export const compileContract = async ({
  dir,
  filePath,
  name,
}: CompileContractOptions): Promise<CompileContractResult> => {
  const ast = await utils.getAst(dir);
  const smartContract = ast
    .getSourceFileOrThrow(filePath)
    .getClassOrThrow(name);
  const { ast: transpiledAst, sourceFile, abi, context } = transpile({
    ast,
    smartContract,
  });
  const { code, context: finalContext } = compile({
    ast: transpiledAst,
    sourceFile,
    context,
  });

  return {
    code,
    diagnostics: finalContext.diagnostics,
    abi,
  };
};
