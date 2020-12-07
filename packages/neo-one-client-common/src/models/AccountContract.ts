import _ from 'lodash';
import { JSONHelper } from '../JSONHelper';
import { common, ECPoint, UInt160 } from '../common';
import { crypto } from '../crypto';
import { scriptHashToAddress } from '../helpers';
import { utils } from '../utils';
import {
  ContractParameterTypeModel,
  toContractParameterType,
  toJSONContractParameterType,
} from './ContractParameterTypeModel';
import { AccountContractJSON } from './types';

export interface AccountContractAdd {
  readonly script: Buffer;
  readonly parameterList: readonly ContractParameterTypeModel[];
  readonly scriptHash?: UInt160;
  readonly address?: string;
}
export class AccountContract {
  public static createMultiSigContract(m: number, publicKeys: readonly ECPoint[]): AccountContract {
    return new AccountContract({
      script: crypto.createMultiSignatureRedeemScript(m, publicKeys),
      parameterList: _.range(m).map(() => ContractParameterTypeModel.Signature),
    });
  }

  public static createSignatureContract(publicKey: ECPoint): AccountContract {
    return new AccountContract({
      script: crypto.createSignatureRedeemScript(publicKey),
      parameterList: [ContractParameterTypeModel.Signature],
    });
  }

  public static fromJSON(json: AccountContractJSON): AccountContract {
    return new AccountContract({
      script: JSONHelper.readBase64Buffer(json.script),
      parameterList: json.parameterlist.map(toContractParameterType),
      scriptHash: JSONHelper.readUInt160(json.scripthash),
      address: json.address,
    });
  }

  public readonly script: Buffer;
  public readonly parameterList: readonly ContractParameterTypeModel[];
  public readonly scriptHashInternal: () => UInt160;
  public readonly addressInternal: () => string;

  public constructor({ script, parameterList, scriptHash: scriptHashIn, address: addressIn }: AccountContractAdd) {
    this.script = script;
    this.parameterList = parameterList;
    this.scriptHashInternal = scriptHashIn ? () => scriptHashIn : utils.lazy(() => crypto.hash160(this.script));
    this.addressInternal = addressIn
      ? () => addressIn
      : utils.lazy(() => scriptHashToAddress(common.uInt160ToString(this.scriptHashInternal())));
  }

  public get scriptHash() {
    return this.scriptHashInternal();
  }

  public get address() {
    return this.addressInternal();
  }

  public serializeJSON(): AccountContractJSON {
    return {
      script: JSONHelper.writeBase64Buffer(this.script),
      parameterlist: this.parameterList.map(toJSONContractParameterType),
      scripthash: JSONHelper.writeUInt160(this.scriptHash),
      address: this.address,
    };
  }
}
