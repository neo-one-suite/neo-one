import { common, crypto, ECPoint, UInt256, UInt256Hex } from '@neo-one/client-common';
import { ConsensusMessage, deserializeConsensusMessageWire, ExtensiblePayload } from '../payload';
import { DeserializeWireBaseOptions } from '../Serializable';
import { Transaction } from '../transaction';
import { TransactionVerificationContext } from '../TransactionVerificationContext';
import { Witness } from '../Witness';
import { BlockBuilder, BlockPartial } from './BlockBuilder';

export const getF = (validatorsLength: number) => Math.floor((validatorsLength - 1) / 3);
export const getM = (validatorsLength: number) => validatorsLength - getF(validatorsLength);

export interface ConsensusContextAdd {
  readonly viewNumber: number;
  readonly myIndex: number;
  readonly validators: readonly ECPoint[];
  readonly blockReceivedTimeMS: number;
  readonly verificationContext: TransactionVerificationContext;
  readonly blockOptions: BlockPartial;
  readonly preparationPayloads?: ReadonlyArray<ExtensiblePayload | undefined>;
  readonly commitPayloads?: ReadonlyArray<ExtensiblePayload | undefined>;
  readonly changeViewPayloads?: ReadonlyArray<ExtensiblePayload | undefined>;
  readonly lastChangeViewPayloads?: ReadonlyArray<ExtensiblePayload | undefined>;
  readonly lastSeenMessage?: { readonly [key: string]: number | undefined };
  readonly transactions?: { readonly [hash: string]: Transaction | undefined };
  readonly transactionHashes?: readonly UInt256[];
  readonly witnessSize?: number;
}

// tslint:disable-next-line no-any
export class ConsensusContext {
  public get F(): number {
    return getF(this.validators.length);
  }

  public get M(): number {
    return getM(this.validators.length);
  }

  public get isPrimary(): boolean {
    return this.myIndex === this.blockBuilder.consensusData?.primaryIndex;
  }

  public get isBackup(): boolean {
    return this.myIndex >= 0 && !this.isPrimary;
  }

  public get watchOnly(): boolean {
    return this.myIndex < 0;
  }

  public get countCommitted(): number {
    return this.commitPayloads.reduce((acc, p) => acc + (p === undefined ? 0 : 1), 0);
  }

  public get countFailed(): number {
    if (Object.values(this.lastSeenMessage).length === 0) {
      return 0;
    }

    return this.validators.reduce((acc, validator) => {
      const count = this.lastSeenMessage[common.ecPointToHex(validator)];
      if (count === undefined) {
        return acc + 1;
      }

      return acc + (count < (this.blockBuilder.index ?? 0) - 1 ? 1 : 0);
    }, 0);
  }

  public get moreThanFNodesCommittedOrLost(): boolean {
    return this.countCommitted + this.countFailed > this.F;
  }

  public get requestSentOrReceived(): boolean {
    const maybeIndex = this.blockBuilder.consensusData?.primaryIndex;
    if (maybeIndex === undefined) {
      return false;
    }

    return this.preparationPayloads[maybeIndex] !== undefined;
  }

  public get responseSent(): boolean {
    return !this.watchOnly && this.preparationPayloads[this.myIndex] !== undefined;
  }

  public get commitSent(): boolean {
    return !this.watchOnly && this.commitPayloads[this.myIndex] !== undefined;
  }

  public get blockSent(): boolean {
    return this.blockBuilder.transactions !== undefined;
  }

  public get viewChanging(): boolean {
    const messageIn = this.changeViewPayloads[this.myIndex];
    if (messageIn === undefined) {
      return false;
    }
    const newViewNumber = this.getMessage(messageIn).viewNumber;

    return !this.watchOnly && newViewNumber > this.viewNumber;
  }

  public get notAcceptingPayloadsDueToViewChanging() {
    return this.viewChanging && !this.moreThanFNodesCommittedOrLost;
  }
  public static deserializeWireBase(_options: DeserializeWireBaseOptions) {
    throw new Error('ConsensusContext deserialize not yet implemented');
  }
  public readonly viewNumber: number;
  public readonly myIndex: number;
  public readonly validators: readonly ECPoint[];
  public readonly blockReceivedTimeMS: number;
  public readonly verificationContext: TransactionVerificationContext;
  public readonly preparationPayloads: ReadonlyArray<ExtensiblePayload | undefined>;
  public readonly commitPayloads: ReadonlyArray<ExtensiblePayload | undefined>;
  public readonly changeViewPayloads: ReadonlyArray<ExtensiblePayload | undefined>;
  public readonly lastChangeViewPayloads: ReadonlyArray<ExtensiblePayload | undefined>;
  public readonly lastSeenMessage: { readonly [key: string]: number | undefined };
  public readonly transactions: { readonly [hash: string]: Transaction | undefined };
  public readonly transactionHashes?: readonly UInt256[];
  public readonly transactionHashesSet: Set<UInt256Hex>;
  public readonly blockBuilder: BlockBuilder;
  public readonly witnessSize: number;
  // tslint:disable-next-line: readonly-keyword
  private readonly mutableCachedMessages: { [hash: string]: ConsensusMessage | undefined } = {};

  public constructor({
    viewNumber,
    myIndex,
    validators,
    blockReceivedTimeMS,
    verificationContext,
    blockOptions,
    preparationPayloads = [],
    commitPayloads = [],
    changeViewPayloads = [],
    lastChangeViewPayloads = [],
    lastSeenMessage = {},
    transactions = {},
    transactionHashes,
    witnessSize = 0,
  }: ConsensusContextAdd) {
    this.viewNumber = viewNumber;
    this.myIndex = myIndex;
    this.validators = validators;
    this.blockReceivedTimeMS = blockReceivedTimeMS;
    this.verificationContext = verificationContext;
    this.blockBuilder = new BlockBuilder(blockOptions);
    this.preparationPayloads = preparationPayloads;
    this.commitPayloads = commitPayloads;
    this.changeViewPayloads = changeViewPayloads;
    this.lastChangeViewPayloads = lastChangeViewPayloads;
    this.lastSeenMessage = lastSeenMessage;
    this.transactions = transactions;
    this.transactionHashes = transactionHashes;
    this.transactionHashesSet = new Set(transactionHashes?.map(common.uInt256ToHex));
    this.witnessSize = witnessSize;
  }

  public getMessage<T extends ConsensusMessage>(payload: ExtensiblePayload): T {
    const maybeMessage = this.mutableCachedMessages[common.uInt256ToString(payload.hash)];
    if (maybeMessage !== undefined) {
      return maybeMessage as T;
    }

    const message = deserializeConsensusMessageWire({
      buffer: payload.data,
      context: { messageMagic: payload.magic, validatorsCount: this.validators.length },
    });
    // tslint:disable-next-line: no-object-mutation
    this.mutableCachedMessages[common.uInt256ToString(payload.hash)] = message;

    return message as T;
  }

  public createPayload(message: ConsensusMessage, magic: number, invocationScript: Buffer) {
    const payload = new ExtensiblePayload({
      category: 'dBFT',
      validBlockStart: 0,
      validBlockEnd: message.blockIndex,
      sender: this.getSender(message.validatorIndex),
      data: message.serializeWire(),
      witness: new Witness({
        invocation: invocationScript,
        verification: crypto.createSignatureRedeemScript(this.validators[message.validatorIndex]),
      }),
      messageMagic: magic,
    });

    this.mutableCachedMessages[common.uInt256ToString(payload.hash)] = message;

    return payload;
  }

  public clone(options: Partial<ConsensusContextAdd>) {
    const { blockOptions, ...rest } = options;
    const consensusData = blockOptions?.consensusData;
    const newConsensusData = consensusData
      ? {
          ...this.blockBuilder.consensusData,
          ...consensusData,
        }
      : this.blockBuilder.consensusData;

    return new ConsensusContext({
      viewNumber: this.viewNumber,
      myIndex: this.myIndex,
      validators: this.validators,
      blockReceivedTimeMS: this.blockReceivedTimeMS,
      verificationContext: this.verificationContext,
      blockOptions:
        blockOptions === undefined
          ? this.blockBuilder
          : {
              ...this.blockBuilder,
              ...blockOptions,
              consensusData: newConsensusData,
            },
      preparationPayloads: this.preparationPayloads,
      commitPayloads: this.commitPayloads,
      changeViewPayloads: this.changeViewPayloads,
      lastChangeViewPayloads: this.lastChangeViewPayloads,
      transactions: this.transactions,
      transactionHashes: this.transactionHashes,
      lastSeenMessage: this.lastSeenMessage,
      ...rest,
    });
  }

  public getSender(index: number) {
    return common.bufferToUInt160(crypto.createSignatureRedeemScript(this.validators[index]));
  }

  public toJSON(): object {
    throw new Error('ConsensusContext.toJSON not implemented');
  }
}
