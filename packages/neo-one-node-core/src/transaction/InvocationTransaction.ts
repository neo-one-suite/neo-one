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
} from '@neo-one/client-common';
import { Constructor } from '@neo-one/utils';
import BN from 'bn.js';
import { VerifyError } from '../errors';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { utils } from '../utils';
import { VerifyScriptResult } from '../vm';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import { Input } from './Input';
import { Output } from './Output';
import { FeeContext, TransactionBase, TransactionVerifyOptions } from './TransactionBase';
import { TransactionType } from './TransactionType';

export interface InvocationTransactionAdd extends InvocationTransactionModelAdd<Attribute, Input, Output, Witness> {}

const MAX_SCRIPT_SIZE = 65536;

export class InvocationTransaction extends TransactionBase<
  TransactionType.Invocation,
  InvocationTransactionJSON,
  Constructor<InvocationTransactionModel<Attribute, Input, Output, Witness>>
>(InvocationTransactionModel) {
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

  protected readonly sizeExclusive: () => number = utils.lazy(
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
        migratedContractHashes: migratedContractHashes.map<readonly [string, string]>(
          ([from, to]) => [common.uInt160ToString(from), common.uInt160ToString(to)] as const,
        ),
        voteUpdates: voteUpdates.map<readonly [string, string[]]>(
          ([address, votes]) =>
            [
              crypto.scriptHashToAddress({
                addressVersion: context.addressVersion,
                scriptHash: address,
              }),
              votes.map((vote) => common.ecPointToString(vote)),
            ] as const,
        ),
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
