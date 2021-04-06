import { BinaryReader, BinaryWriter, common, createSerializeWire, UInt256 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import _ from 'lodash';
import { ConsensusContext } from '../../consensus/ConsensusContext';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from '../../Serializable';
import { ChangeViewPayloadCompact } from '../ChangeViewPayloadCompact';
import { CommitPayloadCompact } from '../CommitPayloadCompact';
import { ExtensiblePayload } from '../ExtensiblePayload';
import { PreparationPayloadCompact } from '../PreparationPayloadCompact';
import { ChangeViewConsensusMessage } from './ChangeViewConsensusMessage';
import { ChangeViewReason } from './ChangeViewReason';
import { CommitConsensusMessage } from './CommitConsensusMessage';
import { ConsensusMessageBase, ConsensusMessageBaseAdd } from './ConsensusMessageBase';
import { ConsensusMessageType } from './ConsensusMessageType';
import { PrepareRequestConsensusMessage } from './PrepareRequestConsensusMessage';
import { PrepareResponseConsensusMessage } from './PrepareResponseConsensusMessage';

export interface RecoveryConsensusMessageAdd extends ConsensusMessageBaseAdd {
  readonly prepareRequestMessage?: PrepareRequestConsensusMessage;
  readonly preparationHash?: UInt256;
  readonly changeViewMessages: _.NumericDictionary<ChangeViewPayloadCompact>;
  readonly preparationMessages: _.NumericDictionary<PreparationPayloadCompact>;
  readonly commitMessages: _.NumericDictionary<CommitPayloadCompact>;
}

export class RecoveryConsensusMessage extends ConsensusMessageBase {
  public static deserializeWireBase(
    options: DeserializeWireBaseOptions & { readonly validatorsCount: number },
  ): RecoveryConsensusMessage {
    const { reader } = options;
    const { viewNumber, blockIndex, validatorIndex } = super.deserializeConsensusMessageBaseWireBase(options);
    const changeViewMessagesIn = reader.readArray(
      () => ChangeViewPayloadCompact.deserializeWireBase(options),
      options.validatorsCount,
    );
    let prepareRequestMessage: PrepareRequestConsensusMessage | undefined;
    let preparationHash: UInt256 | undefined;
    if (reader.readBoolean()) {
      prepareRequestMessage = PrepareRequestConsensusMessage.deserializeWireBase(options);
    } else if (reader.readVarUIntLE(new BN(common.UINT256_BUFFER_BYTES)).toNumber() === common.UINT256_BUFFER_BYTES) {
      preparationHash = reader.readUInt256();
    }
    const preparationMessagesIn = reader.readArray(
      () => PreparationPayloadCompact.deserializeWireBase(options),
      options.validatorsCount,
    );

    const commitMessagesIn = reader.readArray(
      () => CommitPayloadCompact.deserializeWireBase(options),
      options.validatorsCount,
    );

    const changeViewMessages = _.fromPairs(
      changeViewMessagesIn.map((changeView) => [changeView.validatorIndex, changeView]),
    );
    const preparationMessages = _.fromPairs(
      preparationMessagesIn.map((preparation) => [preparation.validatorIndex, preparation]),
    );
    const commitMessages = _.fromPairs(commitMessagesIn.map((commit) => [commit.validatorIndex, commit]));

    return new RecoveryConsensusMessage({
      viewNumber,
      blockIndex,
      validatorIndex,
      prepareRequestMessage,
      preparationHash,
      changeViewMessages,
      preparationMessages,
      commitMessages,
    });
  }

  public static deserializeWire(
    options: DeserializeWireOptions & { readonly validatorsCount: number },
  ): RecoveryConsensusMessage {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
      validatorsCount: options.validatorsCount,
    });
  }

  public readonly prepareRequestMessage?: PrepareRequestConsensusMessage;
  public readonly preparationHash?: UInt256;
  public readonly changeViewMessages: _.NumericDictionary<ChangeViewPayloadCompact>;
  public readonly preparationMessages: _.NumericDictionary<PreparationPayloadCompact>;
  public readonly commitMessages: _.NumericDictionary<CommitPayloadCompact>;
  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({
    viewNumber,
    blockIndex,
    validatorIndex,
    prepareRequestMessage,
    preparationHash,
    changeViewMessages,
    preparationMessages,
    commitMessages,
  }: RecoveryConsensusMessageAdd) {
    super({ type: ConsensusMessageType.RecoveryMessage, viewNumber, blockIndex, validatorIndex });

    this.prepareRequestMessage = prepareRequestMessage;
    this.preparationHash = preparationHash;
    this.changeViewMessages = changeViewMessages;
    this.preparationMessages = preparationMessages;
    this.commitMessages = commitMessages;
  }

  public serializeWireBase(writer: BinaryWriter) {
    super.serializeWireBase(writer);
    writer.writeArray(Object.values(this.changeViewMessages), (message) => message.serializeWireBase(writer));
    writer.writeBoolean(this.prepareRequestMessage !== undefined);
    if (this.prepareRequestMessage !== undefined) {
      this.prepareRequestMessage.serializeWireBase(writer);
    } else if (this.preparationHash === undefined) {
      writer.writeVarUIntLE(0);
    } else {
      writer.writeVarBytesLE(this.preparationHash);
    }

    writer.writeArray(Object.values(this.preparationMessages), (message) => message.serializeWireBase(writer));
    writer.writeArray(Object.values(this.commitMessages), (message) => message.serializeWireBase(writer));
  }

  public getChangeViewPayloads(context: ConsensusContext, magic: number): readonly ExtensiblePayload[] {
    return Object.values(this.changeViewMessages).map((item: ChangeViewPayloadCompact) =>
      context.createPayload(
        new ChangeViewConsensusMessage({
          blockIndex: this.blockIndex,
          validatorIndex: item.validatorIndex,
          viewNumber: item.originalViewNumber,
          timestamp: item.timestamp,
          reason: ChangeViewReason.Timeout, // TODO: pretty sure this is wrong but also possible that this doesn't matter anyway
        }),
        magic,
        item.invocationScript,
      ),
    );
  }

  public getCommitPayloadsFromRecoveryMessage(context: ConsensusContext, magic: number): readonly ExtensiblePayload[] {
    return Object.values(this.commitMessages).map((item: CommitPayloadCompact) =>
      context.createPayload(
        new CommitConsensusMessage({
          blockIndex: this.blockIndex,
          validatorIndex: item.validatorIndex,
          viewNumber: item.viewNumber,
          signature: item.signature,
        }),
        magic,
        item.invocationScript,
      ),
    );
  }

  public getPrepareRequestPayload(context: ConsensusContext, magic: number): ExtensiblePayload | undefined {
    if (this.prepareRequestMessage === undefined) {
      return undefined;
    }

    const index = context.blockBuilder.primaryIndex;
    const maybePreparationMessage = this.preparationMessages[index];
    // tslint:disable-next-line: strict-type-predicates
    if (maybePreparationMessage === undefined) {
      return undefined;
    }

    return context.createPayload(this.prepareRequestMessage, magic, maybePreparationMessage.invocationScript);
  }

  public getPrepareResponsePayloads(context: ConsensusContext, magic: number): readonly ExtensiblePayload[] {
    const index = context.blockBuilder.primaryIndex;
    const preparationHash = this.preparationHash ?? context.preparationPayloads[index]?.hash;
    if (preparationHash === undefined) {
      return [];
    }

    return Object.values(this.preparationMessages)
      .filter((item: PreparationPayloadCompact) => item.validatorIndex !== index)
      .map((item: PreparationPayloadCompact) =>
        context.createPayload(
          new PrepareResponseConsensusMessage({
            blockIndex: this.blockIndex,
            validatorIndex: item.validatorIndex,
            viewNumber: this.viewNumber,
            preparationHash,
          }),
          magic,
          item.invocationScript,
        ),
      );
  }
}
