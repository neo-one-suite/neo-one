import { deployContract, setupWallets } from '@neo-one/cli-common';
import {
  common,
  crypto,
  scriptHashToAddress,
  SmartContractNetworksDefinition,
  SourceMaps,
} from '@neo-one/client-common';
import { NEOONEDataProvider } from '@neo-one/client-core';
import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { genCommonBrowserFiles, genFiles } from '@neo-one/smart-contract-codegen';
import { constants, Modifiable } from '@neo-one/utils';
import { WorkerManager } from '@neo-one/worker';
import { Subject } from 'rxjs';
import { FileSystem } from '../filesystem';
import { OutputMessage } from '../types';
import { compileContract } from './compileContract';
import { findContracts } from './findContracts';
import { BuildFile, BuildFiles, CommonCodeContract, ContractResult } from './types';

interface SmartContractNetworksDefinitions {
  // tslint:disable-next-line readonly-keyword
  [contractName: string]: SmartContractNetworksDefinition;
}

export interface BuildOptions {
  readonly output$: Subject<OutputMessage>;
  readonly fs: FileSystem;
  readonly providerManager: WorkerManager<typeof JSONRPCLocalProvider>;
}

export interface BuildResult {
  readonly files: BuildFiles;
}

export const build = async ({ fs, output$, providerManager }: BuildOptions): Promise<BuildResult> => {
  output$.next({ owner: 'neo-one', message: 'Scanning for contracts...' });
  const contractPaths = await findContracts(fs);
  if (contractPaths.length === 0) {
    output$.next({ owner: 'neo-one', message: 'No contracts found.' });

    return { files: [] };
  }

  const mutableSmartContractNetworkDefinitions: SmartContractNetworksDefinitions = {};
  const mutableContracts: CommonCodeContract[] = [];
  const mutableLinked: { [filePath: string]: { [name: string]: string } } = {};
  const mutableSourceMaps: Modifiable<SourceMaps> = {};

  const provider = new NEOONEDataProvider({
    network: constants.LOCAL_NETWORK_NAME,
    rpcURL: providerManager,
  });
  output$.next({ owner: 'neo-one', message: 'Setting up wallets...' });
  const { wallets } = await setupWallets(provider, constants.PRIVATE_NET_PRIVATE_KEY);

  // tslint:disable-next-line no-loop-statement
  for (const contractPath of contractPaths) {
    output$.next({ owner: 'neo-one', message: `Compiling contract ${contractPath.name}...` });
    let contract: ContractResult;
    try {
      contract = await compileContract(contractPath.filePath, contractPath.name, mutableLinked, fs);
    } catch (error) {
      output$.next({
        owner: 'neo-one',
        message: `Compilation failed:\n ${error.stack === undefined ? error.message : error.stack}`,
      });
      throw error;
    }

    const address = scriptHashToAddress(
      common.uInt160ToString(crypto.toScriptHash(Buffer.from(contract.contract.script, 'hex'))),
    );
    mutableSourceMaps[address] = contract.sourceMap;
    await deployContract(
      provider,
      contract.contract,
      contract.abi,
      mutableSourceMaps,
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
  const sourceMapsPath = `${generated}/sourceMaps.d.ts`;
  const sourceMapsPathJS = `${generated}/sourceMaps.js`;
  const testPath = `${generated}/test.d.ts`;
  const testPathJS = `${generated}/test.js`;
  const contractsPath = `${generated}/contracts.d.ts`;
  const contractsPathJS = `${generated}/contracts.js`;
  const reactPath = `${generated}/react.td.sx`;
  const reactPathJS = `${generated}/react.js`;
  const angularPath = `${generated}/angular.service.d.ts`;
  const vuePath = `${generated}/vue.d.js`;
  const clientPath = `${generated}/client.d.ts`;
  const clientPathJS = `${generated}/client.js`;
  const generatedPath = `${generated}/index.d.ts`;
  const generatedPathJS = `${generated}/index.js`;

  const getContractPaths = (name: string) => {
    const base = `${generated}/${name}`;
    const typesPath = `${base}/types.d.ts`;
    const typesPathJS = `${base}/types.js`;
    const abiPath = `${base}/abi.d.ts`;
    const abiPathJS = `${base}/abi.js`;
    const createContractPath = `${base}/contract.d.ts`;
    const createContractPathJS = `${base}/contract.js`;

    return { typesPath, abiPath, createContractPath, typesPathJS, abiPathJS, createContractPathJS };
  };

  const mutableFiles: BuildFile[] = [];

  const pushFile = (path: string, content?: string) => {
    if (content !== undefined) {
      mutableFiles.push({ path, content });
    }
  };

  output$.next({ owner: 'neo-one', message: 'Generating code...' });
  mutableContracts.forEach((contractResult) => {
    const { typesPath, abiPath, createContractPath, typesPathJS, abiPathJS, createContractPathJS } = getContractPaths(
      contractResult.name,
    );

    const { abi: abiContents, contract: contractContents, types: typesContents } = genFiles({
      name: contractResult.name,
      networksDefinition: mutableSmartContractNetworkDefinitions[contractResult.name],
      contractPath: contractResult.filePath,
      typesPath,
      abiPath,
      createContractPath,
      abi: contractResult.abi,
      sourceMapsPath,
      browserify: false,
    });

    mutableFiles.push({ path: typesPath, content: typesContents.ts });
    pushFile(typesPathJS, typesContents.js);
    mutableFiles.push({ path: abiPath, content: abiContents.ts });
    pushFile(abiPathJS, abiContents.js);
    mutableFiles.push({ path: createContractPath, content: contractContents.ts });
    pushFile(createContractPathJS, contractContents.js);
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
    contracts: contractsContents,
    react: reactContents,
    client: clientContents,
    generated: generatedContents,
  } = genCommonBrowserFiles({
    contractsPaths,
    testPath,
    contractsPath,
    reactPath,
    angularPath,
    sourceMapsPath,
    vuePath,
    clientPath,
    generatedPath,
    localDevNetworkName: constants.LOCAL_NETWORK_NAME,
    wallets: [
      {
        name: 'master',
        wif: constants.PRIVATE_NET_WIF,
      },
    ].concat(wallets),
    networks: [],
    sourceMaps: mutableSourceMaps,
    framework: 'react',
  });

  mutableFiles.push({ path: sourceMapsPath, content: sourceMapsContents.ts });
  pushFile(sourceMapsPathJS, sourceMapsContents.js);
  mutableFiles.push({ path: testPath, content: testContents.ts });
  pushFile(testPathJS, testContents.js);
  mutableFiles.push({ path: contractsPath, content: contractsContents.ts });
  pushFile(contractsPathJS, contractsContents.js);
  mutableFiles.push({ path: reactPath, content: reactContents.ts });
  pushFile(reactPathJS, reactContents.js);
  mutableFiles.push({ path: clientPath, content: clientContents.ts });
  pushFile(clientPathJS, clientContents.js);
  mutableFiles.push({ path: generatedPath, content: generatedContents.ts });
  pushFile(generatedPathJS, generatedContents.js);

  output$.next({ owner: 'neo-one', message: 'Done' });

  return { files: mutableFiles };
};
