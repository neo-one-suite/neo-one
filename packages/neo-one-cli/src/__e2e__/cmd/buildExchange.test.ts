// tslint:disable no-any
import { AddressString, Contract, privateKeyToAddress, UserAccountID } from '@neo-one/client-common';
import { DeveloperClient, Hash256 } from '@neo-one/client-core';
import { constants } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import * as nodePath from 'path';
import { getClients, getContracts } from '../../__data__';

jest.setTimeout(300 * 1000);

interface ExpectedBalances {
  readonly tokenBalance: string;
  readonly exchangeTokenBalance: string;
  readonly tokensOnExchange: string;
}

const TO_PRIVATE_KEY = '7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344';

const verifyExchangeContract = (contract?: Contract): void => {
  expect(contract).toBeDefined();
  if (contract === undefined) {
    throw new Error('For TS');
  }
  expect(contract.parameters).toEqual(['String', 'Array']);
  expect(contract.returnType).toEqual('Buffer');
  expect(contract.payable).toBeFalsy();
  expect(contract.storage).toBeTruthy();
  expect(contract.dynamicInvoke).toBeTruthy();
};

const mintTokens = async (ico: any, developerClient: DeveloperClient): Promise<void> => {
  const mintResult = await ico.mintTokens({
    sendTo: [
      {
        amount: new BigNumber(10),
        asset: Hash256.NEO,
      },
    ],
  });

  const [mintReceipt] = await Promise.all([mintResult.confirmed(), developerClient.runConsensusNow()]);
  if (mintReceipt.result.state === 'FAULT') {
    throw new Error(mintReceipt.result.message);
  }
};

const checkBalances = async ({
  token,
  tokenAssetID,
  from,
  exchange,
  exchangeAddress,
  expected,
}: {
  readonly token: any;
  readonly tokenAssetID: AddressString;
  readonly from: UserAccountID;
  readonly exchange: any;
  readonly exchangeAddress: AddressString;
  readonly expected: ExpectedBalances;
}) => {
  const [balanceAfterDeposit, exchangeBalanceAfterDeposit, tokensDeposited] = await Promise.all([
    token.balanceOf(from.address),
    token.balanceOf(exchangeAddress),
    exchange.balanceOf(from.address, tokenAssetID),
  ]);
  expect(balanceAfterDeposit.toString()).toEqual(expected.tokenBalance);
  expect(exchangeBalanceAfterDeposit.toString()).toEqual(expected.exchangeTokenBalance);
  expect(tokensDeposited.toString()).toEqual(expected.tokensOnExchange);
};

const depositNEP5 = async ({
  token,
  tokenAssetID,
  exchange,
  from,
  exchangeAddress,
  amount,
  expected,
  developerClient,
}: {
  readonly token: any;
  readonly tokenAssetID: AddressString;
  readonly exchange: any;
  readonly from: UserAccountID;
  readonly exchangeAddress: AddressString;
  readonly amount: BigNumber;
  readonly expected: ExpectedBalances;
  readonly developerClient: DeveloperClient;
}) => {
  const [approveDepositReceipt] = await Promise.all([
    token.approveSendTransfer.confirmed(from.address, exchangeAddress, new BigNumber(100000000).times(amount), {
      from,
    }),
    developerClient.runConsensusNow(),
  ]);
  expect(approveDepositReceipt.result.value).toEqual(true);

  const [exchangeDepositReceipt] = await Promise.all([
    exchange.depositNEP5.confirmed(from.address, tokenAssetID, amount, { from }),
    developerClient.runConsensusNow(),
  ]);
  expect(exchangeDepositReceipt.result.state).toEqual('HALT');
  expect(exchangeDepositReceipt.result.value).toEqual(undefined);
  expect(exchangeDepositReceipt.events).toHaveLength(1);

  await checkBalances({ token, tokenAssetID, from, exchange, exchangeAddress, expected });
};

const withdrawNEP5 = async ({
  token,
  tokenAssetID,
  exchange,
  from,
  exchangeAddress,
  amount,
  expected,
  developerClient,
}: {
  readonly token: any;
  readonly tokenAssetID: AddressString;
  readonly exchange: any;
  readonly from: UserAccountID;
  readonly exchangeAddress: AddressString;
  readonly amount: BigNumber;
  readonly expected: ExpectedBalances;
  readonly developerClient: DeveloperClient;
}) => {
  const [exchangeWithdrawalReceipt] = await Promise.all([
    exchange.withdrawNEP5.confirmed(from.address, tokenAssetID, amount, { from }),
    developerClient.runConsensusNow(),
  ]);
  expect(exchangeWithdrawalReceipt.result.state).toEqual('HALT');
  expect(exchangeWithdrawalReceipt.result.value).toEqual(undefined);
  expect(exchangeWithdrawalReceipt.events).toHaveLength(1);

  await checkBalances({ token, tokenAssetID, from, exchange, exchangeAddress, expected });
};

const verifyNEP5NEP5Exchange = async ({
  token,
  tokenAssetID,
  coin,
  coinAssetID,
  exchange,
  exchangeAddress,
  masterAccountID,
  toAccountID,
  developerClient,
}: {
  readonly token: any;
  readonly tokenAssetID: AddressString;
  readonly coin: any;
  readonly coinAssetID: AddressString;
  readonly exchange: any;
  readonly exchangeAddress: AddressString;
  readonly masterAccountID: UserAccountID;
  readonly toAccountID: UserAccountID;
  readonly developerClient: DeveloperClient;
}) => {
  await depositNEP5({
    token,
    tokenAssetID,
    exchange,
    from: masterAccountID,
    exchangeAddress,
    amount: new BigNumber(10),
    expected: { tokenBalance: '90', exchangeTokenBalance: '10', tokensOnExchange: '10' },
    developerClient,
  });

  await withdrawNEP5({
    token,
    tokenAssetID,
    exchange,
    from: masterAccountID,
    exchangeAddress,
    amount: new BigNumber(4),
    expected: { tokenBalance: '94', exchangeTokenBalance: '6', tokensOnExchange: '6' },
    developerClient,
  });

  const coinTransferReceipt = await coin.transfer.confirmed(
    masterAccountID.address,
    toAccountID.address,
    new BigNumber(100),
  );
  expect(coinTransferReceipt.result.value).toEqual(true);

  await depositNEP5({
    token: coin,
    tokenAssetID: coinAssetID,
    exchange,
    from: toAccountID,
    exchangeAddress,
    amount: new BigNumber(70),
    expected: { tokenBalance: '30', exchangeTokenBalance: '70', tokensOnExchange: '70' },
    developerClient,
  });

  const [makeOfferReceipt] = await Promise.all([
    exchange.makeOffer.confirmed(
      masterAccountID.address,
      tokenAssetID,
      new BigNumber(5),
      coinAssetID,
      new BigNumber(50),
      tokenAssetID,
      new BigNumber(1),
      'nonce1',
    ),
    developerClient.runConsensusNow(),
  ]);
  expect(makeOfferReceipt.result.state).toEqual('HALT');
  expect(makeOfferReceipt.result.value).toEqual(undefined);
  const offerHash = makeOfferReceipt.events[0].parameters.offerHash;
  expect(offerHash).toBeDefined();

  const offer = await exchange.getOffer(offerHash);
  expect(offer.maker).toEqual(masterAccountID.address);
  expect(offer.offerAssetID).toEqual(tokenAssetID);
  expect(offer.offerAmount.toString()).toEqual('5');
  expect(offer.wantAssetID).toEqual(coinAssetID);
  expect(offer.wantAmount.toString()).toEqual('50');
  expect(offer.makerFeeAssetID).toEqual(tokenAssetID);
  expect(offer.makerFeeAvailableAmount.toString()).toEqual('1');
  expect(offer.nonce).toEqual('nonce1');

  const [fillOfferReceipt] = await Promise.all([
    exchange.fillOffer.confirmed(
      toAccountID.address,
      offerHash,
      new BigNumber(3),
      coinAssetID,
      new BigNumber(1),
      true,
      new BigNumber(1),
      false,
      { from: toAccountID, systemFee: new BigNumber(2) },
    ),
    developerClient.runConsensusNow(),
  ]);
  expect(fillOfferReceipt.result.state).toEqual('HALT');
  expect(fillOfferReceipt.result.value).toEqual(undefined);

  const [
    exchangeMakerTokenBalanceAfterFill,
    exchangeTakerTokenBalanceAfterFill,
    exchangeMakerCoinBalanceAfterFill,
    exchangeTakerCoinBalanceAfterFill,
    offerAfterFill,
  ] = await Promise.all([
    exchange.balanceOf(masterAccountID.address, tokenAssetID),
    exchange.balanceOf(toAccountID.address, tokenAssetID),
    exchange.balanceOf(masterAccountID.address, coinAssetID),
    exchange.balanceOf(toAccountID.address, coinAssetID),
    exchange.getOffer(offerHash),
  ]);
  expect(exchangeMakerTokenBalanceAfterFill.toString()).toEqual('0');
  expect(exchangeTakerTokenBalanceAfterFill.toString()).toEqual('3');
  expect(exchangeMakerCoinBalanceAfterFill.toString()).toEqual('30');
  expect(exchangeTakerCoinBalanceAfterFill.toString()).toEqual('39');
  expect(offerAfterFill.maker).toEqual(masterAccountID.address);
  expect(offerAfterFill.offerAssetID).toEqual(tokenAssetID);
  expect(offerAfterFill.offerAmount.toString()).toEqual('2');
  expect(offerAfterFill.wantAssetID).toEqual(coinAssetID);
  expect(offerAfterFill.wantAmount.toString()).toEqual('20');
  expect(offerAfterFill.makerFeeAssetID).toEqual(tokenAssetID);
  expect(offerAfterFill.makerFeeAvailableAmount.toString()).toEqual('0');
  expect(offerAfterFill.nonce).toEqual('nonce1');

  const cancelOfferReceipt = await exchange.cancelOffer.confirmed(masterAccountID.address, offerHash);
  expect(cancelOfferReceipt.result.value).toEqual(undefined);
  const [exchangeMakerTokenBalanceAfterCancel, offerAfterCancel] = await Promise.all([
    exchange.balanceOf(masterAccountID.address, tokenAssetID),
    exchange.getOffer(offerHash),
  ]);
  expect(exchangeMakerTokenBalanceAfterCancel.toString()).toEqual('2');
  expect(offerAfterCancel).toEqual(undefined);
};

const verifyExchangeContractTesting = async (codegenPath: string) => {
  // tslint:disable-next-line no-require-imports
  const test = require(nodePath.resolve(codegenPath, 'test'));
  await test.withContracts(
    async ({ ico, token, coin, coinIco, exchange, masterAccountID, networkName, client, developerClient }: any) => {
      await client.providers.memory.keystore.addUserAccount({
        network: networkName,
        privateKey: TO_PRIVATE_KEY,
      });
      const toAccountID = { network: networkName, address: privateKeyToAddress(TO_PRIVATE_KEY) };
      await mintTokens(ico, developerClient);
      await mintTokens(coinIco, developerClient);
      await Promise.all([
        client.transfer(new BigNumber(100), Hash256.GAS, toAccountID.address),
        developerClient.runConsensusNow(),
      ]);

      const tokenAssetID = token.definition.networks[masterAccountID.network].address;
      const coinAssetID = coin.definition.networks[masterAccountID.network].address;
      const exchangeAddress = exchange.definition.networks[masterAccountID.network].address;

      await verifyNEP5NEP5Exchange({
        token,
        tokenAssetID,
        coin,
        coinAssetID,
        exchange,
        exchangeAddress,
        masterAccountID,
        toAccountID,
        developerClient,
      });
    },
  );
};

describe('build exchange (ts, react)', () => {
  it('- builds the exchange project using typescript and the react framework.', async () => {
    const project = 'exchange';
    const exec = one.createExec(project);
    one.addCleanup(async () => {
      await exec('stop network');
    });
    await exec('build');

    const [{ client: outerClient }, config] = await Promise.all([getClients(project), one.getProjectConfig(project)]);
    const contracts = await getContracts(outerClient, constants.LOCAL_NETWORK_NAME);

    verifyExchangeContract(contracts.find((contract) => contract.name === 'Exchange'));
    await verifyExchangeContractTesting(config.codegen.path);
  });
});
