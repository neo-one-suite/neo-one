/// <reference types="@reactivex/ix-es2015-cjs" />
import {
  AccountJSON,
  AddressString,
  assertAttributeUsageJSON,
  AttributeJSON,
  AttributeModel,
  AttributeUsageModel,
  BlockJSON,
  BufferAttributeModel,
  ClaimTransactionModel,
  common,
  ConfirmedTransaction,
  ECPointAttributeModel,
  GetOptions,
  Hash256String,
  Input,
  InputJSON,
  InputOutput,
  InvocationTransactionModel,
  Output,
  RawCallReceipt,
  RelayTransactionResult,
  scriptHashToAddress,
  TransactionBaseJSON,
  TransactionBaseModel,
  TransactionJSON,
  TransactionReceipt,
  TransactionTypeModel,
  UInt160AttributeModel,
  UInt256AttributeModel,
  utils,
  VMState,
} from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { interval } from 'rxjs';
import { filter, switchMap, take, timeout } from 'rxjs/operators';
import { NeoNotImplementedError, UnknownTransactionError } from '../errors';
import {
  convertCallReceipt,
  convertInput,
  convertInputs,
  convertOutput,
  convertRelayTransactionResult,
  convertTransactionBase,
} from './convert';
import { DataProviderBase } from './DataProviderBase';

/**
 * Implements the methods required by the `NEOONEProvider` using a NEO node.
 */
export class NEODataProvider extends DataProviderBase {
  protected async executeGetOutput(input: Input): Promise<Output> {
    const transaction = await this.getTransaction(input.hash);

    return transaction.outputs[input.index];
  }
  protected async executeTestInvoke(transaction: InvocationTransactionModel): Promise<RawCallReceipt> {
    const scriptHashesForVerifying = await transaction.getScriptHashesForVerifying({
      getOutput: this.getOutput,
      getAsset: this.getAsset,
    });

    const result = await this.mutableClient.testInvokeRaw(transaction.script.toString('hex'), scriptHashesForVerifying);
    const gasConsumed = new BigNumber(result.gas_consumed).lt(utils.TEN_BIG_NUMBER)
      ? '0'
      : new BigNumber(result.gas_consumed).minus(utils.TEN_BIG_NUMBER).toString();

    if (result.state === 'HALT') {
      return convertCallReceipt({
        result: {
          state: VMState.Halt,
          gas_consumed: gasConsumed,
          gas_cost: result.gas_consumed,
          stack: result.stack,
        },
        actions: [],
      });
    }

    return convertCallReceipt({
      result: {
        state: VMState.Fault,
        gas_consumed: gasConsumed,
        gas_cost: result.gas_consumed,
        stack: result.stack,
        message: '',
      },
      actions: [],
    });
  }
  protected async executeGetTransactionReceipt(hash: Hash256String, options?: GetOptions): Promise<TransactionReceipt> {
    let watchTimeoutMS = 120000;
    if (options !== undefined && options.timeoutMS !== undefined) {
      watchTimeoutMS = options.timeoutMS;
    }

    let height: number | undefined;
    try {
      height = await interval(5000)
        .pipe(
          switchMap(async () => {
            try {
              // tslint:disable-next-line prefer-immediate-return
              const result = await this.mutableClient.getTransactionHeight(hash);

              // tslint:disable-next-line no-var-before-return
              return result;
            } catch {
              return undefined;
            }
          }),
          filter((transactionHeight) => transactionHeight !== undefined),
          take(1),
          timeout(new Date(Date.now() + watchTimeoutMS)),
        )
        .toPromise();
    } catch {
      throw new UnknownTransactionError(hash);
    }

    if (height === undefined) {
      throw new UnknownTransactionError(hash);
    }
    const block = await this.getBlock(height);

    return {
      blockIndex: height,
      blockHash: block.hash,
      transactionIndex: block.transactions.findIndex((transaction) =>
        common.uInt256Equal(common.hexToUInt256(transaction.hash), common.hexToUInt256(hash)),
      ),
      globalIndex: new BigNumber(-1),
    };
  }
  protected async executeRelayTransaction(
    transaction: TransactionBaseModel,
    networkFee: BigNumber = utils.ZERO_BIG_NUMBER,
  ): Promise<RelayTransactionResult> {
    const transactionSerialized = transaction.serializeWire();
    await this.mutableClient.sendRawTransaction(transactionSerialized.toString('hex'));

    const transactionBase: TransactionBaseJSON = {
      txid: transaction.hashHex,
      size: transactionSerialized.byteLength,
      version: transaction.version,
      attributes: transaction.attributes.map(this.convertAttributeModel),
      vin: transaction.inputs.map((input) => ({
        txid: input.hashHex,
        vout: input.index,
      })),
      vout: transaction.outputs.map((output, n) => ({
        n,
        asset: common.uInt256ToHex(output.asset),
        value: output.value.toString(),
        address: scriptHashToAddress(common.uInt160ToHex(output.address)),
      })),
      scripts: transaction.scripts.map((script) => ({
        invocation: script.invocation.toString('hex'),
        verification: script.verification.toString('hex'),
      })),
      sys_fee: utils.ZERO.toString(),
      net_fee: networkFee.toString(),
      data: undefined,
    };

    if (transaction.type === TransactionTypeModel.Claim) {
      return convertRelayTransactionResult({
        transaction: {
          ...transactionBase,
          type: 'ClaimTransaction',
          claims: (transaction as ClaimTransactionModel).claims.map((input) => ({
            txid: input.hashHex,
            vout: input.index,
          })),
        },
      });
    }
    if (transaction.type === TransactionTypeModel.Invocation) {
      return convertRelayTransactionResult({
        transaction: {
          ...transactionBase,
          type: 'InvocationTransaction',
          script: (transaction as InvocationTransactionModel).script.toString('hex'),
          gas: (transaction as InvocationTransactionModel).gas.toString(),
        },
      });
    }

    throw new NeoNotImplementedError('Transaction types besides Claim & Invocation are');
  }
  protected async executeGetUnspentOutputs(address: AddressString): Promise<readonly InputOutput[]> {
    const unspents = await this.mutableClient.getUnspents(address);

    return _.flatten(
      unspents.balance.map(({ unspent, asset_hash }) =>
        unspent.map<InputOutput>(({ txid, n, value }) => {
          const output = convertOutput({ address, asset: common.add0x(asset_hash), value, n });
          const input = convertInput({ txid, vout: n });

          return {
            ...input,
            ...output,
          };
        }),
      ),
    );
  }
  protected async executeGetUnclaimed(
    address: AddressString,
  ): Promise<{ readonly unclaimed: readonly Input[]; readonly amount: BigNumber }> {
    const claimable = await this.mutableClient.getClaimable(address);

    return {
      unclaimed: convertInputs(
        claimable.claimable.map<InputJSON>(({ txid, n }) => ({ txid, vout: n })),
      ),
      amount: new BigNumber(claimable.unclaimed),
    };
  }

  protected async executeGetAccountInternal(address: AddressString): Promise<AccountJSON> {
    const [account, { claimable }, unspents] = await Promise.all([
      this.mutableClient.getAccount(address),
      this.mutableClient.getClaimable(address),
      this.mutableClient.getUnspents(address),
    ]);

    return {
      version: account.version,
      script_hash: account.script_hash,
      frozen: account.frozen,
      votes: account.votes,
      balances: account.balances,
      unspent: _.flatten(
        unspents.balance.map(({ unspent }) => unspent.map<InputJSON>(({ txid, n }) => ({ txid, vout: n }))),
      ),
      unclaimed: claimable.map<InputJSON>(({ txid, n }) => ({ txid, vout: n })),
    };
  }

  protected convertConfirmedTransaction(transaction: TransactionJSON, block: BlockJSON): ConfirmedTransaction {
    const data = {
      blockHash: block.hash,
      blockIndex: block.index,
      transactionIndex: block.tx.findIndex((tx) => tx.txid === transaction.txid),
      globalIndex: new BigNumber(-1),
    };

    return convertTransactionBase(
      transaction,
      (invocation, transactionBase) => ({
        ...transactionBase,
        type: 'InvocationTransaction',
        script: invocation.script,
        gas: new BigNumber(invocation.gas),
        receipt: data,
      }),
      // tslint:disable-next-line no-any
      (converted) => ({ ...converted, receipt: data } as any),
    );
  }

  private convertAttributeModel(attribute: AttributeModel): AttributeJSON {
    const usage = assertAttributeUsageJSON(AttributeUsageModel[attribute.usage]);

    if (attribute instanceof UInt160AttributeModel) {
      return {
        usage,
        data: common.uInt160ToHex(attribute.value),
      };
    }

    if (attribute instanceof UInt256AttributeModel) {
      return {
        usage,
        data: common.uInt256ToHex(attribute.value),
      };
    }

    if (attribute instanceof ECPointAttributeModel) {
      return {
        usage,
        data: common.ecPointToHex(attribute.value),
      };
    }

    if (attribute instanceof BufferAttributeModel) {
      return {
        usage,
        data: attribute.value.toString('hex'),
      };
    }

    throw new Error('For TS');
  }
}
