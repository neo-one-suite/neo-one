/* @flow */
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import BigNumber from 'bignumber.js';
import {
  TRANSACTION_TYPE,
  VM_STATE,
  type Transaction as TransactionModel,
  type UInt256,
  common,
  utils,
} from '@neo-one/client-core';

import _ from 'lodash';
import { flatMap, flatten } from 'ix/asynciterable/pipe/index';
import {
  main as mainSettings,
  test as testSettings,
} from '@neo-one/node-neo-settings';
import { utils as commonUtils } from '@neo-one/utils';

import type {
  ABI,
  Action,
  Account,
  AddressLike,
  AssetLike,
  AttributeLike,
  Block,
  ClientProvider,
  ContractLike,
  ContractParameter,
  GetActionsFilter,
  Hash160Like,
  Hash256Like,
  Input,
  InputLike,
  InvocationResultSuccess,
  NumberLike,
  Output,
  OutputLike,
  ParamLike,
  PrivateKeyLikeOrSign,
  ScriptLike,
  StorageItem,
  SmartContract,
  Transaction,
  TransferLike,
  InvocationResult,
} from './types';
import BasicClientBase from './BasicClientBase';
import type { ClientBaseOptions } from './ClientBase';
import { InsufficientFundsError, InvokeError } from './errors';
import { JSONRPCClientProvider, JSONRPCHTTPProvider } from './json';

import converters from './converters';
import createSmartContract from './createSmartContract';

export type ClientOptions = {|
  ...ClientBaseOptions,
  provider?: ClientProvider,
  url?: string,
  type?: 'main' | 'test',
  utilityTokenHash?: string,
  issueGASFee?: NumberLike,
|};

const GAS_ASSET_HASH =
  '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7';

type OutputBigNumber = {|
  value: BigNumber,
  asset: UInt256,
  index: number,
  txid: UInt256,
|};

export default class Client extends BasicClientBase<
  Block,
  Transaction,
  Account,
  InvocationResult,
  SmartContract,
  ClientProvider,
> {
  _utilityTokenHash: string;
  _issueGASFee: NumberLike;

  constructor(optionsIn?: ClientOptions) {
    const options = optionsIn || {};
    let { url } = options;
    if (url == null) {
      url =
        options.type === 'test'
          ? 'https://testnet.neotracker.io/rpc'
          : 'https://neotracker.io/rpc';
    }
    super({
      provider:
        options.provider ||
        new JSONRPCClientProvider(new JSONRPCHTTPProvider(url)),
      addressVersion: options.addressVersion,
      privateKeyVersion: options.privateKeyVersion,
    });
    this._utilityTokenHash =
      options.utilityTokenHash == null
        ? GAS_ASSET_HASH
        : options.utilityTokenHash;
    if (options.issueGASFee == null) {
      if (options.type === 'test') {
        this._issueGASFee = common.fixed8ToDecimal(
          testSettings.fees[TRANSACTION_TYPE.ISSUE],
        );
      } else {
        this._issueGASFee = common.fixed8ToDecimal(
          mainSettings.fees[TRANSACTION_TYPE.ISSUE],
        );
      }
    } else {
      this._issueGASFee = options.issueGASFee;
    }
  }

  getOutput(input: InputLike): Promise<Output> {
    return this._provider.getOutput(converters.input(input));
  }

  getClaimAmount(input: InputLike): Promise<BigNumber> {
    return this._provider.getClaimAmount(converters.input(input));
  }

  contract(abi: ABI): SmartContract {
    return createSmartContract({ client: this, abi, isBasicClient: false });
  }

  iterStorage(hash: Hash160Like): AsyncIterable<StorageItem> {
    return AsyncIterableX.from(
      this._getAllStorage(hash).then(res => AsyncIterableX.from(res)),
    ).pipe(flatten());
  }

  iterActions(filterIn?: GetActionsFilter): AsyncIterable<Action> {
    const filter = filterIn || {};
    return AsyncIterableX.from(
      this.iterBlocks({
        indexStart: filter.blockIndexStart,
        indexStop: filter.blockIndexStop,
      }),
    ).pipe(
      flatMap(async block => {
        const actions = await this._getActions({
          blockIndexStart: block.index,
          transactionIndexStart:
            block.index === filter.blockIndexStart
              ? filter.transactionIndexStart
              : undefined,
          indexStart:
            block.index === filter.blockIndexStart
              ? filter.indexStart
              : undefined,
          blockIndexStop: block.index,
          transactionIndexStop:
            block.index === filter.blockIndexStop
              ? filter.transactionIndexStop
              : undefined,
          indexStop:
            block.index === filter.blockIndexStop
              ? filter.indexStop
              : undefined,
          scriptHash: filter.scriptHash,
        });
        return AsyncIterableX.of(...actions);
      }),
    );
  }

  async transfer({
    transfers,
    privateKey,
    attributes,
  }: {|
    transfers: Array<TransferLike>,
    privateKey: PrivateKeyLikeOrSign,
    attributes?: Array<AttributeLike>,
  |}): Promise<string> {
    const { inputs, outputs } = await this._getTransfersInputOutputs({
      transfers,
      privateKey,
    });

    return this.transferRaw({
      inputs,
      outputs,
      privateKey,
      attributes,
    });
  }

  async claimAll({
    privateKey,
    attributes,
  }: {|
    privateKey: PrivateKeyLikeOrSign,
    attributes?: Array<AttributeLike>,
  |}): Promise<string> {
    const address = this._getAddress(privateKey);

    const account = await this.getAccount(address);
    const claimAmounts = await Promise.all(
      account.unclaimed.map(input =>
        this.getClaimAmount({
          txid: input.txid,
          vout: input.vout,
        }),
      ),
    );

    return this.claimRaw({
      claims: account.unclaimed.map(input => ({
        txid: input.txid,
        vout: input.vout,
      })),
      outputs: [
        {
          address,
          asset: this._utilityTokenHash,
          value: claimAmounts.reduce(
            (acc, value) => acc.plus(value),
            new BigNumber(utils.ZERO_BIG_NUMBER),
          ),
        },
      ],
      privateKey,
      attributes,
    });
  }

  async invoke({
    script,
    privateKey,
    transfers,
    attributes,
    gas,
  }: {|
    script: ScriptLike,
    privateKey: PrivateKeyLikeOrSign,
    transfers?: Array<TransferLike>,
    attributes?: Array<AttributeLike>,
    gas?: NumberLike,
  |}): Promise<{|
    txid: string,
    stack: Array<ContractParameter>,
  |}> {
    const {
      result: { gas_consumed: gasConsumed, stack },
      transaction,
      txid,
    } = await this._testInvokeInternal({
      script,
      privateKey,
      transfers,
      attributes,
      gas,
    });

    if (gas == null) {
      const { inputs, outputs } = await this._getTransfersInputOutputs({
        transfers,
        gas: gasConsumed,
        privateKey,
      });

      const id = await this.invokeRaw({
        script,
        inputs,
        outputs,
        privateKey,
        attributes,
      });

      return { txid: id, stack };
    }

    await this._sendTransactionRaw(transaction.serializeWire());
    return { txid, stack };
  }

  invokeMethod({
    hash,
    method,
    params,
    privateKey,
    transfers,
    attributes,
  }: {|
    hash: Hash160Like,
    method: string,
    params: Array<ParamLike>,
    privateKey: PrivateKeyLikeOrSign,
    transfers?: Array<TransferLike>,
    attributes?: Array<AttributeLike>,
  |}): Promise<{| txid: string, stack: Array<ContractParameter> |}> {
    return this.invoke({
      script: this._getInvokeMethodScript({
        hash,
        method,
        params,
      }),
      privateKey,
      transfers,
      attributes,
    });
  }

  async testInvoke({
    script,
    privateKey,
    transfers,
    attributes,
    gas,
  }: {|
    script: ScriptLike,
    privateKey: PrivateKeyLikeOrSign,
    transfers?: Array<TransferLike>,
    attributes?: Array<AttributeLike>,
    gas?: NumberLike,
  |}): Promise<InvocationResultSuccess> {
    const { result } = await this._testInvokeInternal({
      script,
      privateKey,
      transfers,
      attributes,
      gas,
    });

    return result;
  }

  testInvokeMethod({
    hash,
    method,
    params,
    privateKey,
    transfers,
    attributes,
  }: {|
    hash: Hash160Like,
    method: string,
    params: Array<ParamLike>,
    privateKey: PrivateKeyLikeOrSign,
    transfers?: Array<TransferLike>,
    attributes?: Array<AttributeLike>,
  |}): Promise<InvocationResultSuccess> {
    return this.testInvoke({
      script: this._getInvokeMethodScript({
        hash,
        method,
        params,
      }),
      privateKey,
      transfers,
      attributes,
    });
  }

  async publish({
    contract,
    privateKey,
    attributes,
  }: {|
    contract: ContractLike,
    privateKey: PrivateKeyLikeOrSign,
    attributes?: Array<AttributeLike>,
  |}): Promise<{| txid: string, hash: string |}> {
    const { script, hash } = this._getContractAndScript({ contract });

    const { txid } = await this.invoke({
      script,
      privateKey,
      attributes,
    });

    return { txid, hash };
  }

  async register({
    asset,
    privateKey,
    attributes,
  }: {|
    asset: AssetLike,
    privateKey: PrivateKeyLikeOrSign,
    attributes?: Array<AttributeLike>,
  |}): Promise<string> {
    const script = this._getAssetScript({ asset });

    const { txid } = await this.invoke({
      script,
      privateKey,
      attributes,
    });

    return txid;
  }

  async issue({
    issues,
    privateKey,
    attributes,
  }: {|
    issues: Array<TransferLike>,
    privateKey: PrivateKeyLikeOrSign,
    attributes?: Array<AttributeLike>,
  |}): Promise<string> {
    const { inputs, outputs } = await this._getTransfersInputOutputs({
      transfers: [],
      gas: this._issueGASFee,
      privateKey,
    });

    return this.issueRaw({
      inputs,
      outputs: outputs.concat(
        issues.map(issue => ({
          address: issue.to,
          asset: issue.asset,
          value: issue.amount,
        })),
      ),
      privateKey,
      attributes,
    });
  }

  _getAllStorage(hash: Hash160Like): Promise<Array<StorageItem>> {
    return this._provider.getAllStorage(converters.hash160(this, hash));
  }

  _getActions(filter: GetActionsFilter): Promise<Array<Action>> {
    return this._provider.getActions({
      ...filter,
      scriptHash:
        filter.scriptHash == null
          ? undefined
          : converters.hash160(this, filter.scriptHash),
    });
  }

  async _getTransfersInputOutputs({
    transfers: transfersIn,
    privateKey,
    gas,
  }: {|
    transfers?: Array<TransferLike>,
    privateKey: PrivateKeyLikeOrSign,
    gas?: NumberLike,
  |}): Promise<{| outputs: Array<OutputLike>, inputs: Array<InputLike> |}> {
    const transfers = ((transfersIn || []).map(transfer => ({
      to: transfer.to,
      asset: transfer.asset,
      amount: transfer.amount,
    })): Array<{|
      to?: AddressLike,
      asset: Hash256Like,
      amount: NumberLike,
    |}>);

    const gasDecimal = common.fixed8ToDecimal(
      converters.number(gas == null ? '0' : gas, 8),
    );
    if (transfers.length === 0 && gasDecimal.lte(utils.ZERO_BIG_NUMBER)) {
      return { inputs: [], outputs: [] };
    }

    const from = this._getAddress(privateKey);
    const account = await this.getAccount(from);
    const outputsBigNumber = await this._getOutputsBigNumber(account.unspent);
    return commonUtils
      .values(
        _.groupBy(
          gas == null
            ? transfers
            : transfers.concat({
                amount: gas,
                asset: GAS_ASSET_HASH,
              }),
          ({ asset }) => common.uInt256ToString(converters.hash256(asset)),
        ),
      )
      .reduce(
        (acc, toByAsset) => {
          const asset = converters.hash256(toByAsset[0].asset);
          const assetResults = toByAsset.reduce(
            (
              { initial, assetOutputsBigNumber, inputs, outputs },
              { amount, to },
            ) => {
              const result = this._getTransferInputOutputs({
                from,
                to,
                asset,
                amount,
                outputsBigNumber: assetOutputsBigNumber,
                initial,
              });

              return {
                initial: result.remaining,
                assetOutputsBigNumber: result.remainingOutputsBigNumber,
                inputs: inputs.concat(result.inputs),
                outputs: outputs.concat(result.outputs),
              };
            },
            {
              initial: utils.ZERO_BIG_NUMBER,
              assetOutputsBigNumber: outputsBigNumber.filter(output =>
                common.uInt256Equal(output.asset, asset),
              ),
              inputs: [],
              outputs: [],
            },
          );

          const outputs = acc.outputs.concat(assetResults.outputs);
          if (assetResults.initial.gt(utils.ZERO_BIG_NUMBER)) {
            outputs.push({
              address: from,
              asset,
              value: assetResults.initial,
            });
          }

          return {
            inputs: acc.inputs.concat(assetResults.inputs),
            outputs,
          };
        },
        { inputs: [], outputs: [] },
      );
  }

  _getTransferInputOutputs({
    to: toIn,
    amount: amountIn,
    asset: assetIn,
    outputsBigNumber,
    initial,
  }: {|
    from: AddressLike,
    to?: AddressLike,
    amount: NumberLike,
    asset: Hash256Like,
    outputsBigNumber: Array<OutputBigNumber>,
    initial: BigNumber,
  |}): {|
    inputs: Array<InputLike>,
    outputs: Array<OutputLike>,
    remainingOutputsBigNumber: Array<OutputBigNumber>,
    remaining: BigNumber,
  |} {
    const to = toIn == null ? undefined : converters.hash160(this, toIn);
    const originalAmount = common.fixed8ToDecimal(
      converters.number(amountIn, 8),
    );
    const amount = originalAmount.minus(initial);
    const asset = converters.hash256(assetIn);

    const outputs =
      to == null
        ? []
        : [
            {
              address: to,
              asset,
              value: originalAmount.toString(),
            },
          ];
    if (amount.lte(utils.ZERO_BIG_NUMBER)) {
      return {
        inputs: [],
        outputs,
        remainingOutputsBigNumber: outputsBigNumber,
        remaining: initial.minus(originalAmount),
      };
    }

    const outputsOrdered = outputsBigNumber
      .sort((coinA, coinB) => coinA.value.cmp(coinB.value))
      .reverse();

    const sum = outputsOrdered.reduce(
      (acc, coin) => acc.plus(coin.value),
      utils.ZERO_BIG_NUMBER,
    );

    if (sum.lt(amount)) {
      throw new InsufficientFundsError(sum, amount);
    }

    // find input coins
    let k = 0;
    let amountRemaining = amount.plus(utils.ZERO_BIG_NUMBER);
    while (outputsOrdered[k].value.lte(amountRemaining)) {
      amountRemaining = amountRemaining.minus(outputsOrdered[k].value);
      if (amountRemaining.equals(utils.ZERO_BIG_NUMBER)) {
        break;
      }
      k += 1;
    }

    let coinAmount = utils.ZERO_BIG_NUMBER;
    const inputs = ([]: Array<InputLike>);
    for (let i = 0; i < k + 1; i += 1) {
      coinAmount = coinAmount.plus(outputsOrdered[i].value);
      inputs.push({
        txid: outputsOrdered[i].txid,
        vout: outputsOrdered[i].index,
      });
    }

    return {
      inputs,
      outputs,
      remainingOutputsBigNumber: outputsOrdered.slice(k + 1),
      remaining: coinAmount.minus(amount),
    };
  }

  _getOutputsBigNumber(inputs: Array<Input>): Promise<Array<OutputBigNumber>> {
    return Promise.all(
      inputs.map(async input => {
        const output = await this.getOutput({
          txid: input.txid,
          vout: input.vout,
        });
        return {
          value: new BigNumber(output.value),
          asset: converters.hash256(output.asset),
          index: output.n,
          txid: converters.hash256(input.txid),
        };
      }),
    );
  }

  async _testInvokeInternal({
    script,
    privateKey,
    transfers,
    attributes,
    gas,
  }: {|
    script: ScriptLike,
    privateKey: PrivateKeyLikeOrSign,
    transfers?: Array<TransferLike>,
    attributes?: Array<AttributeLike>,
    gas?: NumberLike,
  |}): Promise<{|
    result: InvocationResultSuccess,
    transaction: TransactionModel,
    txid: string,
  |}> {
    const { inputs, outputs } = await this._getTransfersInputOutputs({
      transfers,
      privateKey,
      gas,
    });
    const unsignedTransaction = this._getInvocationTransaction({
      script,
      inputs,
      outputs,
      attributes,
      privateKey,
      gas,
    });
    const { result, transaction, txid } = await this._sendTransactionBase(
      unsignedTransaction,
      privateKey,
      (value: Buffer) => this._testInvocation(value),
    );
    if (result.state === VM_STATE.FAULT) {
      throw new InvokeError(result.message);
    }

    return { result, transaction, txid };
  }

  _testInvocation(value: Buffer): Promise<InvocationResult> {
    return this._provider.testInvocation(value);
  }
}
