import {
  common,
  crypto,
  scriptHashToAddress,
  SourceMaps,
  TransactionResult,
  UserAccountID,
} from '@neo-one/client-common';
import { DeveloperClient, LocalKeyStore, NEOONEDataProvider, NEOONEProvider } from '@neo-one/client-core';
import { Client, LocalUserAccountProvider, PublishReceipt } from '@neo-one/client-full-core';
import { setupWallets } from '@neo-one/local';
import { compileContract, CompilerHost } from '@neo-one/smart-contract-compiler';
import BigNumber from 'bignumber.js';
import { camel } from 'change-case';

export interface Contract {
  readonly filePath: string;
  readonly name: string;
}
export interface WithContractsOptions {
  readonly ignoreWarnings?: boolean;
  readonly deploy?: boolean;
  readonly autoConsensus?: boolean;
  readonly autoSystemFee?: boolean;
}

export interface TestOptions {
  readonly networkName: string;
  readonly client: Client<{
    readonly memory: LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>;
  }>;
  readonly developerClient: DeveloperClient;
  readonly masterAccountID: UserAccountID;
  readonly masterPrivateKey: string;
  readonly accountIDs: ReadonlyArray<UserAccountID>;
}

export interface DataProviderOptions {
  readonly dataProvider: NEOONEDataProvider;
  readonly cleanup: () => Promise<void>;
  readonly privateKey: string;
}

export const withContracts = async <T>(
  contracts: ReadonlyArray<Contract>,
  test: (contracts: T & TestOptions) => Promise<void>,
  createCompilerHost: () => CompilerHost,
  getDataProvider: () => Promise<DataProviderOptions>,
  { ignoreWarnings = false, deploy = true, autoConsensus = true, autoSystemFee = true }: WithContractsOptions = {},
): Promise<void> => {
  const { dataProvider, cleanup, privateKey } = await getDataProvider();
  const { client, developerClient, masterWallet, accountIDs } = await setupWallets(dataProvider, privateKey);
  const networkName = dataProvider.network;
  try {
    if (autoSystemFee) {
      client.hooks.beforeRelay.tapPromise('AutoSystemFee', async (options) => {
        // tslint:disable-next-line no-object-mutation
        options.systemFee = new BigNumber(-1);
      });
    }
    if (autoConsensus) {
      client.hooks.beforeConfirmed.tapPromise('DeveloperClient', async () => {
        await developerClient.runConsensusNow();
      });
    }
    const mutableLinked: { [filePath: string]: { [contractName: string]: string } } = {};
    const mutableSourceMaps: Modifiable<SourceMaps> = {};

    const deployedContracts = await contracts.reduce<Promise<T>>(async (accIn, { filePath, name }) => {
      const acc = await accIn;
      const { contract, sourceMap, abi } = compileContract(
        filePath,
        name,
        createCompilerHost(),
        mutableLinked,
        ignoreWarnings,
      );
      const address = scriptHashToAddress(
        common.uInt160ToString(crypto.toScriptHash(Buffer.from(contract.script, 'hex'))),
      );
      mutableSourceMaps[address] = await sourceMap;
      let result: TransactionResult<PublishReceipt>;
      // tslint:disable-next-line prefer-conditional-expression
      if (deploy) {
        result = await client.publishAndDeploy(
          contract,
          abi,
          [],
          { systemFee: new BigNumber(-1) },
          Promise.resolve(mutableSourceMaps),
        );
      } else {
        result = await client.publish(contract, { systemFee: new BigNumber(-1) });
      }

      const [receipt] = await Promise.all([result.confirmed({ timeoutMS: 2500 }), developerClient.runConsensusNow()]);
      if (receipt.result.state === 'FAULT') {
        throw new Error(receipt.result.message);
      }

      const smartContract = client.smartContract({
        networks: { [networkName]: { address } },
        abi,
        sourceMaps: Promise.resolve(mutableSourceMaps),
      });
      mutableLinked[filePath] = { [name]: address };

      // tslint:disable-next-line prefer-object-spread
      return Object.assign({}, acc, { [camel(name)]: smartContract }) as T;
      // tslint:disable-next-line no-any
    }, Promise.resolve({} as any));

    // tslint:disable-next-line:prefer-object-spread
    const contractOptions = Object.assign({}, deployedContracts, {
      client,
      developerClient,
      masterAccountID: masterWallet.account.id,
      masterPrivateKey: privateKey,
      networkName,
      accountIDs,
    });

    await test(contractOptions);
  } finally {
    await cleanup();
  }
};
