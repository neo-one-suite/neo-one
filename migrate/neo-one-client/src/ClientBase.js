/* @flow */
import {
  type Attribute,
  type Input,
  type Output,
  type Param,
  type Witness,
  common,
  crypto,
} from '@neo-one/client-core';

import _ from 'lodash';

import {
  type ABI,
  type AddressLike,
  type AttributeLike,
  type Hash160Like,
  type InputLike,
  type OutputLike,
  type ParamLike,
  type PublicKeyLike,
  type PrivateKeyLike,
  type PrivateKeyLikeOrSign,
  type WitnessLike,
} from './types';

import abi from './abi';
import converters from './converters';
import parameters from './parameters';

export type ClientBaseOptions = {|
  addressVersion?: number,
  privateKeyVersion?: number,
|};

export default class ClientBase {
  _addressVersion: number;
  _privateKeyVersion: number;
  parameters: typeof parameters;
  abi: $ObjMap<typeof abi, () => (hash: AddressLike) => Promise<ABI>>;

  constructor(optionsIn?: ClientBaseOptions) {
    const options = optionsIn || {};
    this._addressVersion =
      options.addressVersion == null
        ? common.NEO_ADDRESS_VERSION
        : options.addressVersion;
    this._privateKeyVersion =
      options.privateKeyVersion == null
        ? common.NEO_PRIVATE_KEY_VERSION
        : options.privateKeyVersion;
    this.parameters = parameters;
    this.abi = _.mapValues(abi, func => (hash: AddressLike) =>
      func(this, hash),
    );
  }

  // TODO: Make all of these async so that we can potentially switch to web
  //       crypto
  publicKeyToScriptHash(publicKey: PublicKeyLike): string {
    return common.uInt160ToString(
      crypto.publicKeyToScriptHash(converters.publicKey(publicKey)),
    );
  }

  publicKeyToAddress(publicKey: PublicKeyLike): string {
    return crypto.scriptHashToAddress({
      addressVersion: this._addressVersion,
      scriptHash: crypto.publicKeyToScriptHash(converters.publicKey(publicKey)),
    });
  }

  scriptHashToAddress(scriptHash: Hash160Like): string {
    return crypto.scriptHashToAddress({
      addressVersion: this._addressVersion,
      scriptHash: converters.hash160(this, scriptHash),
    });
  }

  addressToScriptHash(address: string): string {
    return common.uInt160ToString(
      crypto.addressToScriptHash({
        addressVersion: this._addressVersion,
        address,
      }),
    );
  }

  wifToPrivateKey(wif: string): string {
    return common.privateKeyToString(
      crypto.wifToPrivateKey(wif, this._privateKeyVersion),
    );
  }

  privateKeyToWIF(privateKey: PrivateKeyLike): string {
    return crypto.privateKeyToWIF(
      converters.privateKey(this, privateKey),
      this._privateKeyVersion,
    );
  }

  privateKeyToScriptHash(privateKey: PrivateKeyLike): string {
    return common.uInt160ToString(
      crypto.privateKeyToScriptHash(converters.privateKey(this, privateKey)),
    );
  }

  privateKeyToAddress(privateKey: PrivateKeyLike): string {
    return crypto.privateKeyToAddress({
      addressVersion: this._addressVersion,
      privateKey: converters.privateKey(this, privateKey),
    });
  }

  privateKeyToPublicKey(privateKey: PrivateKeyLike): string {
    return common.ecPointToString(
      crypto.privateKeyToPublicKey(converters.privateKey(this, privateKey)),
    );
  }

  isNEP2(encryptedKey: string): boolean {
    return crypto.isNEP2(encryptedKey);
  }

  encryptNEP2({
    password,
    privateKey,
  }: {|
    password: string,
    privateKey: PrivateKeyLike,
  |}): Promise<string> {
    return crypto.encryptNEP2({
      addressVersion: this._addressVersion,
      privateKey: converters.privateKey(this, privateKey),
      password,
    });
  }

  async decryptNEP2({
    password,
    encryptedKey,
  }: {|
    password: string,
    encryptedKey: string,
  |}): Promise<string> {
    const privateKey = await crypto.decryptNEP2({
      addressVersion: this._addressVersion,
      encryptedKey,
      password,
    });
    return this.privateKeyToWIF(privateKey);
  }

  createPrivateKey(): string {
    return this.privateKeyToWIF(crypto.createPrivateKey());
  }

  _getAddress(privateKey: PrivateKeyLikeOrSign): string {
    if (
      !(privateKey instanceof Buffer) &&
      !(typeof privateKey === 'string') &&
      typeof privateKey === 'object' &&
      privateKey.sign != null &&
      typeof privateKey.sign === 'function' &&
      privateKey.publicKey != null
    ) {
      return this.publicKeyToAddress(privateKey.publicKey);
    }

    return this.privateKeyToAddress(((privateKey: $FlowFixMe): PrivateKeyLike));
  }

  _convertAttributes(attributes?: Array<AttributeLike>): Array<Attribute> {
    return (attributes || []).map(attribute =>
      converters.attribute(this, attribute),
    );
  }

  _convertInputs(inputs?: Array<InputLike>): Array<Input> {
    return (inputs || []).map(input => converters.input(input));
  }

  _convertOutputs(outputs?: Array<OutputLike>): Array<Output> {
    return (outputs || []).map(output => converters.output(this, output));
  }

  _convertWitnesses(scripts?: Array<WitnessLike>): Array<Witness> {
    return (scripts || []).map(script => converters.witness(script));
  }

  _convertParams(params?: Array<ParamLike>): Array<Param> {
    return (params || []).map(param => converters.param(this, param));
  }
}
