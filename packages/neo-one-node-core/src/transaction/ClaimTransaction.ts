import {
  ClaimTransactionJSON,
  ClaimTransactionModel,
  ClaimTransactionModelAdd,
  common,
  InvalidFormatError,
  IOHelper,
  UInt160Hex,
} from '@neo-one/client-common';
import { Constructor } from '@neo-one/utils';
import { BN } from 'bn.js';
import { VerifyError } from '../errors';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { utils } from '../utils';
import { VerifyScriptResult } from '../vm';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import { hasDuplicateInputs, hasIntersectingInputs } from './common';
import { Input } from './Input';
import { Output } from './Output';
import {
  FeeContext,
  GetReferencesOptions,
  TransactionBase,
  TransactionGetScriptHashesForVerifyingOptions,
  TransactionVerifyOptions,
} from './TransactionBase';
import { TransactionType } from './TransactionType';

export interface ClaimTransactionAdd extends ClaimTransactionModelAdd<Attribute, Input, Output, Witness> {}

export class ClaimTransaction extends TransactionBase<
  TransactionType.Claim,
  ClaimTransactionJSON,
  Constructor<ClaimTransactionModel<Attribute, Input, Output, Witness>>
>(ClaimTransactionModel) {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ClaimTransaction {
    const { reader } = options;

    const { type, version } = super.deserializeTransactionBaseStartWireBase(options);

    if (type !== TransactionType.Claim) {
      throw new InvalidFormatError(`Expected transaction type to be ${TransactionType.Claim}. Received: ${type}`);
    }

    const claims = reader.readArray(() => Input.deserializeWireBase(options));

    const { attributes, inputs, outputs, scripts } = super.deserializeTransactionBaseEndWireBase(options);

    return new this({
      version,
      claims,
      attributes,
      inputs,
      outputs,
      scripts,
    });
  }

  public readonly claims!: readonly Input[];
  protected readonly sizeExclusive: () => number = utils.lazy(
    () => IOHelper.sizeOfUInt8 + IOHelper.sizeOfArray(this.claims, (claim) => claim.size),
  );
  private readonly claimGetScriptHashesForVerifyingInternal: (
    options: TransactionGetScriptHashesForVerifyingOptions,
  ) => Promise<Set<UInt160Hex>>;

  public constructor(add: ClaimTransactionAdd) {
    super(add);

    const getScriptHashesForVerifying = super.getScriptHashesForVerifying.bind(this);
    this.claimGetScriptHashesForVerifyingInternal = utils.lazyAsync(
      async (options: TransactionGetScriptHashesForVerifyingOptions) => {
        const { getOutput } = options;
        const [hashesSet, hashes] = await Promise.all([
          getScriptHashesForVerifying(options),
          Promise.all(
            this.claims.map(async (claim) => {
              const output = await getOutput(claim);

              return common.uInt160ToHex(output.address);
            }),
          ),
        ]);

        return new Set([...hashesSet, ...hashes]);
      },
    );
  }

  public async getNetworkFee(_context: FeeContext): Promise<BN> {
    return utils.ZERO;
  }

  public async getClaimReferences({ getOutput }: GetReferencesOptions): Promise<readonly Output[]> {
    return Promise.all(this.claims.map(async (input) => getOutput(input)));
  }

  public async getScriptHashesForVerifying(
    options: TransactionGetScriptHashesForVerifyingOptions,
  ): Promise<Set<UInt160Hex>> {
    return this.claimGetScriptHashesForVerifyingInternal(options);
  }

  public async verify(options: TransactionVerifyOptions): Promise<readonly VerifyScriptResult[]> {
    const [results] = await Promise.all([super.verify(options), this.verifyInternal(options)]);

    return results;
  }

  public async serializeJSON(context: SerializeJSONContext): Promise<ClaimTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(context);

    return {
      ...transactionBaseJSON,
      type: 'ClaimTransaction',
      claims: this.claims.map((claim) => claim.serializeJSON(context)),
    };
  }

  private async verifyInternal(options: TransactionVerifyOptions): Promise<void> {
    const { calculateClaimAmount, getOutput, utilityToken, memPool = [] } = options;
    if (hasDuplicateInputs(this.claims)) {
      throw new VerifyError('Duplicate claims');
    }

    if (
      memPool.some(
        (transaction) =>
          transaction instanceof ClaimTransaction &&
          transaction.type === TransactionType.Claim &&
          hasIntersectingInputs(this.claims, transaction.claims),
      )
    ) {
      throw new VerifyError('Duplicate claims in mempool');
    }
    const [results, claimAmount] = await Promise.all([
      this.getTransactionResults({ getOutput }),
      calculateClaimAmount(this.claims).catch((error) => {
        throw new VerifyError(`Invalid claims: ${error.message}`);
      }),
    ]);

    // tslint:disable-next-line no-unused
    const result = Object.entries(results).find(([assetHex, _value]) =>
      common.uInt256Equal(common.hexToUInt256(assetHex), utilityToken.hash),
    );

    if (result === undefined || result[1].gt(utils.ZERO)) {
      throw new VerifyError('Invalid claim value');
    }

    if (!claimAmount.eq(result[1].neg())) {
      throw new VerifyError('Invalid claim value');
    }
  }
}
