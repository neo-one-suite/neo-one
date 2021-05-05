import { setupWallets } from '@neo-one/cli-common';
import {
  assertCallFlags,
  common,
  crypto,
  MethodTokenModel,
  NefFileModel,
  scriptHashToAddress,
  SignerModel,
  SourceMaps,
  TransactionResult,
  UserAccountID,
  WitnessScopeModel,
} from '@neo-one/client-common';
import { DeveloperClient, LocalKeyStore, NEOONEDataProvider, NEOONEProvider } from '@neo-one/client-core';
import { Client, LocalUserAccountProvider, PublishReceipt } from '@neo-one/client-full-core';
import { setGlobalLogLevel } from '@neo-one/logger';
import { compileContract, CompilerHost } from '@neo-one/smart-contract-compiler';
import { camel, Modifiable } from '@neo-one/utils';
import BigNumber from 'bignumber.js';

export interface Contract {
  readonly filePath: string;
  readonly name: string;
}
export interface WithContractsOptions {
  /**
   * Ignore compiler warnings. Useful during smart contract development.
   *
   * Defaults to `false`.
   */
  readonly ignoreWarnings?: boolean;
  /**
   * Automatically deploy smart contracts using the defaults specified in the constructor arguments.
   *
   * Defaults to `true`.
   */
  readonly deploy?: boolean;
  /**
   * Automatically run consensus whenever a transaction is relayed.
   *
   * Defaults to `true`.
   */
  readonly autoConsensus?: boolean;
  /**
   * Automatically provide the necessary system fee for every transaction to execute.
   *
   * Defaults to `true`.
   */
  readonly autoSystemFee?: boolean;
  /**
   * Enable logs from various systems during testing.
   *
   * Defaults to `false`.
   */
  readonly logging?: boolean;
}

/**
 * `TestOptions` holds all of the properties that are pre-configured and available for use in tests.
 *
 * In addition to the properties listed below, the object will contain a smart contract API object property for each smart contract in your project.
 */
export interface TestOptions {
  /**
   * The local network name that the smart contracts have been deployed to and the `client` has been configured with.
   */
  readonly networkName: string;
  /**
   * `Client` that has been pre-configured with the master account for the local network as well as each of the accounts in `accountIDs`.
   *
   * This user account is also the currently selected user account in the `Client` and the one that deployed the contracts.
   */
  readonly client: Client<{
    readonly memory: LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>;
  }>;
  /**
   * `DeveloperClient` that's been configured to point at the local testing network.
   */
  readonly developerClient: DeveloperClient;
  /**
   * `UserAccountID` of the "master" account - the account that contains ~100 million NEO and ~58 million GAS.
   *
   * This user account is also the currently selected user account in the `Client`.
   */
  readonly masterAccountID: UserAccountID;
  /**
   * Private key for the `masterAccountID`.
   */
  readonly masterPrivateKey: string;
  /**
   * 10 additional user accounts that have been configured in the client with varying amounts of NEO and GAS:
   *
   * At index:
   *  0. 0 NEO and GAS
   *  1. 1 NEO and GAS
   *  2. 10 NEO and GAS
   *  3. 100 NEO and GAS
   *  4. 1000 NEO and GAS
   *  5. 10000 NEO and GAS
   *  6. 100000 NEO and GAS
   *  7. 1000000 NEO and GAS
   *  8. 5 NEO and GAS
   *  9. 20 NEO and GAS
   */
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
  {
    ignoreWarnings = false,
    deploy = true,
    autoConsensus = true,
    autoSystemFee = true,
    logging = false,
  }: WithContractsOptions = {},
): Promise<void> => {
  setGlobalLogLevel(logging ? 'info' : 'silent');
  const { dataProvider, cleanup, privateKey } = await getDataProvider();
  const { client, developerClient, masterWallet, accountIDs } = await setupWallets(dataProvider, privateKey);
  const networkName = dataProvider.network;
  try {
    if (autoSystemFee) {
      client.hooks.beforeRelay.tapPromise('AutoSystemFee', async (options) => {
        // tslint:disable-next-line no-object-mutation
        options.maxSystemFee = new BigNumber(-1);
        // tslint:disable-next-line no-object-mutation
        options.maxNetworkFee = new BigNumber(-1);
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
      const { contract, sourceMap } = await compileContract(
        filePath,
        name,
        createCompilerHost(),
        mutableLinked,
        ignoreWarnings,
      );

      const signerAddress = masterWallet.userAccount.id.address;
      const signer = new SignerModel({
        account: crypto.addressToScriptHash({
          address: signerAddress,
          addressVersion: common.NEO_ADDRESS_VERSION,
        }),
        scopes: WitnessScopeModel.Global,
      });

      const nefFile = new NefFileModel({
        compiler: contract.nefFile.compiler,
        script: Buffer.from(contract.nefFile.script, 'hex'),
        tokens: contract.nefFile.tokens.map(
          (token) =>
            new MethodTokenModel({
              hash: common.stringToUInt160(token.hash),
              method: token.method,
              paramCount: token.paramCount,
              hasReturnValue: token.hasReturnValue,
              callFlags: assertCallFlags(token.callFlags),
            }),
        ),
      });

      // TODO: create function for getting contract address from register/signer?
      const contractHash = crypto.getContractHash(signer.account, nefFile.checkSum, contract.manifest.name);
      const address = scriptHashToAddress(common.uInt160ToString(contractHash));

      mutableSourceMaps[address] = await sourceMap;
      let result: TransactionResult<PublishReceipt>;
      // tslint:disable-next-line prefer-conditional-expression
      if (deploy) {
        result = await client.publishAndDeploy(
          contract,
          contract.manifest,
          [signerAddress], // TODO: fix contract calling here if necessary. Probably just stays empty array here
          { maxSystemFee: new BigNumber(-1), maxNetworkFee: new BigNumber(-1) },
          mutableSourceMaps,
        );
      } else {
        result = await client.publish(contract, { maxSystemFee: new BigNumber(-1), maxNetworkFee: new BigNumber(-1) });
      }

      const [receipt] = await Promise.all([result.confirmed({ timeoutMS: 2500 }), developerClient.runConsensusNow()]);
      if (receipt.result.state === 'FAULT') {
        throw new Error(receipt.result.message);
      }

      const smartContract = client.smartContract({
        networks: { [networkName]: { address } },
        manifest: contract.manifest,
        sourceMaps: mutableSourceMaps,
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
      masterAccountID: masterWallet.userAccount.id,
      masterPrivateKey: privateKey,
      networkName,
      accountIDs,
    });

    await test(contractOptions);
  } finally {
    await cleanup();
  }
};
