import {
  ABI,
  Client,
  Contract,
  DeveloperClient,
  Hash256,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  ReadClient,
  UserAccountID,
  wifToPrivateKey,
} from '@neo-one/client';
import { Network } from '@neo-one/server-plugin-network';
import { Wallet } from '@neo-one/server-plugin-wallet';
import { SetupTestResult } from '@neo-one/smart-contract-test';
import BigNumber from 'bignumber.js';
import * as path from 'path';
import { ICOReadSmartContract, ICOSmartContract } from '../__data__/ico/one/generated/ICO/types';

const getNetworks = async (): Promise<ReadonlyArray<Network>> => {
  const networksString = await one.execute('get network --json');

  return JSON.parse(networksString);
};

const getWallets = async (networkName: string): Promise<ReadonlyArray<Wallet>> => {
  const walletsString = await one.execute(`get wallet --json --network ${networkName}`);

  return JSON.parse(walletsString);
};

const LOCAL = 'local';

const getClients = async (
  network: Network,
  wallet: Wallet,
): Promise<{ readonly client: Client; readonly developerClient: DeveloperClient }> => {
  const keystore = new LocalKeyStore({ store: new LocalMemoryStore() });

  if (wallet.wif === undefined) {
    throw new Error(`Something went wrong, wif is null for ${wallet.name}`);
  }
  await keystore.addAccount({
    network: LOCAL,
    name: wallet.name,
    privateKey: wifToPrivateKey(wallet.wif),
  });

  const provider = new NEOONEProvider([{ network: LOCAL, rpcURL: network.nodes[0].rpcAddress }]);
  const localUserAccountProvider = new LocalUserAccountProvider({ keystore, provider });
  const client = new Client({ memory: localUserAccountProvider });

  const developerClient = new DeveloperClient(provider.read(LOCAL));

  return { client, developerClient };
};

const getContract = async (client: Client): Promise<Contract> => {
  const readClient = client.read(LOCAL);
  const blockHeight = await readClient.getBlockCount();

  // tslint:disable-next-line no-loop-statement
  for await (const block of readClient.iterBlocks({ indexStop: blockHeight })) {
    // tslint:disable-next-line no-loop-statement
    for (const transaction of block.transactions) {
      if (transaction.type === 'InvocationTransaction' && transaction.invocationData.contracts.length > 0) {
        return transaction.invocationData.contracts[0];
      }
    }
  }

  throw new Error('Could not find deployed contract');
};

const getGeneratedCode = (): {
  readonly abi: ABI;
  readonly contract: {
    readonly createSmartContract: (client: Client) => ICOSmartContract;
    readonly createReadSmartContract: (readClient: ReadClient) => ICOReadSmartContract;
  };
  readonly test: {
    readonly setupTest: () => Promise<SetupTestResult<ICOSmartContract>>;
  };
} => {
  // tslint:disable-next-line no-require-imports
  const abi = require('../__data__/ico/one/generated/ICO/abi').icoABI;
  // tslint:disable-next-line no-require-imports
  const contract = require('../__data__/ico/one/generated/ICO/contract');
  const createSmartContract = contract.createICOSmartContract;
  const createReadSmartContract = contract.createICOReadSmartContract;
  // tslint:disable-next-line no-require-imports
  const setupTest = require('../__data__/ico/one/generated/ICO/test').setupICOTest;

  return { abi, contract: { createSmartContract, createReadSmartContract }, test: { setupTest } };
};

const verifySmartContractAfterMint = async (
  smartContract: ICOSmartContract,
  accountID: UserAccountID,
): Promise<void> => {
  const [totalSupply, remaining, balance] = await Promise.all([
    smartContract.totalSupply(),
    smartContract.remaining(),
    smartContract.balanceOf(accountID.address),
  ]);
  expect(totalSupply.toString()).toEqual('100');
  expect(remaining.toString()).toEqual(new BigNumber(9_999_999_900).toString());
  expect(balance.toString()).toEqual('100');
};

const verifySmartContract = async (
  smartContract: ICOSmartContract,
  readSmartContract: ICOReadSmartContract,
  developerClient: DeveloperClient,
  accountID: UserAccountID,
): Promise<void> => {
  const [
    name,
    symbol,
    decimals,
    amountPerNEO,
    owner,
    startTimeSeconds,
    icoDurationSeconds,
    initialTotalSupply,
    initialRemaining,
    initialBalance,
  ] = await Promise.all([
    readSmartContract.name(),
    readSmartContract.symbol(),
    readSmartContract.decimals(),
    readSmartContract.amountPerNEO(),
    readSmartContract.owner(),
    readSmartContract.startTimeSeconds(),
    readSmartContract.icoDurationSeconds(),
    readSmartContract.totalSupply(),
    readSmartContract.remaining(),
    readSmartContract.balanceOf(accountID.address),
  ]);
  expect(name).toEqual('One');
  expect(symbol).toEqual('ONE');
  expect(decimals.toString()).toEqual('8');
  expect(amountPerNEO.toString()).toEqual('10');
  expect(owner).toEqual(accountID.address);
  expect(startTimeSeconds.toString()).toEqual('1534108415');
  expect(icoDurationSeconds.toString()).toEqual('157700000');
  expect(initialTotalSupply.toString()).toEqual('0');
  expect(initialRemaining.toString()).toEqual(new BigNumber(10_000_000_000).toString());
  expect(initialBalance.toString()).toEqual('0');

  const mintResult = await smartContract.mintTokens({
    transfers: [
      {
        to: smartContract.definition.networks[accountID.network].address,
        amount: new BigNumber(10),
        asset: Hash256.NEO,
      },
    ],
  });

  const [mintReceipt] = await Promise.all([mintResult.confirmed(), developerClient.runConsensusNow()]);
  if (mintReceipt.result.state === 'FAULT') {
    throw new Error(mintReceipt.result.message);
  }

  expect(mintReceipt.result.state).toEqual('HALT');
  expect(mintReceipt.result.value).toEqual(true);
  expect(mintReceipt.result.gasCost).toMatchSnapshot('mint cost');
  expect(mintReceipt.result.gasConsumed).toMatchSnapshot('mint consumed');
  expect(mintReceipt.events).toHaveLength(1);
  const event = mintReceipt.events[0];
  expect(event.name).toEqual('transfer');
  if (event.name !== 'transfer') {
    throw new Error('For TS');
  }
  expect(event.parameters.from).toBeUndefined();
  expect(event.parameters.to).toEqual(accountID.address);
  expect(event.parameters.amount.toString()).toEqual('100');

  await verifySmartContractAfterMint(smartContract, accountID);
};

describe('buildCommand', () => {
  test('build', async () => {
    await one.execute('build', { cwd: path.resolve(__dirname, '..', '__data__', 'ico') });

    const networks = await getNetworks();
    expect(networks.length).toEqual(1);

    const network = networks[0];
    expect(network.name).toEqual('ico-local');
    expect(network.type).toEqual('private');
    expect(network.nodes.length).toEqual(1);
    expect(network.nodes[0].live).toBeTruthy();
    expect(network.nodes[0].ready).toBeTruthy();

    const wallets = await getWallets(LOCAL);
    expect(wallets.length).toEqual(1);

    const wallet = wallets[0];
    const { client, developerClient } = await getClients(network, wallet);

    const contract = await getContract(client);
    expect(contract.codeVersion).toEqual('1.0');
    expect(contract.author).toEqual('dicarlo2');
    expect(contract.email).toEqual('alex.dicarlo@neotracker.io');
    expect(contract.description).toEqual('NEO•ONE ICO');
    expect(contract.parameters).toEqual(['String', 'Array']);
    expect(contract.returnType).toEqual('Buffer');
    expect(contract.payable).toBeTruthy();
    expect(contract.storage).toBeTruthy();
    expect(contract.dynamicInvoke).toBeFalsy();

    const {
      abi,
      contract: { createSmartContract, createReadSmartContract },
      test: { setupTest },
    } = getGeneratedCode();
    expect(abi).toBeDefined();

    const smartContract = createSmartContract(client);
    const readSmartContract = createReadSmartContract(client.read(LOCAL));
    const accountID = { ...wallet.accountID, network: LOCAL };
    const {
      developerClient: testDeveloperClient,
      smartContract: testSmartContract,
      masterAccountID,
      networkName,
      cleanup,
    } = await setupTest();
    const [deployResult] = await Promise.all([
      testSmartContract.deploy(masterAccountID.address, new BigNumber(1534108415), new BigNumber(157700000)),
      verifySmartContract(smartContract, readSmartContract, developerClient, accountID),
    ]);

    const [deployReceipt] = await Promise.all([deployResult.confirmed(), testDeveloperClient.runConsensusNow()]);
    if (deployReceipt.result.state === 'FAULT') {
      throw new Error(deployReceipt.result.message);
    }

    await verifySmartContract(
      testSmartContract,
      testSmartContract.read(networkName),
      testDeveloperClient,
      masterAccountID,
    );

    await one.execute('build', { cwd: path.resolve(__dirname, '..', '__data__', 'ico') });

    await verifySmartContractAfterMint(smartContract, accountID);

    await cleanup();
  });
});
