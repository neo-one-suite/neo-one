import {
  JSONRPCProvider,
  NEOONEDataProvider,
  scriptHashToAddress,
  SmartContractNetworksDefinition,
  SourceMaps,
} from '@neo-one/client';
import { common, crypto } from '@neo-one/client-common';
import { constants, deployContract, setupWallets } from '@neo-one/local';
import { genCommonBrowserFiles, genFiles } from '@neo-one/smart-contract-codegen';
import { Subject } from 'rxjs';
import { DiagnosticCategory } from 'typescript';
import { FileSystem } from '../filesystem';
import { OutputMessage } from '../types';
import { compileContract } from './compileContract';
import { findContracts } from './findContracts';
import { BuildFile, BuildFiles, CommonCodeContract } from './types';

interface SmartContractNetworksDefinitions {
  // tslint:disable-next-line readonly-keyword
  [contractName: string]: SmartContractNetworksDefinition;
}

export interface BuildOptions {
  readonly output$: Subject<OutputMessage>;
  readonly fs: FileSystem;
  readonly provider: JSONRPCProvider;
}

export interface BuildResult {
  readonly files: BuildFiles;
}

export const build = async ({ fs, output$, provider: jsonRPCProvider }: BuildOptions): Promise<BuildResult> => {
  output$.next({ owner: 'neo-one', message: 'Scanning for contracts...' });
  const contractPaths = await findContracts(fs);
  if (contractPaths.length === 0) {
    throw new Error('No contracts found.');
  }

  const mutableSmartContractNetworkDefinitions: SmartContractNetworksDefinitions = {};
  const mutableContracts: CommonCodeContract[] = [];
  const mutableLinked: { [filePath: string]: { [name: string]: string } } = {};
  const mutableSourceMaps: Modifiable<SourceMaps> = {};

  const provider = new NEOONEDataProvider({
    network: constants.LOCAL_NETWORK_NAME,
    rpcURL: jsonRPCProvider,
  });
  output$.next({ owner: 'neo-one', message: 'Setting up wallets' });
  const wallets = await setupWallets(provider, constants.PRIVATE_NET_PRIVATE_KEY);

  // tslint:disable-next-line no-loop-statement
  for (const contractPath of contractPaths) {
    output$.next({ owner: 'neo-one', message: `Compiling contract ${contractPath.name}` });
    const contract = await compileContract(contractPath.filePath, contractPath.name, mutableLinked, fs);

    if (contract.diagnostics.some((diagnostic) => diagnostic.category === DiagnosticCategory.Error)) {
      throw new Error('Compilation error.');
    }

    const address = scriptHashToAddress(
      common.uInt160ToString(crypto.toScriptHash(Buffer.from(contract.contract.script, 'hex'))),
    );
    mutableSourceMaps[address] = contract.sourceMap;
    await deployContract(
      provider,
      contract.contract,
      contract.abi,
      Promise.resolve(mutableSourceMaps),
      constants.PRIVATE_NET_PRIVATE_KEY,
    );

    mutableLinked[contractPath.filePath] = { [contractPath.name]: address };

    mutableContracts.push({
      ...contract,
      addresses: [address],
    });

    mutableSmartContractNetworkDefinitions[contract.name] = {
      [constants.LOCAL_NETWORK_NAME]: { address },
    };
  }

  const generated = 'one/generated';
  const sourceMapsPath = `${generated}/sourceMaps.ts`;
  const testPath = `${generated}/test.ts`;
  const commonTypesPath = `${generated}/types.ts`;
  const reactPath = `${generated}/react.jts`;
  const clientPath = `${generated}/client.ts`;
  const generatedPath = `${generated}/index.ts`;

  const getContractPaths = (name: string) => {
    const base = `${generated}/${name}`;
    const typesPath = `${base}/types.ts`;
    const abiPath = `${base}/abi.ts`;
    const createContractPath = `${base}/contract.ts`;

    return { typesPath, abiPath, createContractPath };
  };

  const mutableFiles: BuildFile[] = [];

  output$.next({ owner: 'neo-one', message: 'Generating code...' });
  mutableContracts.forEach((contractResult) => {
    const { typesPath, abiPath, createContractPath } = getContractPaths(contractResult.name);

    const { abi: abiContents, contract: contractContents, types: typesContents } = genFiles({
      name: contractResult.name,
      networksDefinition: mutableSmartContractNetworkDefinitions[contractResult.name],
      contractPath: contractResult.filePath,
      typesPath,
      abiPath,
      createContractPath,
      abi: contractResult.abi,
      sourceMapsPath,
    });

    mutableFiles.push({ path: typesPath, content: typesContents.ts });
    mutableFiles.push({ path: abiPath, content: abiContents.ts });
    mutableFiles.push({ path: createContractPath, content: contractContents.ts });
  });

  const contractsPaths = mutableContracts.map(({ name, filePath, sourceMap, addresses }) => ({
    ...getContractPaths(name),
    sourceMap,
    name,
    addresses,
    contractPath: filePath,
  }));

  const {
    sourceMaps: sourceMapsContents,
    test: testContents,
    commonTypes: commonTypesContents,
    react: reactContents,
    client: clientContents,
    generated: generatedContents,
  } = genCommonBrowserFiles({
    contractsPaths,
    testPath,
    commonTypesPath,
    reactPath,
    clientPath,
    generatedPath,
    localDevNetworkName: constants.LOCAL_NETWORK_NAME,
    wallets: [
      {
        name: 'master',
        privateKey: constants.PRIVATE_NET_PUBLIC_KEY,
      },
    ].concat(wallets),
    networks: [],
    sourceMaps: mutableSourceMaps,
  });

  mutableFiles.push({ path: sourceMapsPath, content: sourceMapsContents.ts });
  mutableFiles.push({ path: testPath, content: testContents.ts });
  mutableFiles.push({ path: commonTypesPath, content: commonTypesContents.ts });
  mutableFiles.push({ path: reactPath, content: reactContents.ts });
  mutableFiles.push({ path: clientPath, content: clientContents.ts });
  mutableFiles.push({ path: generatedPath, content: generatedContents.ts });

  return { files: mutableFiles };
};
