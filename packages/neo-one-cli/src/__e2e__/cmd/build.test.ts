// tslint:disable no-any
import { ABI, common, Contract, crypto, privateKeyToAddress, UserAccountID } from '@neo-one/client-common';
import { Client, DeveloperClient, Hash256 } from '@neo-one/client-core';
import { constants } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import * as nodePath from 'path';
import { getClients, getContracts } from '../../__data__';

jest.setTimeout(300 * 1000);

describe('build', () => {
  it('is a one stop command for local development of the ico project', async () => {
    const TO_PRIVATE_KEY = '7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344';
    const TO_PUBLIC_KEY = '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef';
    crypto.addPublicKey(common.stringToPrivateKey(TO_PRIVATE_KEY), common.stringToECPoint(TO_PUBLIC_KEY));

    const verifyICOContract = (contract?: Contract): void => {
      expect(contract).toBeDefined();
      if (contract === undefined) {
        throw new Error('For TS');
      }
      expect(contract.codeVersion).toEqual('1.0');
      expect(contract.author).toEqual('dicarlo2');
      expect(contract.email).toEqual('alex.dicarlo@neotracker.io');
      expect(contract.description).toEqual('NEO•ONE ICO');
      expect(contract.parameters).toEqual(['String', 'Array']);
      expect(contract.returnType).toEqual('Buffer');
      expect(contract.payable).toBeTruthy();
      expect(contract.storage).toBeTruthy();
      expect(contract.dynamicInvoke).toBeFalsy();
    };

    const verifyCoinICOContract = (contract?: Contract): void => {
      expect(contract).toBeDefined();
      if (contract === undefined) {
        throw new Error('For TS');
      }
      expect(contract.codeVersion).toEqual('1.0');
      expect(contract.author).toEqual('dicarlo2');
      expect(contract.email).toEqual('alex.dicarlo@neotracker.io');
      expect(contract.description).toEqual('NEO•ONE Coin ICO');
      expect(contract.parameters).toEqual(['String', 'Array']);
      expect(contract.returnType).toEqual('Buffer');
      expect(contract.payable).toBeTruthy();
      expect(contract.storage).toBeTruthy();
      expect(contract.dynamicInvoke).toBeFalsy();
    };

    const verifyTokenContract = (contract?: Contract): void => {
      expect(contract).toBeDefined();
      if (contract === undefined) {
        throw new Error('For TS');
      }
      expect(contract.codeVersion).toEqual('1.0');
      expect(contract.author).toEqual('dicarlo2');
      expect(contract.email).toEqual('alex.dicarlo@neotracker.io');
      expect(contract.description).toEqual('NEO•ONE Token');
      expect(contract.parameters).toEqual(['String', 'Array']);
      expect(contract.returnType).toEqual('Buffer');
      expect(contract.payable).toBeFalsy();
      expect(contract.storage).toBeTruthy();
      expect(contract.dynamicInvoke).toBeTruthy();
    };

    const verifyCoinContract = (contract?: Contract): void => {
      expect(contract).toBeDefined();
      if (contract === undefined) {
        throw new Error('For TS');
      }
      expect(contract.codeVersion).toEqual('1.0');
      expect(contract.author).toEqual('dicarlo2');
      expect(contract.email).toEqual('alex.dicarlo@neotracker.io');
      expect(contract.description).toEqual('NEO•ONE Coin');
      expect(contract.parameters).toEqual(['String', 'Array']);
      expect(contract.returnType).toEqual('Buffer');
      expect(contract.payable).toBeFalsy();
      expect(contract.storage).toBeTruthy();
      expect(contract.dynamicInvoke).toBeTruthy();
    };

    const verifyEscrowContract = (contract?: Contract): void => {
      expect(contract).toBeDefined();
      if (contract === undefined) {
        throw new Error('For TS');
      }
      expect(contract.codeVersion).toEqual('1.0');
      expect(contract.author).toEqual('dicarlo2');
      expect(contract.email).toEqual('alex.dicarlo@neotracker.io');
      expect(contract.description).toEqual('Escrow');
      expect(contract.parameters).toEqual(['String', 'Array']);
      expect(contract.returnType).toEqual('Buffer');
      expect(contract.payable).toBeFalsy();
      expect(contract.storage).toBeTruthy();
      expect(contract.dynamicInvoke).toBeTruthy();
    };

    const verifyExchangeContract = (contract?: Contract): void => {
      expect(contract).toBeDefined();
      if (contract === undefined) {
        throw new Error('For TS');
      }
      expect(contract.codeVersion).toEqual('1.0');
      expect(contract.author).toEqual('dicarlo2');
      expect(contract.email).toEqual('alex.dicarlo@neotracker.io');
      expect(contract.description).toEqual('Exchange');
      expect(contract.parameters).toEqual(['String', 'Array']);
      expect(contract.returnType).toEqual('Buffer');
      expect(contract.payable).toBeFalsy();
      expect(contract.storage).toBeTruthy();
      // expect(contract.dynamicInvoke).toBeTruthy();
    };

    const mintTokens = async (ico: any, accountID: UserAccountID, developerClient?: DeveloperClient): Promise<void> => {
      const mintResult = await ico.mintTokens({
        sendTo: [
          {
            amount: new BigNumber(10),
            asset: Hash256.NEO,
          },
        ],
      });

      const [mintReceipt] = await Promise.all([
        mintResult.confirmed(),
        developerClient === undefined ? Promise.resolve() : developerClient.runConsensusNow(),
      ]);
      if (mintReceipt.result.state === 'FAULT') {
        throw new Error(mintReceipt.result.message);
      }

      expect(mintReceipt.result.state).toEqual('HALT');
      expect(mintReceipt.result.value).toBeUndefined();
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
    };

    const verifySmartContracts = async (
      ico: any,
      coinICO: any,
      token: any,
      coin: any,
      escrow: any,
      exchange: any,
      accountID: UserAccountID,
      toAccountID: UserAccountID,
      nowSeconds: number,
      developerClient?: DeveloperClient,
    ): Promise<void> => {
      const [
        name,
        symbol,
        decimals,
        coinName,
        coinSymbol,
        amountPerNEO,
        icoOwner,
        startTimeSeconds,
        icoDurationSeconds,
        initialTotalSupply,
        [initialRemaining, initialBalance],
        initExchangeResult,
        initialExchangeBalance,
      ] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        coin.name(),
        coin.symbol(),
        ico.amountPerNEO(),
        ico.owner(),
        ico.startTimeSeconds(),
        ico.icoDurationSeconds(),
        token.totalSupply(),
        Promise.all([ico.remaining(), token.balanceOf(accountID.address)]),
        exchange.initialize.confirmed(),
        exchange.balanceOf(accountID.address, token.definition.networks[accountID.network].address),
      ]);

      expect(name).toEqual('One');
      expect(symbol).toEqual('ONE');
      expect(decimals.toString()).toEqual('8');
      expect(coinName).toEqual('Two');
      expect(coinSymbol).toEqual('TWO');
      expect(amountPerNEO.toString()).toEqual('10');
      expect(icoOwner).toEqual(accountID.address);
      expect(startTimeSeconds.gte(new BigNumber(nowSeconds))).toBeTruthy();
      expect(icoDurationSeconds.toString()).toEqual('157700000');
      expect(initialTotalSupply.toString()).toEqual('0');
      expect(initialRemaining.toString()).toEqual(new BigNumber(10_000_000_000).toString());
      expect(initialBalance.toString()).toEqual('0');
      expect(initExchangeResult.result.value).toEqual(true);
      expect(initialExchangeBalance.toString()).toEqual('0');

      await mintTokens(ico, accountID, developerClient);
      await mintTokens(coinICO, accountID, developerClient);

      await verifySmartContractAfterMint(ico, token, coin, escrow, exchange, accountID, toAccountID, developerClient);
    };

    const verifySmartContractTesting = async (codegenPath: string, nowSeconds: number) => {
      // tslint:disable-next-line no-require-imports
      const test = require(nodePath.resolve(codegenPath, 'test'));
      await test.withContracts(
        async ({ ico, coinIco, token, coin, escrow, exchange, masterAccountID, networkName, client }: any) => {
          await client.providers.memory.keystore.addUserAccount({
            network: networkName,
            privateKey: TO_PRIVATE_KEY,
          });
          await verifySmartContracts(
            ico,
            coinIco,
            token,
            coin,
            escrow,
            exchange,
            masterAccountID,
            { network: networkName, address: privateKeyToAddress(TO_PRIVATE_KEY) },
            nowSeconds,
          );
        },
      );
    };

    const getGeneratedICOCode = (
      dataRoot: string,
    ): {
      readonly abi: ABI;
      readonly contract: {
        readonly createSmartContract: (client: Client) => any;
      };
    } => {
      // tslint:disable-next-line no-require-imports
      const abi = require(nodePath.resolve(dataRoot, 'ICO', 'abi')).icoABI;
      // tslint:disable-next-line no-require-imports
      const contract = require(nodePath.resolve(dataRoot, 'ICO', 'contract'));
      const createSmartContract = contract.createICOSmartContract;

      return { abi, contract: { createSmartContract } };
    };

    const getGeneratedCoinICOCode = (
      dataRoot: string,
    ): {
      readonly abi: ABI;
      readonly contract: {
        readonly createSmartContract: (client: Client) => any;
      };
    } => {
      // tslint:disable-next-line no-require-imports
      const abi = require(nodePath.resolve(dataRoot, 'CoinICO', 'abi')).coinIcoABI;
      // tslint:disable-next-line no-require-imports
      const contract = require(nodePath.resolve(dataRoot, 'CoinICO', 'contract'));
      const createSmartContract = contract.createCoinICOSmartContract;

      return { abi, contract: { createSmartContract } };
    };

    const getGeneratedTokenCode = (
      dataRoot: string,
    ): {
      readonly abi: ABI;
      readonly contract: {
        readonly createSmartContract: (client: Client) => any;
      };
    } => {
      // tslint:disable-next-line no-require-imports
      const abi = require(nodePath.resolve(dataRoot, 'Token', 'abi')).tokenABI;
      // tslint:disable-next-line no-require-imports
      const contract = require(nodePath.resolve(dataRoot, 'Token', 'contract'));
      const createSmartContract = contract.createTokenSmartContract;

      return { abi, contract: { createSmartContract } };
    };

    const getGeneratedCoinCode = (
      dataRoot: string,
    ): {
      readonly abi: ABI;
      readonly contract: {
        readonly createSmartContract: (client: Client) => any;
      };
    } => {
      // tslint:disable-next-line no-require-imports
      const abi = require(nodePath.resolve(dataRoot, 'Coin', 'abi')).coinABI;
      // tslint:disable-next-line no-require-imports
      const contract = require(nodePath.resolve(dataRoot, 'Coin', 'contract'));
      const createSmartContract = contract.createCoinSmartContract;

      return { abi, contract: { createSmartContract } };
    };

    const getGeneratedEscrowCode = (
      dataRoot: string,
    ): {
      readonly abi: ABI;
      readonly contract: {
        readonly createSmartContract: (client: Client) => any;
      };
    } => {
      // tslint:disable-next-line no-require-imports
      const abi = require(nodePath.resolve(dataRoot, 'Escrow', 'abi')).escrowABI;
      // tslint:disable-next-line no-require-imports
      const contract = require(nodePath.resolve(dataRoot, 'Escrow', 'contract'));
      const createSmartContract = contract.createEscrowSmartContract;

      return { abi, contract: { createSmartContract } };
    };

    const getGeneratedExchangeCode = (
      dataRoot: string,
    ): {
      readonly abi: ABI;
      readonly contract: {
        readonly createSmartContract: (client: Client) => any;
      };
    } => {
      // tslint:disable-next-line no-require-imports
      const abi = require(nodePath.resolve(dataRoot, 'Exchange', 'abi')).exchangeABI;
      // tslint:disable-next-line no-require-imports
      const contract = require(nodePath.resolve(dataRoot, 'Exchange', 'contract'));
      const createSmartContract = contract.createExchangeSmartContract;

      return { abi, contract: { createSmartContract } };
    };

    const getGeneratedCommonCode = (
      dataRoot: string,
    ): {
      readonly createClient: () => Client;
      readonly createDeveloperClients: () => { readonly [network: string]: DeveloperClient };
      // tslint:disable-next-line no-require-imports
    } => require(nodePath.resolve(dataRoot, 'client'));

    const verifySmartContractsManual = async (
      dataRoot: string,
      accountID: UserAccountID,
      toAccountID: UserAccountID,
      nowSeconds: number,
    ) => {
      const {
        abi: icoABI,
        contract: { createSmartContract: createICOSmartContract },
      } = getGeneratedICOCode(dataRoot);
      expect(icoABI).toBeDefined();
      const {
        abi: coinIcoABI,
        contract: { createSmartContract: createCoinICOSmartContract },
      } = getGeneratedCoinICOCode(dataRoot);
      expect(coinIcoABI).toBeDefined();
      const {
        abi: tokenABI,
        contract: { createSmartContract: createTokenSmartContract },
      } = getGeneratedTokenCode(dataRoot);
      expect(tokenABI).toBeDefined();
      const {
        abi: coinABI,
        contract: { createSmartContract: createCoinSmartContract },
      } = getGeneratedCoinCode(dataRoot);
      expect(coinABI).toBeDefined();
      const {
        abi: escrowABI,
        contract: { createSmartContract: createEscrowSmartContract },
      } = getGeneratedEscrowCode(dataRoot);
      expect(escrowABI).toBeDefined();
      const {
        abi: exchangeABI,
        contract: { createSmartContract: createExchangeSmartContract },
      } = getGeneratedExchangeCode(dataRoot);
      expect(exchangeABI).toBeDefined();

      const { createClient, createDeveloperClients } = getGeneratedCommonCode(dataRoot);
      const client = createClient();
      const developerClient = createDeveloperClients().local;

      const ico = createICOSmartContract(client);
      const coinICO = createCoinICOSmartContract(client);
      const token = createTokenSmartContract(client);
      const coin = createCoinSmartContract(client);
      const escrow = createEscrowSmartContract(client);
      const exchange = createExchangeSmartContract(client);

      await client.providers.memory.keystore.addUserAccount({
        network: accountID.network,
        privateKey: TO_PRIVATE_KEY,
      });

      await verifySmartContracts(
        ico,
        coinICO,
        token,
        coin,
        escrow,
        exchange,
        accountID,
        toAccountID,
        nowSeconds,
        developerClient,
      );
    };

    const verifySmartContractAfterMint = async (
      ico: any,
      token: any,
      coin: any,
      escrow: any,
      exchange: any,
      accountID: UserAccountID,
      toAccountID: UserAccountID,
      developerClient?: DeveloperClient,
    ): Promise<void> => {
      const [totalSupply, remaining, balance, toBalance] = await Promise.all([
        token.totalSupply(),
        ico.remaining(),
        token.balanceOf(accountID.address),
        token.balanceOf(toAccountID.address),
      ]);
      expect(totalSupply.toString()).toEqual('100');
      expect(remaining.toString()).toEqual(new BigNumber(9_999_999_900).toString());
      expect(balance.toString()).toEqual('100');
      expect(toBalance.toString()).toEqual('0');

      const result = await token.transfer(accountID.address, toAccountID.address, new BigNumber('25'));
      const [receipt] = await Promise.all([
        result.confirmed({ timeoutMS: 2500 }),
        developerClient === undefined ? Promise.resolve() : developerClient.runConsensusNow(),
      ]);
      if (receipt.result.state === 'FAULT') {
        throw new Error(receipt.result.message);
      }

      const [totalSupplyAfter, balanceAfter, toBalanceAfter] = await Promise.all([
        token.totalSupply(),
        token.balanceOf(accountID.address),
        token.balanceOf(toAccountID.address),
      ]);
      expect(totalSupplyAfter.toString()).toEqual('100');
      expect(balanceAfter.toString()).toEqual('75');
      expect(toBalanceAfter.toString()).toEqual('25');

      const escrowAddress = escrow.definition.networks[accountID.network].address;
      const [escrowTransferReceipt] = await Promise.all([
        token.transfer.confirmed(
          accountID.address,
          escrowAddress,
          new BigNumber('25'),
          ...escrow.forwardApproveReceiveTransferArgs(toAccountID.address),
        ),
        developerClient === undefined ? Promise.resolve() : developerClient.runConsensusNow(),
      ]);
      if (escrowTransferReceipt.result.state === 'FAULT') {
        throw new Error(escrowTransferReceipt.result.message);
      }
      expect(escrowTransferReceipt.events).toHaveLength(2);
      const transferEvent = escrowTransferReceipt.events[1];
      if (transferEvent.name !== 'transfer') {
        throw new Error('Expected transfer event');
      }
      expect(transferEvent.parameters.amount.toString()).toEqual('25');
      const balanceAvailableEvent = escrowTransferReceipt.events[0];
      if (balanceAvailableEvent.name !== 'balanceAvailable') {
        throw new Error('Expected balanceAvailable event');
      }
      expect(balanceAvailableEvent.parameters.amount.toString()).toEqual('25');

      const tokenAddress = token.definition.networks[accountID.network].address;
      const [escrowBalanceAfterEscrow, balanceAfterEscrow, toBalanceAfterEscrow, escrowPairBalance] = await Promise.all(
        [
          token.balanceOf(escrowAddress),
          token.balanceOf(accountID.address),
          token.balanceOf(toAccountID.address),
          escrow.balanceOf(accountID.address, toAccountID.address, tokenAddress),
        ],
      );
      expect(escrowBalanceAfterEscrow.toString()).toEqual('25');
      expect(balanceAfterEscrow.toString()).toEqual('50');
      expect(toBalanceAfterEscrow.toString()).toEqual('25');
      expect(escrowPairBalance.toString()).toEqual('25');

      const [escrowClaimReceipt] = await Promise.all([
        escrow.claim.confirmed(accountID.address, toAccountID.address, tokenAddress, new BigNumber('10'), {
          from: toAccountID,
        }),
        developerClient === undefined ? Promise.resolve() : developerClient.runConsensusNow(),
      ]);
      if (escrowClaimReceipt.result.state === 'FAULT') {
        throw new Error(escrowClaimReceipt.result.message);
      }
      expect(escrowClaimReceipt.result.value).toEqual(true);
      expect(escrowClaimReceipt.events).toHaveLength(2);

      const [
        escrowBalanceAfterClaim,
        balanceAfterClaim,
        toBalanceAfterClaim,
        escrowPairBalanceAfterClaim,
      ] = await Promise.all([
        token.balanceOf(escrowAddress),
        token.balanceOf(accountID.address),
        token.balanceOf(toAccountID.address),
        escrow.balanceOf(accountID.address, toAccountID.address, tokenAddress),
      ]);
      expect(escrowBalanceAfterClaim.toString()).toEqual('15');
      expect(balanceAfterClaim.toString()).toEqual('50');
      expect(toBalanceAfterClaim.toString()).toEqual('35');
      expect(escrowPairBalanceAfterClaim.toString()).toEqual('15');

      await verifySmartContractExchange(token, coin, exchange, accountID, toAccountID, developerClient);
    };

    const verifySmartContractExchange = async (
      token: any,
      coin: any,
      exchange: any,
      accountID: UserAccountID,
      toAccountID: UserAccountID,
      developerClient?: DeveloperClient,
    ): Promise<void> => {
      const tokenAssetID = token.definition.networks[accountID.network].address;
      const coinAssetID = coin.definition.networks[accountID.network].address;
      const exchangeAddress = exchange.definition.networks[accountID.network].address;

      const approveDepositReceipt = await token.approveSendTransfer.confirmed(
        accountID.address,
        exchangeAddress,
        new BigNumber(10_00000000),
      );
      expect(approveDepositReceipt.result.value).toEqual(true);

      const [exchangeDepositReceipt] = await Promise.all([
        exchange.deposit.confirmed(accountID.address, tokenAssetID, new BigNumber(10_00000000)),
        developerClient === undefined ? Promise.resolve() : developerClient.runConsensusNow(),
      ]);
      expect(exchangeDepositReceipt.result.value).toEqual(true);
      expect(exchangeDepositReceipt.events).toHaveLength(1);

      const [balanceAfterDeposit, exchangeBalanceAfterDeposit, tokensDeposited] = await Promise.all([
        token.balanceOf(accountID.address),
        token.balanceOf(exchangeAddress),
        exchange.balanceOf(accountID.address, tokenAssetID),
      ]);
      expect(balanceAfterDeposit.toString()).toEqual('40');
      expect(exchangeBalanceAfterDeposit.toString()).toEqual('10');
      expect(tokensDeposited.toString()).toEqual('1000000000');

      const [exchangeWithdrawalReceipt] = await Promise.all([
        exchange.withdraw.confirmed(accountID.address, tokenAssetID, new BigNumber(4_00000000)),
        developerClient === undefined ? Promise.resolve() : developerClient.runConsensusNow(),
      ]);

      expect(exchangeWithdrawalReceipt.result.value).toEqual(true);
      expect(exchangeWithdrawalReceipt.events).toHaveLength(1);

      const [balanceAfterWithdraw, exchangeBalanceAfterWithdraw, tokensWithdrawn] = await Promise.all([
        token.balanceOf(accountID.address),
        token.balanceOf(exchangeAddress),
        exchange.balanceOf(accountID.address, tokenAssetID),
      ]);
      expect(balanceAfterWithdraw.toString()).toEqual('44');
      expect(exchangeBalanceAfterWithdraw.toString()).toEqual('6');
      expect(tokensWithdrawn.toString()).toEqual('600000000');

      const [coinTransferReceipt, approveCoinDepositReceipt] = await Promise.all([
        coin.transfer.confirmed(accountID.address, toAccountID.address, new BigNumber(100)),
        coin.approveSendTransfer.confirmed(toAccountID.address, exchangeAddress, new BigNumber(70_00000000), {
          from: toAccountID,
        }),
        developerClient === undefined ? Promise.resolve() : developerClient.runConsensusNow(),
      ]);
      expect(coinTransferReceipt.result.value).toEqual(true);
      expect(approveCoinDepositReceipt.result.value).toEqual(true);

      const [exchangeCoinDepositReceipt] = await Promise.all([
        exchange.deposit.confirmed(toAccountID.address, coinAssetID, new BigNumber(70_00000000), { from: toAccountID }),
        developerClient === undefined ? Promise.resolve() : developerClient.runConsensusNow(),
      ]);
      expect(exchangeCoinDepositReceipt.result.value).toEqual(true);

      const [coinBalanceAfterDeposit, exchangeCoinBalanceAfterDeposit, coinsDeposited] = await Promise.all([
        coin.balanceOf(toAccountID.address),
        coin.balanceOf(exchangeAddress),
        exchange.balanceOf(toAccountID.address, coinAssetID),
      ]);
      expect(coinBalanceAfterDeposit.toString()).toEqual('30');
      expect(exchangeCoinBalanceAfterDeposit.toString()).toEqual('70');
      expect(coinsDeposited.toString()).toEqual('7000000000');

      const [makeOfferReceipt] = await Promise.all([
        exchange.makeOffer.confirmed(
          accountID.address,
          tokenAssetID,
          new BigNumber(5_00000000),
          coinAssetID,
          new BigNumber(50_00000000),
          // tokenAssetID,
          // new BigNumber(1_00000000),
          'nonce1',
        ),
        developerClient === undefined ? Promise.resolve() : developerClient.runConsensusNow(),
      ]);
      expect(makeOfferReceipt.result.value).toEqual(true);
      const offerHash = makeOfferReceipt.events[0].parameters.offerHash;
      expect(offerHash).toBeDefined();

      const offer = await exchange.getOffer(offerHash);
      expect(offer.maker).toEqual(accountID.address);
      expect(offer.offerAssetID).toEqual(tokenAssetID);
      expect(offer.offerAmount.toString()).toEqual('500000000');
      expect(offer.wantAssetID).toEqual(coinAssetID);
      expect(offer.wantAmount.toString()).toEqual('5000000000');
      // expect(offer.makerFeeAssetID).toEqual(tokenAssetID);
      // expect(offer.makerFeeAvailableAmount.toString()).toEqual('100000000');
      expect(offer.nonce).toEqual('nonce1');

      const [fillOfferReceipt] = await Promise.all([
        exchange.fillOffer.confirmed(toAccountID.address, offerHash, new BigNumber(3_00000000), { from: toAccountID }),
        developerClient === undefined ? Promise.resolve() : developerClient.runConsensusNow(),
      ]);
      expect(fillOfferReceipt.result.value).toEqual(true);

      const [
        exchangeMakerTokenBalanceAfterFill,
        exchangeTakerTokenBalanceAfterFill,
        exchangeMakerCoinBalanceAfterFill,
        exchangeTakerCoinBalanceAfterFill,
        offerAfterFill,
      ] = await Promise.all([
        exchange.balanceOf(accountID.address, tokenAssetID),
        exchange.balanceOf(toAccountID.address, tokenAssetID),
        exchange.balanceOf(accountID.address, coinAssetID),
        exchange.balanceOf(toAccountID.address, coinAssetID),
        exchange.getOffer(offerHash),
      ]);
      expect(exchangeMakerTokenBalanceAfterFill.toString()).toEqual('100000000');
      expect(exchangeTakerTokenBalanceAfterFill.toString()).toEqual('300000000');
      expect(exchangeMakerCoinBalanceAfterFill.toString()).toEqual('3000000000');
      expect(exchangeTakerCoinBalanceAfterFill.toString()).toEqual('4000000000');
      expect(offerAfterFill.maker).toEqual(accountID.address);
      expect(offerAfterFill.offerAssetID).toEqual(tokenAssetID);
      expect(offerAfterFill.offerAmount.toString()).toEqual('200000000');
      expect(offerAfterFill.wantAssetID).toEqual(coinAssetID);
      expect(offerAfterFill.wantAmount.toString()).toEqual('2000000000');
      // expect(offerAfterFill.makerFeeAssetID).toEqual(tokenAssetID);
      // expect(offerAfterFill.makerFeeAvailableAmount.toString()).toEqual('100000000');
      expect(offerAfterFill.nonce).toEqual('nonce1');

      const [cancelOfferReceipt] = await Promise.all([
        exchange.cancelOffer.confirmed(accountID.address, offerHash),
        developerClient === undefined ? Promise.resolve() : developerClient.runConsensusNow(),
      ]);
      expect(cancelOfferReceipt.result.value).toEqual(true);
      const [exchangeMakerTokenBalanceAfterCancel, offerAfterCancel] = await Promise.all([
        exchange.balanceOf(accountID.address, tokenAssetID),
        exchange.getOffer(offerHash),
      ]);
      expect(exchangeMakerTokenBalanceAfterCancel.toString()).toEqual('300000000');
      expect(offerAfterCancel).toEqual(undefined);
    };

    const start = Math.round(Date.now() / 1000);
    const exec = one.createExec('ico');
    one.addCleanup(async () => {
      await exec('stop network');
    });
    await exec('build');

    const [{ client: outerClient }, config] = await Promise.all([getClients('ico'), one.getProjectConfig('ico')]);
    const contracts = await getContracts(outerClient, constants.LOCAL_NETWORK_NAME);
    verifyICOContract(contracts.find((contract) => contract.name === 'ICO'));
    verifyCoinICOContract(contracts.find((contract) => contract.name === 'CoinICO'));
    verifyTokenContract(contracts.find((contract) => contract.name === 'Token'));
    verifyCoinContract(contracts.find((contract) => contract.name === 'Coin'));
    verifyEscrowContract(contracts.find((contract) => contract.name === 'Escrow'));
    verifyExchangeContract(contracts.find((contract) => contract.name === 'Exchange'));

    await Promise.all([
      verifySmartContractTesting(config.codegen.path, start),
      verifySmartContractsManual(
        config.codegen.path,
        { network: constants.LOCAL_NETWORK_NAME, address: privateKeyToAddress(constants.PRIVATE_NET_PRIVATE_KEY) },
        { network: constants.LOCAL_NETWORK_NAME, address: privateKeyToAddress(TO_PRIVATE_KEY) },
        start,
      ),
    ]);
  });
});
