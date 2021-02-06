import { Configuration, deployContract as deployContractBase } from '@neo-one/cli-common';
import { common, crypto, scriptHashToAddress, SourceMaps } from '@neo-one/client-common';
import { NEOONEDataProvider } from '@neo-one/client-core';
import { compileContract, LinkedContracts } from '@neo-one/smart-contract-compiler';
import { createCompilerHost } from '@neo-one/smart-contract-compiler-node';
import { DiagnosticCategory } from 'typescript';
import { getPrimaryKeys } from '../common';

export const deployContract = async (
  config: Configuration,
  filePath: string,
  name: string,
  linked: LinkedContracts,
  sourceMaps: SourceMaps,
) => {
  const contract = await compileContract(filePath, name, createCompilerHost(), linked);
  if (contract.diagnostics.some((diagnostic) => diagnostic.category === DiagnosticCategory.Error)) {
    throw new Error('Compilation error.');
  }

  // TODO: this will be wrong now since contract script hash need sender for script completion
  const address = scriptHashToAddress(
    common.uInt160ToString(crypto.toScriptHash(Buffer.from(contract.contract.script, 'hex'))),
  );
  const sourceMap = await contract.sourceMap;
  const nextSourceMaps = {
    ...sourceMaps,
    [address]: sourceMap,
  };

  const rpcURL = `http://localhost:${config.network.port}/rpc`;
  const provider = new NEOONEDataProvider({ network: 'local', rpcURL });
  await deployContractBase(
    provider,
    contract.contract,
    contract.contract.manifest,
    nextSourceMaps,
    common.privateKeyToString(getPrimaryKeys().privateKey),
  );

  return {
    manifest: contract.contract.manifest,
    address, // TODO: this should be a "pre-address script" or something that will be used with the sender
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
