import { BN } from 'bn.js';
import { ActionJSON } from '../action';
import { AssetJSON } from '../Asset';
import { common } from '../common';
import { ContractJSON } from '../Contract';
import { crypto } from '../crypto';
import { InvalidFormatError, VerifyError } from '../errors';
import { InvocationResultJSON } from '../invocationResult';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { BinaryWriter, IOHelper, JSONHelper, utils } from '../utils';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import { Input } from './Input';
import { Output } from './Output';
import {
  FeeContext,
  TransactionBase,
  TransactionBaseAdd,
  TransactionBaseJSON,
  TransactionVerifyOptions,
} from './TransactionBase';
import { TransactionType } from './TransactionType';

export interface InvocationTransactionAdd extends TransactionBaseAdd {
  readonly gas: BN;
  readonly script: Buffer;
}

export interface InvocationDataJSON {
  readonly result: InvocationResultJSON;
  readonly asset?: AssetJSON;
  readonly contracts: ReadonlyArray<ContractJSON>;
  readonly deletedContractHashes: ReadonlyArray<string>;
  readonly migratedContractHashes: ReadonlyArray<[string, string]>;
  readonly voteUpdates: ReadonlyArray<[string, ReadonlyArray<string>]>;
  readonly actions: ReadonlyArray<ActionJSON>;
}

export interface InvocationTransactionJSON extends TransactionBaseJSON {
  readonly type: 'InvocationTransaction';
  readonly script: string;
  readonly gas: string;
  readonly invocationData?: InvocationDataJSON | undefined;
}

// const MAX_SCRIPT_SIZE = 65536;
const MAX_SCRIPT_SIZE = 1000000;

export class InvocationTransaction extends TransactionBase<TransactionType.Invocation, InvocationTransactionJSON> {
  public static readonly VERSION = 1;
  public static deserializeWireBase(options: DeserializeWireBaseOptions): InvocationTransaction {
    const { reader } = options;

    const { type, version } = super.deserializeTransactionBaseStartWireBase(options);

    if (type !== TransactionType.Invocation) {
      throw new InvalidFormatError();
    }

    const script = reader.readVarBytesLE(MAX_SCRIPT_SIZE);
    if (script.length === 0) {
      throw new InvalidFormatError();
    }

    let gas = utils.ZERO;
    if (version >= 1) {
      gas = reader.readFixed8();
    }

    const { attributes, inputs, outputs, scripts } = super.deserializeTransactionBaseEndWireBase(options);

    return new this({
      version,
      attributes,
      inputs,
      outputs,
      scripts,
      script,
      gas,
    });
  }

  public readonly gas: BN;
  public readonly script: Buffer;
  protected readonly sizeExclusive: () => number = utils.lazy(
    () => IOHelper.sizeOfUInt8 + IOHelper.sizeOfVarBytesLE(this.script),
  );

  public constructor({ version, attributes, inputs, outputs, scripts, hash, gas, script }: InvocationTransactionAdd) {
    super({
      version,
      type: TransactionType.Invocation,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });

    this.gas = gas;
    this.script = script;

    if (this.version > 1) {
      throw new InvalidFormatError();
    }

    if (this.script.length === 0) {
      throw new InvalidFormatError();
    }

    if (this.gas.lt(utils.ZERO)) {
      throw new InvalidFormatError();
    }
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
  }): InvocationTransaction {
    return new InvocationTransaction({
      version: this.version,
      attributes,
      inputs,
      outputs,
      scripts,
      gas: this.gas,
      script: this.script,
    });
  }

  public serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.script);
    if (this.version >= 1) {
      writer.writeFixed8(this.gas);
    }
  }

  public async serializeJSON(context: SerializeJSONContext): Promise<InvocationTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(context);

    const data = await context.tryGetInvocationData(this);
    let invocationDataJSON: InvocationDataJSON | undefined;
    if (data !== undefined) {
      const { asset, contracts, deletedContractHashes, migratedContractHashes, voteUpdates, actions, result } = data;
      invocationDataJSON = {
        result: result.serializeJSON(context),
        asset: asset === undefined ? undefined : asset.serializeJSON(context),
        contracts: contracts.map((contract) => contract.serializeJSON(context)),
        deletedContractHashes: deletedContractHashes.map((hash) => common.uInt160ToString(hash)),
        migratedContractHashes: migratedContractHashes.map<[string, string]>(([from, to]) => [
          common.uInt160ToString(from),
          common.uInt160ToString(to),
        ]),
        voteUpdates: voteUpdates.map<[string, string[]]>(([address, votes]) => [
          crypto.scriptHashToAddress({
            addressVersion: context.addressVersion,
            scriptHash: address,
          }),
          votes.map((vote) => common.ecPointToString(vote)),
        ]),
        actions: actions.map((action) => action.serializeJSON(context)),
      };
    }

    return {
      ...transactionBaseJSON,
      type: 'InvocationTransaction',
      script: JSONHelper.writeBuffer(this.script),
      gas: JSONHelper.writeFixed8(this.gas),
      invocationData: invocationDataJSON,
    };
  }

  public getSystemFee(_context: FeeContext): BN {
    return this.gas;
  }

  public async verify(options: TransactionVerifyOptions): Promise<void> {
    if (!this.gas.mod(utils.ONE_HUNDRED_MILLION).eq(utils.ZERO)) {
      throw new VerifyError('Invalid GAS amount');
    }

    await super.verify(options);
  }
}
