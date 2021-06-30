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
  const contract = await compileContractInternal(filePath, name, createCompilerHost(), linked);
  if (contract.diagnostics.some((diagnostic) => diagnostic.category === DiagnosticCategory.Error)) {
    throw new Error('Compilation error.');
  }

  // Change address to be script hash or just script or something like that
  // Here it's only being used as an identifier
  const scriptHash = common.uInt160ToString(crypto.toScriptHash(Buffer.from(contract.contract.script, 'hex')));
  // TODO: this will be wrong now since contract script hash need sender for script completion
  // Used as a unique identifier in compiler file outputs
  // But also used in createSmartContract(), which is important to be correct
  // Change SmartContractNetworksDefinition
  // const contractHash = crypto.getContractHash(signer.account, nefFile.checkSum, contractIn.manifest.name);
  // const contractAddress = scriptHashToAddress(common.uInt160ToString(contractHash));
  const address = scriptHashToAddress(scriptHash);

  const sourceMap = await contract.sourceMap;
  const nextSourceMaps = {
    ...sourceMaps,
    [address]: sourceMap,
  };

  return {
    contract,
    address,
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
