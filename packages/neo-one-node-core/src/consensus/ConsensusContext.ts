import { common, ECPoint, UInt256, UInt256Hex } from '@neo-one/client-common';
import { BN } from 'bn.js';
import _ from 'lodash';
import { Block } from '../Block';
import { ConsensusData } from '../ConsensusData';
import { ChangeViewConsensusMessage, ConsensusPayload } from '../payload';
import { DeserializeWireBaseOptions } from '../Serializable';
import { Transaction } from '../transaction';
import { TransactionVerificationContext } from '../TransactionVerificationContext';
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
  readonly preparationPayloads?: ReadonlyArray<ConsensusPayload | undefined>;
  readonly commitPayloads?: ReadonlyArray<ConsensusPayload | undefined>;
  readonly changeViewPayloads?: ReadonlyArray<ConsensusPayload | undefined>;
  readonly lastChangeViewPayloads?: ReadonlyArray<ConsensusPayload | undefined>;
  readonly lastSeenMessage?: readonly number[];
  readonly transactions?: { readonly [hash: string]: Transaction | undefined };
  readonly transactionHashes?: readonly UInt256[];
  readonly witnessSize?: number;
}

// tslint:disable-next-line no-any
export class ConsensusContext {
  public static deserializeWireBase(options: DeserializeWireBaseOptions) {
    const { reader } = options;
    const version = reader.readUInt32LE();
    const index = reader.readUInt32LE();
    const timestamp = reader.readUInt64LE();

    const nextConsensusIn = reader.readUInt160();
    const nextConsensus = nextConsensusIn.equals(common.ZERO_UINT160) ? undefined : nextConsensusIn;

    const consensusData = ConsensusData.deserializeWireBase(options);
    const viewNumber = reader.readInt8();
    const transactionHashes = reader.readArray(() => reader.readUInt256());
    const transactions = reader.readArray(
      () => Transaction.deserializeWireBase(options),
      Block.MaxTransactionsPerBlock,
    );

    // TODO: before we implement the rest of this see if reloading and saving is even necessary
  }
  public readonly viewNumber: number;
  public readonly myIndex: number;
  public readonly validators: readonly ECPoint[];
  public readonly blockReceivedTimeMS: number;
  public readonly verificationContext: TransactionVerificationContext;
  public readonly preparationPayloads: ReadonlyArray<ConsensusPayload | undefined>;
  public readonly commitPayloads: ReadonlyArray<ConsensusPayload | undefined>;
  public readonly changeViewPayloads: ReadonlyArray<ConsensusPayload | undefined>;
  public readonly lastChangeViewPayloads: ReadonlyArray<ConsensusPayload | undefined>;
  public readonly lastSeenMessage: readonly number[];
  public readonly transactions: { readonly [hash: string]: Transaction | undefined };
  public readonly transactionHashes?: readonly UInt256[];
  public readonly transactionHashesSet: Set<UInt256Hex>;
  public readonly blockBuilder: BlockBuilder;
  public readonly witnessSize: number;

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
    lastSeenMessage = [],
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
    return this.lastSeenMessage.reduce((acc, val) => acc + (val < (this.blockBuilder.index ?? 0) - 1 ? 1 : 0), 0);
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
    const newViewNumber = this.changeViewPayloads[this.myIndex]?.getDeserializedMessage<ChangeViewConsensusMessage>()
      .newViewNumber;

    if (newViewNumber === undefined) {
      return false;
    }

    return !this.watchOnly && newViewNumber > this.viewNumber;
  }

  public get notAcceptingPayloadsDueToViewChanging() {
    return this.viewChanging && !this.moreThanFNodesCommittedOrLost;
  }

  public clone({
    viewNumber,
    myIndex,
    validators,
    blockReceivedTimeMS,
    verificationContext,
    blockOptions,
    preparationPayloads,
    commitPayloads,
    changeViewPayloads,
    lastChangeViewPayloads,
    transactions,
    transactionHashes,
  }: Partial<ConsensusContextAdd>) {
    return new ConsensusContext({
      viewNumber: viewNumber ?? this.viewNumber,
      myIndex: myIndex ?? this.myIndex,
      validators: validators ?? this.validators,
      blockReceivedTimeMS: blockReceivedTimeMS ?? this.blockReceivedTimeMS,
      verificationContext: verificationContext ?? this.verificationContext,
      blockOptions: blockOptions === undefined ? this.blockBuilder : this.blockBuilder.clone(blockOptions),
      preparationPayloads: preparationPayloads ?? this.preparationPayloads,
      commitPayloads: commitPayloads ?? this.commitPayloads,
      changeViewPayloads: changeViewPayloads ?? this.changeViewPayloads,
      lastChangeViewPayloads: lastChangeViewPayloads ?? this.lastChangeViewPayloads,
      transactions: transactions ?? this.transactions,
      transactionHashes: transactionHashes ?? this.transactionHashes,
    });
  }

  public toJSON(): object {
    return {
      block: this.blockBuilder.toJSON(),
      viewNumber: this.viewNumber,
      myIndex: this.myIndex,
      expectedView: [...this.expectedView],
      validators: this.validators.map((validator) => common.ecPointToString(validator)),
      blockReceivedTimeMS: this.blockReceivedTimeMS,
      transactions: _.fromPairs(Object.entries(this.transactions).map(([hash, tx]) => [hash, tx?.serializeJSON()])),
    };
  }
}
