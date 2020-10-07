import { Constructor } from '@neo-one/utils';
import BN from 'bn.js';
import { BinaryWriter } from '../../BinaryWriter';
import { ECPoint, PrivateKey } from '../../common';
import { crypto } from '../../crypto';
import { SerializableWire } from '../Serializable';
import { SignerModel } from '../SignerModel';
import { WitnessModel } from '../WitnessModel';
import { AttributeModel } from './attribute';
import {
  FeelessTransactionModel,
  FeelessTransactionModelAdd,
  TransactionConsensusOptions,
} from './FeelessTransactionModel';

export interface TransactionModelAdd<
  TAttribute extends AttributeModel = AttributeModel,
  TWitness extends WitnessModel = WitnessModel,
  TSigner extends SignerModel = SignerModel
> extends FeelessTransactionModelAdd<TAttribute, TWitness, TSigner> {
  readonly systemFee: BN;
  readonly networkFee: BN;
}

export class TransactionModel<
    TAttribute extends AttributeModel = AttributeModel,
    TWitness extends WitnessModel = WitnessModel,
    TSigner extends SignerModel = SignerModel
  >
  extends FeelessTransactionModel<TAttribute, TWitness, TSigner>
  implements SerializableWire {
  protected static readonly WitnessConstructor: Constructor<WitnessModel> = WitnessModel;

  public readonly systemFee: BN;
  public readonly networkFee: BN;

  public constructor({
    version,
    nonce,
    attributes = [],
    witnesses = [],
    signers = [],
    validUntilBlock,
    script,
    hash,
    systemFee,
    networkFee,
  }: TransactionModelAdd<TAttribute, TWitness, TSigner>) {
    super({
      version,
      nonce,
      attributes,
      witnesses,
      signers,
      validUntilBlock,
      script,
      hash,
    });

    this.systemFee = systemFee;
    this.networkFee = networkFee;
  }

  public clone(
    options: { readonly witnesses?: readonly TWitness[] } = {},
  ): TransactionModel<TAttribute, TWitness, TSigner> {
    return new TransactionModel<TAttribute, TWitness, TSigner>({
      version: this.version,
      attributes: this.attributes,
      signers: this.signers,
      script: this.script,
      hash: this.hash,
      witnesses: options.witnesses ? options.witnesses : this.witnesses,
      systemFee: this.systemFee,
      networkFee: this.networkFee,
      nonce: this.nonce,
      validUntilBlock: this.validUntilBlock,
    });
  }

  public cloneWithConsensusOptions(
    options: TransactionConsensusOptions,
  ): TransactionModel<TAttribute, TWitness, TSigner> {
    // tslint:disable-next-line: no-any
    return new TransactionModel<TAttribute, TWitness, TSigner>({
      version: this.version,
      attributes: this.attributes,
      signers: this.signers,
      script: this.script,
      hash: this.hash,
      witnesses: this.witnesses,
      systemFee: this.systemFee,
      networkFee: this.networkFee,
      nonce: options.nonce,
      validUntilBlock: options.validUntilBlock,
    });
  }

  public sign(key: PrivateKey): TransactionModel<TAttribute, TWitness, TSigner> {
    return this.clone({
      witnesses: this.witnesses.concat([
        // tslint:disable-next-line no-any
        crypto.createWitness(this.serializeUnsigned(), key, (this.constructor as any).WitnessConstructor),
      ]),
    });
  }

  public signWithSignature(signature: Buffer, publicKey: ECPoint): TransactionModel<TAttribute, TWitness, TSigner> {
    return this.clone({
      witnesses: this.witnesses.concat([
        // tslint:disable-next-line no-any
        crypto.createWitnessForSignature(signature, publicKey, (this.constructor as any).WitnessConstructor),
      ]),
    });
  }

  public serializeUnsignedBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeUInt32LE(this.nonce);
    writer.writeUInt64LE(this.systemFee);
    writer.writeUInt64LE(this.networkFee);
    writer.writeUInt32LE(this.validUntilBlock);
    writer.writeArray(this.signers, (signer) => {
      signer.serializeWireBase(writer);
    });
    writer.writeArray(this.attributes, (attribute) => {
      attribute.serializeWireBase(writer);
    });
    writer.writeVarBytesLE(this.script);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    this.serializeUnsignedBase(writer);
    writer.writeArray(this.witnesses, (witness) => {
      witness.serializeWireBase(writer);
    });
  }
}
