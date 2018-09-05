import { BN } from 'bn.js';
import { common, UInt160Hex } from '../common';
import { InvalidFormatError, VerifyError } from '../errors';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { BinaryWriter, IOHelper, utils } from '../utils';
import { VerifyScriptResult } from '../vm';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import { hasDuplicateInputs, hasIntersectingInputs } from './common';
import { Input, InputJSON } from './Input';
import { Output } from './Output';
import {
  FeeContext,
  TransactionBase,
  TransactionBaseAdd,
  TransactionBaseJSON,
  TransactionGetScriptHashesForVerifyingOptions,
  TransactionVerifyOptions,
} from './TransactionBase';
import { TransactionType } from './TransactionType';

export interface ClaimTransactionAdd extends TransactionBaseAdd {
  readonly claims: ReadonlyArray<Input>;
}

export interface ClaimTransactionJSON extends TransactionBaseJSON {
  readonly type: 'ClaimTransaction';
  readonly claims: ReadonlyArray<InputJSON>;
}

export class ClaimTransaction extends TransactionBase<TransactionType.Claim, ClaimTransactionJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ClaimTransaction {
    const { reader } = options;

    const { type, version } = super.deserializeTransactionBaseStartWireBase(options);

    if (type !== TransactionType.Claim) {
      throw new InvalidFormatError();
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

  public readonly claims: ReadonlyArray<Input>;
  protected readonly sizeExclusive: () => number = utils.lazy(
    () => IOHelper.sizeOfUInt8 + IOHelper.sizeOfArray(this.claims, (claim) => claim.size),
  );
  private readonly claimGetScriptHashesForVerifyingInternal: (
    options: TransactionGetScriptHashesForVerifyingOptions,
  ) => Promise<Set<UInt160Hex>>;

  public constructor({ version, attributes, inputs, outputs, scripts, hash, claims }: ClaimTransactionAdd) {
    super({
      version,
      type: TransactionType.Claim,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });

    this.claims = claims;

    if (this.version !== 0) {
      throw new InvalidFormatError();
    }

    if (this.claims.length === 0) {
      throw new InvalidFormatError();
    }

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

  public clone({
    scripts = this.scripts,
    attributes = this.attributes,
    inputs = this.inputs,
    outputs = this.outputs,
  }: {
    readonly scripts?: ReadonlyArray<Witness>;
    readonly attributes?: ReadonlyArray<Attribute>;
    readonly inputs?: ReadonlyArray<Input>;
    readonly outputs?: ReadonlyArray<Output>;
  }): ClaimTransaction {
    return new ClaimTransaction({
      version: this.version,
      attributes,
      inputs,
      outputs,
      scripts,
      claims: this.claims,
    });
  }

  public serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeArray(this.claims, (claim) => {
      claim.serializeWireBase(writer);
    });
  }

  public async getNetworkFee(_context: FeeContext): Promise<BN> {
    return utils.ZERO;
  }

  public async getScriptHashesForVerifying(
    options: TransactionGetScriptHashesForVerifyingOptions,
  ): Promise<Set<UInt160Hex>> {
    return this.claimGetScriptHashesForVerifyingInternal(options);
  }

  public async verify(options: TransactionVerifyOptions): Promise<ReadonlyArray<VerifyScriptResult>> {
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
