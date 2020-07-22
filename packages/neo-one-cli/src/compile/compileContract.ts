import { common, crypto, scriptHashToAddress, SourceMaps } from '@neo-one/client-common';
import { compileContract as compileContractInternal, LinkedContracts } from '@neo-one/smart-contract-compiler';
import { createCompilerHost } from '@neo-one/smart-contract-compiler-node';
import { DiagnosticCategory } from 'typescript';

export const compileContract = async (
  filePath: string,
  name: string,
  linked: LinkedContracts,
  sourceMaps: SourceMaps,
) => {
  const contract = compileContractInternal(filePath, name, createCompilerHost(), linked);
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
    sourceMap,
    sourceMaps: nextSourceMaps,
    linked: {
      ...linked,
      [filePath]: {
        [name]: address,
      },
    },
  };
};
