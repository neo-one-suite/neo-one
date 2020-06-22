import { BinaryWriter } from '../../../BinaryWriter';
import { UInt256 } from '../../../common';
import { AttributeBaseModel } from './AttributeBaseModel';
import { AttributeUsageModel } from './AttributeUsageModel';

export type UInt256AttributeUsageModel =
  | AttributeUsageModel.ContractHash
  | AttributeUsageModel.Vote
  | AttributeUsageModel.Hash1
  | AttributeUsageModel.Hash2
  | AttributeUsageModel.Hash3
  | AttributeUsageModel.Hash4
  | AttributeUsageModel.Hash5
  | AttributeUsageModel.Hash6
  | AttributeUsageModel.Hash7
  | AttributeUsageModel.Hash8
  | AttributeUsageModel.Hash9
  | AttributeUsageModel.Hash10
  | AttributeUsageModel.Hash11
  | AttributeUsageModel.Hash12
  | AttributeUsageModel.Hash13
  | AttributeUsageModel.Hash14
  | AttributeUsageModel.Hash15;

export interface UInt256AttributeModelAdd {
  readonly usage: UInt256AttributeUsageModel;
  readonly value: UInt256;
}

export class UInt256AttributeModel extends AttributeBaseModel<UInt256AttributeUsageModel, UInt256> {
  public readonly usage: UInt256AttributeUsageModel;
  public readonly value: UInt256;

  public constructor({ usage, value }: UInt256AttributeModelAdd) {
    super();
    this.usage = usage;
    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt256(this.value);
  }
}
