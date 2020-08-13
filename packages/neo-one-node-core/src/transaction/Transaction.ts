import {
  common,
  crypto,
  InvalidFormatError,
  InvocationDataJSON,
  InvocationTransactionJSON,
  InvocationTransactionModel,
  InvocationTransactionModelAdd,
  IOHelper,
  JSONHelper,
  UInt256,
} from '@neo-one/client-common';
import { Constructor } from '@neo-one/utils';
import { BN } from 'bn.js';
import { VerifyError } from '../errors';
import { createDeserializeWire, DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { utils } from '../utils';
import { VerifyScriptResult } from '../vm';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import { Input } from './Input';
import { Output } from './Output';
import { FeeContext, TransactionBase, TransactionVerifyOptions } from './TransactionBase';
import { TransactionType } from './TransactionType';

export interface TransactionKey {
  readonly hash: UInt256;
}

export const deserializeTransactionWireBase = (options: DeserializeWireBaseOptions): Transaction =>
  Transaction.deserializeWireBase(options);

export const deserializeTransactionWire = createDeserializeWire(deserializeTransactionWireBase);

export interface InvocationTransactionAdd extends InvocationTransactionModelAdd<Attribute, Input, Output, Witness> {}

const MAX_SCRIPT_SIZE = 65536;

export class Transaction extends TransactionBase<
  TransactionType.Invocation,
  InvocationTransactionJSON,
  Constructor<InvocationTransactionModel<Attribute, Input, Output, Witness>>
>(InvocationTransactionModel) {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Transaction {
    const { reader } = options;

    const { type, version } = super.deserializeTransactionBaseStartWireBase(options);

    if (type !== TransactionType.Invocation) {
      throw new InvalidFormatError(`Expected transaction type to be ${TransactionType.Invocation}. Received: ${type}`);
    }

    const script = reader.readVarBytesLE(MAX_SCRIPT_SIZE);
    if (script.length === 0) {
      throw new InvalidFormatError('Expected invocation script length to not be 0');
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

  public readonly sizeExclusive: () => number = utils.lazy(
    () => IOHelper.sizeOfUInt8 + IOHelper.sizeOfVarBytesLE(this.script),
  );

  public async serializeJSON(context: SerializeJSONContext): Promise<InvocationTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(context);

    const data = await context.tryGetInvocationData(this);
    let invocationDataJSON: InvocationDataJSON | undefined;
    if (data !== undefined) {
      const {
        asset,
        contracts,
        deletedContractHashes,
        migratedContractHashes,
        voteUpdates,
        actions,
        result,
        storageChanges,
      } = data;
      invocationDataJSON = {
        result: result.serializeJSON(context),
        asset: asset === undefined ? undefined : asset.serializeJSON(context),
        contracts: contracts.map((contract) => contract.serializeJSON(context)),
        deletedContractHashes: deletedContractHashes.map((hash) => common.uInt160ToString(hash)),
        migratedContractHashes: migratedContractHashes.map<readonly [string, string]>(([from, to]) => [
          common.uInt160ToString(from),
          common.uInt160ToString(to),
        ]),
        voteUpdates: voteUpdates.map<readonly [string, string[]]>(([address, votes]) => [
          crypto.scriptHashToAddress({
            addressVersion: context.addressVersion,
            scriptHash: address,
          }),
          votes.map((vote) => common.ecPointToString(vote)),
        ]),
        actions: actions.map((action) => action.serializeJSON(context)),
        storageChanges: storageChanges.map((storageChange) => storageChange.serializeJSON(context)),
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

  public async verify(options: TransactionVerifyOptions): Promise<readonly VerifyScriptResult[]> {
    if (!this.gas.mod(utils.ONE_HUNDRED_MILLION).eq(utils.ZERO)) {
      throw new VerifyError('Invalid GAS amount');
    }

    return super.verify(options);
  }
}
