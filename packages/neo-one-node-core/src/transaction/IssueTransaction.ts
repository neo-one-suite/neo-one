import { common, InvalidFormatError, IOHelper, IssueTransactionJSON, UInt160Hex } from '@neo-one/client-common';
import { IssueTransactionModel } from '@neo-one/client-full-common';
import { Constructor } from '@neo-one/utils';
import BN from 'bn.js';
import { VerifyError } from '../errors';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { utils } from '../utils';
import { VerifyScriptResult } from '../vm';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import { Input } from './Input';
import { Output } from './Output';
import {
  FeeContext,
  TransactionBase,
  TransactionBaseAdd,
  TransactionGetScriptHashesForVerifyingOptions,
  TransactionVerifyOptions,
} from './TransactionBase';
import { TransactionType } from './TransactionType';

// tslint:disable-next-line
export interface IssueTransactionAdd extends TransactionBaseAdd {}

export class IssueTransaction extends TransactionBase<
  TransactionType.Issue,
  IssueTransactionJSON,
  Constructor<IssueTransactionModel<Attribute, Input, Output, Witness>>
>(IssueTransactionModel) {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): IssueTransaction {
    const { type, version } = super.deserializeTransactionBaseStartWireBase(options);

    if (type !== TransactionType.Issue) {
      throw new InvalidFormatError();
    }

    const { attributes, inputs, outputs, scripts } = super.deserializeTransactionBaseEndWireBase(options);

    return new this({
      version,
      attributes,
      inputs,
      outputs,
      scripts,
    });
  }

  protected readonly sizeExclusive: () => number = utils.lazy(() => IOHelper.sizeOfUInt8);
  private readonly issueGetScriptHashesForVerifyingInternal: (
    options: TransactionGetScriptHashesForVerifyingOptions,
  ) => Promise<Set<UInt160Hex>>;

  public constructor(add: IssueTransactionAdd) {
    super(add);

    const getScriptHashesForVerifying = super.getScriptHashesForVerifying.bind(this);
    this.issueGetScriptHashesForVerifyingInternal = utils.lazyAsync(
      async (options: TransactionGetScriptHashesForVerifyingOptions) => {
        const { getOutput, getAsset } = options;
        const [hashes, issuerHashes] = await Promise.all([
          getScriptHashesForVerifying(options),
          this.getTransactionResults({ getOutput }).then(async (results) =>
            Promise.all(
              Object.entries(results)
                // tslint:disable-next-line no-unused
                .filter(([_, value]) => value.lt(utils.ZERO))
                // tslint:disable-next-line no-unused
                .map(async ([assetHash, _]) => {
                  const asset = await getAsset({
                    hash: common.hexToUInt256(assetHash),
                  });

                  return common.uInt160ToHex(asset.issuer);
                }),
            ),
          ),
        ]);

        return new Set([...hashes, ...issuerHashes]);
      },
    );
  }

  public async serializeJSON(context: SerializeJSONContext): Promise<IssueTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(context);

    return {
      ...transactionBaseJSON,
      type: 'IssueTransaction',
    };
  }

  public getSystemFee(context: FeeContext): BN {
    if (this.version >= 1) {
      return utils.ZERO;
    }

    const { governingToken, utilityToken } = context;
    if (
      this.outputs.every(
        (output) =>
          common.uInt256Equal(output.asset, governingToken.hash) ||
          common.uInt256Equal(output.asset, utilityToken.hash),
      )
    ) {
      return utils.ZERO;
    }

    return super.getSystemFee(context);
  }

  public async getScriptHashesForVerifying(
    options: TransactionGetScriptHashesForVerifyingOptions,
  ): Promise<Set<UInt160Hex>> {
    return this.issueGetScriptHashesForVerifyingInternal(options);
  }

  public async verify(options: TransactionVerifyOptions): Promise<readonly VerifyScriptResult[]> {
    const [results] = await Promise.all([super.verify(options), this.verifyInternal(options)]);

    return results;
  }

  private async verifyInternal(options: TransactionVerifyOptions): Promise<void> {
    const { getOutput, getAsset, memPool = [] } = options;
    const results = await this.getTransactionResults({ getOutput });
    await Promise.all(
      Object.entries(results).map(async ([assetHex, value]) => {
        const hash = common.hexToUInt256(assetHex);
        const asset = await getAsset({ hash });
        if (asset.amount.lt(utils.ZERO)) {
          return;
        }

        const issued = asset.available.add(
          memPool
            .filter((transaction) => transaction !== this)
            .reduce(
              (acc, transaction) =>
                transaction.outputs
                  .filter((output) => common.uInt256Equal(hash, output.asset))
                  .reduce((innerAcc, output) => innerAcc.add(output.value), acc),

              utils.ZERO,
            ),
        );

        if (asset.amount.sub(issued).lt(value.neg())) {
          throw new VerifyError('Invalid issue amount');
        }
      }),
    );
  }
}
