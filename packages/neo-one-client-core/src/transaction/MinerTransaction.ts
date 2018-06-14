import BN from 'bn.js';
import { common } from '../common';
import { InvalidFormatError, VerifyError } from '../errors';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { BinaryWriter, IOHelper, utils } from '../utils';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import {
  FeeContext,
  TransactionBase,
  TransactionBaseAdd,
  TransactionBaseJSON,
  TransactionVerifyOptions,
} from './TransactionBase';
import { TransactionType } from './TransactionType';

export interface MinerTransactionAdd extends TransactionBaseAdd {
  readonly nonce: number;
}

export interface MinerTransactionJSON extends TransactionBaseJSON {
  readonly type: 'MinerTransaction';
  readonly nonce: number;
}

export class MinerTransaction extends TransactionBase<TransactionType.Miner, MinerTransactionJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): MinerTransaction {
    const { reader } = options;
    const { type, version } = super.deserializeTransactionBaseStartWireBase(options);

    if (type !== TransactionType.Miner) {
      throw new InvalidFormatError();
    }

    const nonce = reader.readUInt32LE();

    const { attributes, inputs, outputs, scripts } = super.deserializeTransactionBaseEndWireBase(options);

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
  protected readonly sizeExclusive: () => number = utils.lazy(() => IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt32LE);

  public constructor({ version, attributes, inputs, outputs, scripts, hash, nonce }: MinerTransactionAdd) {
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
    scripts = this.scripts,
    attributes = this.attributes,
  }: {
    readonly scripts?: ReadonlyArray<Witness>;
    readonly attributes?: ReadonlyArray<Attribute>;
  }): MinerTransaction {
    return new MinerTransaction({
      version: this.version,
      attributes,
      inputs: this.inputs,
      outputs: this.outputs,
      scripts,
      nonce: this.nonce,
    });
  }

  public serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeUInt32LE(this.nonce);
  }

  public async serializeJSON(context: SerializeJSONContext): Promise<MinerTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(context);

    return {
      ...transactionBaseJSON,
      type: 'MinerTransaction',
      nonce: this.nonce,
    };
  }

  public async getNetworkFee(_context: FeeContext): Promise<BN> {
    return utils.ZERO;
  }

  public async verify(options: TransactionVerifyOptions): Promise<void> {
    await Promise.all([super.verify(options), this.verifyInternal(options)]);
  }

  private async verifyInternal(options: TransactionVerifyOptions): Promise<void> {
    const { getOutput, utilityToken } = options;
    const results = await this.getTransactionResults({ getOutput });
    // tslint:disable-next-line no-unused
    const resultsIssue = Object.entries(results).filter(([_, value]) => value.lt(utils.ZERO));

    // tslint:disable-next-line no-unused
    if (resultsIssue.some(([assetHex, _]) => !common.uInt256Equal(common.hexToUInt256(assetHex), utilityToken.hash))) {
      throw new VerifyError('Invalid miner result');
    }
  }
}
