import { ABI, ContractRegister } from '@neo-one/client';
import { RawSourceMap } from 'source-map';
import { ts } from 'ts-simple-ast';
import { compile } from './compile';
import { Context } from './Context';
import { getGlobals, getLibAliases, getLibs } from './symbols';
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
  readonly sourceMap: RawSourceMap;
}

export const compileContract = async ({ filePath, name }: CompileContractOptions): Promise<CompileContractResult> => {
  const ast = await utils.getAstForPath(filePath);
  const initialContext = new Context(getGlobals(ast), getLibs(ast), getLibAliases(ast));
  const diagnostics = ast.getPreEmitDiagnostics();
  const smartContract = ast.getSourceFileOrThrow(filePath).getClassOrThrow(name);
  const { ast: transpiledAst, sourceFile, abi, context, contract } = transpile({
    ast,
    smartContract,
    context: initialContext,
  });
  const { code, context: finalContext, sourceMap } = compile({
    ast: transpiledAst,
    sourceFile,
    context,
  });

  return {
    diagnostics: diagnostics.map((diagnostic) => diagnostic.compilerObject).concat(finalContext.diagnostics),
    sourceMap,
    abi,
    contract: {
      ...contract,
      script: code.toString('hex'),
    },
  };
};
