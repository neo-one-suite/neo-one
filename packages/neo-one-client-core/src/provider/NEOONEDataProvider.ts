/// <reference types="@reactivex/ix-es2015-cjs" />
import {
  AccountJSON,
  AddressString,
  Block,
  ConfirmedTransaction,
  DeveloperProvider,
  GetOptions,
  Hash256String,
  Input,
  InputOutput,
  InvocationTransactionModel,
  IterOptions,
  NetworkSettings,
  Output,
  PrivateNetworkSettings,
  RawAction,
  RawCallReceipt,
  RawInvocationData,
  RelayTransactionResult,
  StorageItem,
  StorageItemJSON,
  TransactionBaseModel,
  TransactionJSON,
  TransactionReceipt,
  utils,
} from '@neo-one/client-common';
import { utils as commonUtils } from '@neo-one/utils';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { flatMap } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/flatmap';
import { flatten } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/flatten';
import { map } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/map';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { AsyncBlockIterator } from '../AsyncBlockIterator';
import { MissingTransactionDataError } from '../errors';
import {
  convertCallReceipt,
  convertConfirmedTransaction,
  convertInputs,
  convertInvocationData,
  convertNetworkSettings,
  convertOutput,
  convertRelayTransactionResult,
  convertStorageItem,
} from './convert';
import { DataProviderBase } from './DataProviderBase';

/**
 * Implements the methods required by the `NEOONEProvider` as well as the `DeveloperProvider` interface using a NEO•ONE node.
 */
export class NEOONEDataProvider extends DataProviderBase implements DeveloperProvider {
  public async getClaimAmount(input: Input): Promise<BigNumber> {
    return this.capture(
      async () => this.mutableClient.getClaimAmount({ txid: input.hash, vout: input.index }),
      'neo_get_claim_amount',
    );
  }

  public async getInvocationData(hash: Hash256String): Promise<RawInvocationData> {
    const [invocationData, transaction] = await Promise.all([
      this.mutableClient.getInvocationData(hash),
      this.mutableClient.getTransaction(hash),
    ]);

    if (transaction.data === undefined) {
      throw new MissingTransactionDataError(hash);
    }

    return convertInvocationData(
      invocationData,
      transaction.data.blockHash,
      transaction.data.blockIndex,
      hash,
      transaction.data.transactionIndex,
    );
  }

  public iterBlocks(options: IterOptions = {}): AsyncIterable<Block> {
    return AsyncIterableX.from(
      new AsyncBlockIterator({
        client: this,
        options,
        fetchTimeoutMS: this.iterBlocksFetchTimeoutMS,
        batchSize: this.iterBlocksBatchSize,
      }),
    );
  }

  public async getNetworkSettings(): Promise<NetworkSettings> {
    const settings = await this.mutableClient.getNetworkSettings();

    return convertNetworkSettings(settings);
  }

  public iterActionsRaw(options: IterOptions = {}): AsyncIterable<RawAction> {
    return AsyncIterableX.from(this.iterBlocks(options)).pipe<RawAction>(
      flatMap(async (block) => {
        const actions = _.flatten(
          block.transactions.map((transaction) => {
            if (transaction.type === 'InvocationTransaction') {
              return [...transaction.invocationData.actions];
            }

            return [];
          }),
        );

        return AsyncIterableX.of(...actions);
      }),
    );
  }

  public async runConsensusNow(): Promise<void> {
    return this.mutableClient.runConsensusNow();
  }

  public async updateSettings(options: Partial<PrivateNetworkSettings>): Promise<void> {
    return this.mutableClient.updateSettings(options);
  }

  public async getSettings(): Promise<PrivateNetworkSettings> {
    return this.mutableClient.getSettings();
  }

  public async fastForwardOffset(seconds: number): Promise<void> {
    return this.mutableClient.fastForwardOffset(seconds);
  }

  public async fastForwardToTime(seconds: number): Promise<void> {
    return this.mutableClient.fastForwardToTime(seconds);
  }

  public async reset(): Promise<void> {
    return this.mutableClient.reset();
  }

  public async getNEOTrackerURL(): Promise<string | undefined> {
    return this.mutableClient.getNEOTrackerURL();
  }

  public async resetProject(): Promise<void> {
    return this.mutableClient.resetProject();
  }

  public iterStorage(address: AddressString): AsyncIterable<StorageItem> {
    return AsyncIterableX.from(this.mutableClient.getAllStorage(address).then((res) => AsyncIterableX.from(res))).pipe(
      // tslint:disable-next-line no-any
      flatten<StorageItem>() as any,
      map<StorageItemJSON, StorageItem>(convertStorageItem),
    );
  }

  protected async executeGetOutput(input: Input): Promise<Output> {
    const output = await this.mutableClient.getOutput({
      txid: input.hash,
      vout: input.index,
    });

    return convertOutput(output);
  }

  protected async executeTestInvoke(transaction: InvocationTransactionModel): Promise<RawCallReceipt> {
    const receipt = await this.mutableClient.testInvocation(transaction.serializeWire().toString('hex'));

    return convertCallReceipt(receipt);
  }

  protected async executeRelayTransaction(
    transaction: TransactionBaseModel,
    _networkFee?: BigNumber,
  ): Promise<RelayTransactionResult> {
    const result = await this.mutableClient.relayTransaction(transaction.serializeWire().toString('hex'));

    return convertRelayTransactionResult(result);
  }

  protected async executeRelayStrippedTransaction(
    verificationTransaction: InvocationTransactionModel,
    relayTransaction: InvocationTransactionModel,
    _networkFee?: BigNumber,
  ): Promise<RelayTransactionResult> {
    const result = await this.mutableClient.relayStrippedTransaction(
      verificationTransaction.serializeWire().toString('hex'),
      relayTransaction.serializeWire().toString('hex'),
    );

    return convertRelayTransactionResult(result);
  }

  protected async executeGetTransactionReceipt(hash: Hash256String, options?: GetOptions): Promise<TransactionReceipt> {
    const result = await this.mutableClient.getTransactionReceipt(hash, options);

    return { ...result, globalIndex: new BigNumber(result.globalIndex) };
  }

  protected async executeGetUnspentOutputs(address: AddressString): Promise<readonly InputOutput[]> {
    const account = await this.getAccountInternal(address);
    const outputs = await Promise.all(
      account.unspent.map(
        async (input): Promise<InputOutput | undefined> => {
          const outputJSON = await this.mutableClient.getUnspentOutput(input);

          if (outputJSON === undefined) {
            return undefined;
          }

          const output = convertOutput(outputJSON);

          return {
            asset: output.asset,
            value: output.value,
            address: output.address,
            hash: input.txid,
            index: input.vout,
          };
        },
      ),
    );

    return outputs.filter(commonUtils.notNull);
  }
  protected async executeGetUnclaimed(
    address: AddressString,
  ): Promise<{ readonly unclaimed: readonly Input[]; readonly amount: BigNumber }> {
    const account = await this.getAccountInternal(address);
    const amounts = await Promise.all(account.unclaimed.map(async (input) => this.mutableClient.getClaimAmount(input)));

    return {
      unclaimed: convertInputs(account.unclaimed),
      amount: amounts.reduce((acc, amount) => acc.plus(amount), utils.ZERO_BIG_NUMBER),
    };
  }

  protected async executeGetAccountInternal(address: AddressString): Promise<AccountJSON> {
    return this.mutableClient.getAccount(address);
  }

  protected convertConfirmedTransaction(transaction: TransactionJSON): ConfirmedTransaction {
    return convertConfirmedTransaction(transaction);
  }
}
