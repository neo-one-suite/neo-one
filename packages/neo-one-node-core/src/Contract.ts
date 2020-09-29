import {
  common,
  ContractParameterTypeModel,
  crypto,
  ECPoint,
  scriptHashToAddress,
  UInt160,
} from '@neo-one/client-common';
import _ from 'lodash';
import { utils } from './utils';

export interface ContractAdd {
  readonly script: Buffer;
  readonly parameterList: readonly ContractParameterTypeModel[];
  readonly scriptHash?: UInt160;
  readonly address?: string;
}

/* I implemented this but then didn't need it since I can just use the underlying crypto function I need.
 * It might come up later so we will keep it around for now. TODO: revist
 **/
export class Contract {
  public static createMultiSigContract(m: number, publicKeys: readonly ECPoint[]): Contract {
    return new Contract({
      script: crypto.createMultiSignatureRedeemScript(m, publicKeys),
      parameterList: _.range(m).map(() => ContractParameterTypeModel.Signature),
    });
  }

  public static createSignatureContract(publicKey: ECPoint): Contract {
    return new Contract({
      script: crypto.createSignatureRedeemScript(publicKey),
      parameterList: [ContractParameterTypeModel.Signature],
    });
  }

  public readonly script: Buffer;
  public readonly parameterList: readonly ContractParameterTypeModel[];
  public readonly scriptHashInternal: () => UInt160;
  public readonly addressInternal: () => string;

  public constructor({ script, parameterList, scriptHash: scriptHashIn, address: addressIn }: ContractAdd) {
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
}
