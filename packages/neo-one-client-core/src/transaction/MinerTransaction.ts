import BN from 'bn.js';
import { TransactionType } from './TransactionType';
import { Attribute } from './attribute';
import {
  DeserializeWireBaseOptions,
  SerializeJSONContext,
} from '../Serializable';
import {
  TransactionBase,
  FeeContext,
  TransactionBaseAdd,
  TransactionBaseJSON,
  TransactionVerifyOptions,
} from './TransactionBase';
import { InvalidFormatError, VerifyError } from '../errors';
import { Witness } from '../Witness';
import { common } from '../common';
import { utils, BinaryWriter, IOHelper } from '../utils';

export interface MinerTransactionAdd extends TransactionBaseAdd {
  nonce: number;
}

export interface MinerTransactionJSON extends TransactionBaseJSON {
  type: 'MinerTransaction';
  nonce: number;
}

export class MinerTransaction extends TransactionBase<
  TransactionType.Miner,
  MinerTransactionJSON
> {
  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): MinerTransaction {
    const { reader } = options;
    const { type, version } = super.deserializeTransactionBaseStartWireBase(
      options,
    );

    if (type !== TransactionType.Miner) {
      throw new InvalidFormatError();
    }

    const nonce = reader.readUInt32LE();

    const {
      attributes,
      inputs,
      outputs,
      scripts,
    } = super.deserializeTransactionBaseEndWireBase(options);

    return new this({
      version,
      attributes,
      inputs,
      outputs,
      scripts,
      nonce,
    });
  }

  public readonly nonce: number;
  protected readonly sizeExclusive: () => number = utils.lazy(
    () => IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt32LE,
  );

  constructor({
    version,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
    nonce,
  }: MinerTransactionAdd) {
    super({
      version,
      type: TransactionType.Miner,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });

    this.nonce = nonce;

    if (this.version !== 0) {
      throw new InvalidFormatError();
    }
  }

  public clone({
    scripts,
    attributes,
  }: {
    scripts?: Witness[];
    attributes?: Attribute[];
  }): MinerTransaction {
    return new MinerTransaction({
      version: this.version,
      attributes: attributes || this.attributes,
      inputs: this.inputs,
      outputs: this.outputs,
      scripts: scripts || this.scripts,
      nonce: this.nonce,
    });
  }

  public serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeUInt32LE(this.nonce);
  }

  public async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<MinerTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(
      context,
    );

    return {
      ...transactionBaseJSON,
      type: 'MinerTransaction',
      nonce: this.nonce,
    };
  }

  public async getNetworkFee(context: FeeContext): Promise<BN> {
    return utils.ZERO;
  }

  public async verify(options: TransactionVerifyOptions): Promise<void> {
    await Promise.all([super.verify(options), this.verifyInternal(options)]);
  }

  private async verifyInternal(
    options: TransactionVerifyOptions,
  ): Promise<void> {
    const { getOutput, utilityToken } = options;
    const results = await this.getTransactionResults({ getOutput });
    const resultsIssue = Object.entries(results).filter(([_, value]) =>
      value.lt(utils.ZERO),
    );

    if (
      resultsIssue.some(
        ([assetHex, _]) =>
          !common.uInt256Equal(
            common.hexToUInt256(assetHex),
            utilityToken.hash,
          ),
      )
    ) {
      throw new VerifyError('Invalid miner result');
    }
  }
}
