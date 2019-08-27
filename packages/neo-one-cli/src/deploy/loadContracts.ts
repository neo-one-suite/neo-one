import { Configuration } from '@neo-one/cli-common';
import { common, crypto, scriptHashToAddress, SourceMaps } from '@neo-one/client-common';
import { Client } from '@neo-one/client-full-core';
import { compileContract, CompileContractResult, LinkedContracts } from '@neo-one/smart-contract-compiler';
import { createCompilerHost } from '@neo-one/smart-contract-compiler-node';
import { DiagnosticCategory } from 'typescript';
import { findContracts } from '../build';
import { Print } from './types';

const compile = async (filePath: string, name: string, linked: LinkedContracts, sourceMaps: SourceMaps) => {
  const contract = compileContract(filePath, name, createCompilerHost(), linked);
  if (contract.diagnostics.some((diagnostic) => diagnostic.category === DiagnosticCategory.Error)) {
    throw new Error('Compilation error.');
  }

  const address = scriptHashToAddress(
    common.uInt160ToString(crypto.toScriptHash(Buffer.from(contract.contract.script, 'hex'))),
  );
  const sourceMap = await contract.sourceMap;
  const nextSourceMaps = {
    ...sourceMaps,
    [address]: sourceMap,
  };

  return {
    contract,
    sourceMaps: nextSourceMaps,
    linked: {
      ...linked,
      [filePath]: {
        [name]: address,
      },
    },
  };
};

export const loadContracts = async (config: Configuration, client: Client, print: Print) => {
  print('Loading contracts');
  const contracts = await findContracts(config);
  let linked: LinkedContracts = {};
  let sourceMaps: SourceMaps = {};
  let compiledContracts: readonly CompileContractResult[] = [];
  for (const contract of contracts) {
    const result = await compile(contract.filePath, contract.name, linked, sourceMaps);
    ({ linked, sourceMaps } = result);
    compiledContracts = compiledContracts.concat([result.contract]);
  }
  print('Loaded contracts');

  return { contracts: compiledContracts, sourceMaps };
};
