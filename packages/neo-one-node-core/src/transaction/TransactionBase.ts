import {
  common,
  ECPoint,
  // hasFlag,
  InvalidFormatError,
  IOHelper,
  JSONHelper,
  TransactionJSON,
  TransactionModel,
  TransactionModelAdd,
  // UInt160,
  UInt160Hex,
} from '@neo-one/client-common';
import { Constructor /*utils as commonUtils*/ } from '@neo-one/utils';
import { BN } from 'bn.js';
import _ from 'lodash';
import { Cosigner } from '../Cosigner';
import { Equals, EquatableKey } from '../Equatable';
// import { VerifyError } from '../errors';
import { RelayResultReason } from '../RelayResultReason';
// import { ScriptContainerType } from '../ScriptContainer';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
} from '../Serializable';
import { BinaryReader, utils } from '../utils';
import { Validator } from '../Validator';
import { VerifyScript /* VerifyScriptResult */ } from '../vm';
import { Witness } from '../Witness';
import { Attribute, /*AttributeUsage,*/ deserializeAttributeWireBase /*UInt160Attribute*/ } from './attribute';

export type TransactionAdd = TransactionModelAdd<Attribute, Witness, Cosigner>;

// export interface FeeContext {
//   readonly getOutput: (input: Input) => Promise<Output>;
//   readonly governingToken: RegisterTransaction;
//   readonly utilityToken: RegisterTransaction;
//   readonly fees: { [K in TransactionType]?: BN };
//   readonly registerValidatorFee: BN;
// }

// export interface GetReferencesOptions {
//   readonly getOutput: (key: OutputKey) => Promise<Output>;
// }

// export interface GetTransactionResultsOptions {
//   readonly getOutput: (key: OutputKey) => Promise<Output>;
// }

export interface TransactionVerifyOptions {
  // readonly tryGetAccount: (key: AccountKey) => Promise<Account | undefined>;
  readonly standbyValidators: readonly ECPoint[];
  readonly getAllValidators: () => Promise<readonly Validator[]>;
  readonly verifyScript: VerifyScript;
  readonly currentHeight: number;
  readonly registerValidatorFee: BN;
  readonly memPool?: readonly Transaction[];
}

export class Transaction extends TransactionModel<Attribute, Witness, Cosigner>
  implements EquatableKey<Transaction>, SerializableJSON<TransactionJSON> {
  public get size(): number {
    return this.sizeInternal();
  }

  public static deserializeUnsigned(options: DeserializeWireBaseOptions) {
    const { reader } = options;
    const version = reader.readUInt8();
    if (version > 0) {
      throw new InvalidFormatError(); // TODO
    }
    const nonce = reader.readUInt32LE();
    const sender = reader.readUInt160();
    const systemFee = reader.readUInt64LE();
    if (systemFee.ltn(0)) {
      throw new InvalidFormatError(); // TODO
    }
    // TODO
    // if (!(systemFee.mod(NativeContract.GAS.Factor)).eqn(0)) {
    //   throw new InvalidFormatError();
    // }
    const networkFee = reader.readUInt64LE();
    if (networkFee.ltn(0)) {
      throw new InvalidFormatError(); // TODO
    }
    if (systemFee.add(networkFee).lt(systemFee)) {
      throw new InvalidFormatError(); // TODO
    }
    const validUntilBlock = reader.readUInt32LE();
    const attributes = reader.readArray(
      () => deserializeAttributeWireBase(options),
      Transaction.maxTransactionAttributes,
    );
    const cosigners = reader.readArray(() => Cosigner.deserializeWireBase(options), Transaction.maxCosigners);
    // TODO is this how we check distinctness?
    // if ((new Set(cosigners)).size !== cosigners.length) {
    //   throw new InvalidFormatError();
    // }
    const script = reader.readVarBytesLE(utils.USHORT_MAX_NUMBER);

    return new this({
      version,
      nonce,
      sender,
      systemFee,
      networkFee,
      validUntilBlock,
      attributes,
      cosigners,
      script,
    });
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): Transaction {
    const unsignedTransaction = this.deserializeUnsigned(options);
    const { reader } = options;
    const witnesses = reader.readArray(() => Witness.deserializeWireBase(options));

    return new this({
      version: unsignedTransaction.version,
      nonce: unsignedTransaction.nonce,
      sender: unsignedTransaction.sender,
      systemFee: unsignedTransaction.systemFee,
      networkFee: unsignedTransaction.networkFee,
      validUntilBlock: unsignedTransaction.validUntilBlock,
      attributes: unsignedTransaction.attributes,
      cosigners: unsignedTransaction.cosigners,
      script: unsignedTransaction.script,
      witnesses,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions) {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  protected static readonly WitnessConstructor: Constructor<Witness> = Witness;

  public readonly getScriptHashesForVerifying: () => Set<UInt160Hex> = utils.lazy(() => {
    const senderHash = common.uInt160ToHex(this.sender);
    const cosignerHashes = this.cosigners.map((cosigner) => common.uInt160ToHex(cosigner.account));

    return new Set([senderHash, ...cosignerHashes]);
  });

  public readonly getSortedScriptHashesForVerifying = utils.lazy(() => [...this.getScriptHashesForVerifying()].sort());

  public readonly headerSize =
    IOHelper.sizeOfUInt8 +
    IOHelper.sizeOfUInt32LE +
    common.UINT160_BUFFER_BYTES +
    IOHelper.sizeOfUInt64LE +
    IOHelper.sizeOfUInt64LE +
    IOHelper.sizeOfUInt32LE;

  // private readonly getReferencesInternal = utils.lazyAsync(async ({ getOutput }: GetReferencesOptions) =>
  //   Promise.all(this.inputs.map(async (input) => getOutput(input))),
  // );

  // private readonly getTransactionResultsInternal = utils.lazyAsync(
  //   async ({ getOutput }: GetTransactionResultsOptions): Promise<{ readonly [K in string]?: BN }> => {
  //     const inputOutputs = await this.getReferences({ getOutput });
  //     const mutableResults: { [K in string]?: BN } = {};
  //     const addOutputs = (outputs: readonly Output[], negative?: boolean) => {
  //       outputs.forEach((output) => {
  //         const key = common.uInt256ToHex(output.asset);
  //         let result = mutableResults[key];
  //         if (result === undefined) {
  //           mutableResults[key] = result = utils.ZERO;
  //         }

  //         mutableResults[key] = result.add(negative === true ? output.value.neg() : output.value);
  //       });
  //     };
  //     addOutputs(inputOutputs);
  //     addOutputs(this.outputs, true);

  //     return _.pickBy(mutableResults, (value) => value !== undefined && !value.eq(utils.ZERO));
  //   },
  // );

  public readonly toKeyString = utils.toKeyString(Transaction, () => this.hashHex);

  private readonly sizeInternal = utils.lazy(
    () =>
      this.headerSize +
      IOHelper.sizeOfArray(this.attributes, (attribute) => attribute.size) +
      IOHelper.sizeOfArray(this.cosigners, (cosigner) => cosigner.size) +
      IOHelper.sizeOfVarBytesLE(this.script) +
      IOHelper.sizeOfArray(this.witnesses, (witness) => witness.size),
  );

  // TODO make sure this logic makes sense compared to C#
  public readonly equals: Equals<Transaction> = (other: Transaction) => {
    if (this === other) {
      return true;
    }

    return common.uInt256Equal(this.hash, other.hash);
  };

  public serializeJSON(context: SerializeJSONContext): TransactionJSON {
    return {
      hash: common.uInt256ToString(this.hash),
      size: this.size,
      version: this.version,
      nonce: this.nonce,
      sender: common.uInt160ToString(this.sender),
      sys_fee: JSONHelper.writeUInt64(this.systemFee),
      net_fee: JSONHelper.writeUInt64(this.networkFee),
      valid_until_block: this.validUntilBlock,
      attributes: this.attributes.map((attribute) => attribute.serializeJSON(context)),
      cosigners: this.cosigners.map((cosigner) => cosigner.serializeJSON(context)),
      script: JSONHelper.writeBuffer(this.script),
      witnesses: this.witnesses.map((witness) => witness.serializeJSON(context)),
    };
  }

  public verify(options: TransactionVerifyOptions, totalSenderFeeFromPool: BN) {
    const result = this.verifyForEachBlock(options, totalSenderFeeFromPool);
    if (result !== RelayResultReason.Succeed) {
      return result;
    }

    return this.verifyParallelParts(options);
  }

  public verifyForEachBlock(options: TransactionVerifyOptions, totalSenderFeeFromPool: BN): RelayResultReason {
    if (
      this.validUntilBlock <= options.currentHeight ||
      this.validUntilBlock > options.currentHeight + Transaction.maxValidUntilBlockIncrement
    ) {
      return RelayResultReason.Expired;
    }
    const hashes = this.getSortedScriptHashesForVerifying();
    // TODO: implement this check after NativeContract changes go in
    // if (NativeContract.Policy.GetBlockedAccounts(snapshot).Intersect(hashes).Any())
    //   return RelayResultReason.PolicyFail;
    // TODO: implement this check after NativeContract changes go in
    // const balance = NativeContract.GAS.balanceOf(options, this.sender);
    // const fee = this.systemFee.add(this.networkFee).add(totalSenderFeeFromPool);
    // if (balance.lt(fee)) {
    //   return RelayResultReason.InsufficientFunds;
    // }
    if (hashes.length !== this.witnesses.length) {
      return RelayResultReason.Invalid;
    }
    _.zip(hashes, this.witnesses).forEach(([hash, witness]) => {
      if (hash === undefined || witness === undefined) {
        throw new Error('for TS'); // shouldn't be possible since we checked they are same length above.
      }
      // TODO: implement the second check after the tryGetContract function is implemented;
      if (!(witness.verification.length > 0) /*|| options.tryGetContract(hash) === undefined*/) {
        return RelayResultReason.Invalid;
      }

      return;
    });

    return RelayResultReason.Succeed;
  }

  public verifyParallelParts(options: TransactionVerifyOptions) {
    const size = this.size;
    if (size > Transaction.maxTransactionSize) {
      return RelayResultReason.Invalid;
    }
    // TODO: implement this after NativeContract changes go in
    // const netFee: BN = this.networkFee.subn(size * NativeContract.Policy.GetFeeBerByte(options));
    // if (netFee.ltn(0)) {
    //   return RelayResultReason.InsufficientFunds;
    // }
    if (!this.verifyWitnesses(options, netFee)) {
      return RelayResultReason.Invalid;
    }

    return RelayResultReason.Succeed;
  }

  // TODO: is this a neo-one specific function?
  // public async getTransactionResults(options: GetTransactionResultsOptions): Promise<{ readonly [key: string]: BN }> {
  //   return this.getTransactionResultsInternal(options) as Promise<{ readonly [key: string]: BN }>;
  // }

  // TODO: is `TransactionResult`s neo-one specific?
  // private async verifyTransactionResults({
  //   getOutput,
  //   utilityToken,
  //   governingToken,
  //   fees,
  //   registerValidatorFee,
  // }: TransactionVerifyOptions): Promise<void> {
  //   const results = await this.getTransactionResults({ getOutput });
  //   const resultsDestroy = Object.entries(results).filter(
  //     // tslint:disable-next-line no-unused
  //     ([_key, value]) => value.gt(utils.ZERO),
  //   );

  //   if (
  //     resultsDestroy.length > 1 ||
  //     (resultsDestroy.length === 1 &&
  //       !common.uInt256Equal(common.hexToUInt256(resultsDestroy[0][0]), utilityToken.hash))
  //   ) {
  //     throw new VerifyError('Invalid destroyed output.');
  //   }

  //   const feeContext = {
  //     getOutput,
  //     governingToken,
  //     utilityToken,
  //     fees,
  //     registerValidatorFee,
  //   };

  //   const systemFee = this.getSystemFee(feeContext);
  //   if (systemFee.gt(utils.ZERO) && (resultsDestroy.length === 0 || resultsDestroy[0][1].lt(systemFee))) {
  //     throw new VerifyError('Not enough output value for system fee.');
  //   }

  //   // tslint:disable-next-line no-unused
  //   const resultsIssue = Object.entries(results).filter(([__, value]) => value.lt(utils.ZERO));

  //   switch (this.type) {
  //     case TransactionType.Miner:
  //     case TransactionType.Claim:
  //       if (
  //         resultsIssue.some(([assetHex]) => !common.uInt256Equal(common.hexToUInt256(assetHex), utilityToken.hash))
  //       ) {
  //         throw new VerifyError('Invalid miner/claim result');
  //       }
  //       break;
  //     case TransactionType.Issue:
  //       if (
  //         // tslint:disable-next-line no-unused
  //         resultsIssue.some(([assetHex, __]) => common.uInt256Equal(common.hexToUInt256(assetHex), utilityToken.hash))
  //       ) {
  //         throw new VerifyError('Invalid issue result');
  //       }
  //       break;
  //     default:
  //       if (resultsIssue.length > 0) {
  //         throw new VerifyError('Invalid results.');
  //       }
  //   }
  // }

  // TODO: this needs to be re-implemented but its not super trivial
  // private async verifyWitnesses({
  //   getAsset,
  //   getOutput,
  //   verifyScript,
  // }: TransactionVerifyOptions): Promise<readonly VerifyScriptResult[]> {
  //   const hashesArr = await this.getSortedScriptHashesForVerifying({
  //     getAsset,
  //     getOutput,
  //   });

  //   if (hashesArr.length !== this.scripts.length) {
  //     throw new VerifyError(`Invalid witnesses. Found ${hashesArr.length} hashes and ${this.scripts.length} scripts.`);
  //   }

  //   const hashes = hashesArr.map((value) => common.hexToUInt160(value));

  //   return Promise.all(
  //     _.zip(hashes, this.scripts).map(async ([hash, witness]) =>
  //       verifyScript({
  //         scriptContainer: {
  //           type: ScriptContainerType.Transaction,
  //           // tslint:disable-next-line no-any
  //           value: this as any,
  //         },
  //         hash: hash as UInt160,
  //         witness: witness as Witness,
  //       }),
  //     ),
  //   );
  // }

  // TODO: dummy implementation for now
  private verifyWitnesses(_options: TransactionVerifyOptions, _gas: BN): boolean {
    return true;
  }
}
