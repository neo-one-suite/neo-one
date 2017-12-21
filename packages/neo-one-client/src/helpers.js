/* @flow */
import { crypto, common } from '@neo-one/core';

import type {
  AddressString,
  Hash160String,
  PrivateKeyString,
  PublicKeyString,
} from './types';

export const publicKeyToScriptHash = (publicKey: PublicKeyString): string =>
  common.uInt160ToString(
    crypto.publicKeyToScriptHash(common.stringToECPoint(publicKey)),
  );

export const publicKeyToAddress = ({
  addressVersion,
  publicKey,
}: {|
  addressVersion: number,
  publicKey: PublicKeyString,
|}): AddressString =>
  crypto.scriptHashToAddress({
    addressVersion,
    scriptHash: crypto.publicKeyToScriptHash(common.stringToECPoint(publicKey)),
  });

export const scriptHashToAddress = ({
  addressVersion,
  scriptHash,
}: {|
  addressVersion: number,
  scriptHash: Hash160String,
|}): AddressString =>
  crypto.scriptHashToAddress({
    addressVersion,
    scriptHash: common.stringToUInt160(scriptHash),
  });

export const addressToScriptHash = ({
  addressVersion,
  address,
}: {|
  addressVersion: number,
  address: AddressString,
|}): Hash160String =>
  common.uInt160ToString(
    crypto.addressToScriptHash({ addressVersion, address }),
  );

export const wifToPrivateKey = ({
  wif,
  privateKeyVersion,
}: {|
  wif: string,
  privateKeyVersion: number,
|}): PrivateKeyString =>
  common.privateKeyToString(crypto.wifToPrivateKey(wif, privateKeyVersion));

export const privateKeyToWIF = ({
  privateKey,
  privateKeyVersion,
}: {|
  privateKey: PrivateKeyString,
  privateKeyVersion: number,
|}): string =>
  crypto.privateKeyToWIF(
    common.stringToPrivateKey(privateKey),
    privateKeyVersion,
  );

export const privateKeyToScriptHash = (
  privateKey: PrivateKeyString,
): Hash160String =>
  common.uInt160ToString(
    crypto.privateKeyToScriptHash(common.stringToPrivateKey(privateKey)),
  );

export const privateKeyToAddress = ({
  privateKey,
  addressVersion,
}: {|
  privateKey: PrivateKeyString,
  addressVersion: number,
|}): AddressString =>
  crypto.privateKeyToAddress({
    addressVersion,
    privateKey: common.stringToPrivateKey(privateKey),
  });

export const privateKeyToPublicKey = (
  privateKey: PrivateKeyString,
): PublicKeyString =>
  common.ecPointToString(
    crypto.privateKeyToPublicKey(common.stringToPrivateKey(privateKey)),
  );

export const isNEP2 = (encryptedKey: string): boolean =>
  crypto.isNEP2(encryptedKey);

export const encryptNEP2 = ({
  password,
  privateKey,
  addressVersion,
}: {|
  password: string,
  privateKey: PrivateKeyString,
  addressVersion: number,
|}): Promise<string> =>
  crypto.encryptNEP2({
    addressVersion,
    privateKey: common.stringToPrivateKey(privateKey),
    password,
  });

export const decryptNEP2 = async ({
  password,
  encryptedKey,
  addressVersion,
}: {|
  password: string,
  encryptedKey: string,
  addressVersion: number,
|}): Promise<string> => {
  const privateKey = await crypto.decryptNEP2({
    addressVersion,
    encryptedKey,
    password,
  });
  return common.privateKeyToString(privateKey);
};

export const createPrivateKey = (): PrivateKeyString =>
  common.privateKeyToString(crypto.createPrivateKey());
