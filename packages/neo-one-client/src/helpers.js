/* @flow */
import { crypto, common } from '@neo-one/client-core';

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

export const publicKeyToAddress = (
  publicKey: PublicKeyString,
  addressVersion?: number,
): AddressString =>
  crypto.scriptHashToAddress({
    addressVersion:
      addressVersion == null ? common.NEO_ADDRESS_VERSION : addressVersion,
    scriptHash: crypto.publicKeyToScriptHash(common.stringToECPoint(publicKey)),
  });

export const scriptHashToAddress = (
  scriptHash: Hash160String,
  addressVersion?: number,
): AddressString =>
  crypto.scriptHashToAddress({
    addressVersion:
      addressVersion == null ? common.NEO_ADDRESS_VERSION : addressVersion,
    scriptHash: common.stringToUInt160(scriptHash),
  });

export const addressToScriptHash = (
  address: AddressString,
  addressVersion?: number,
): Hash160String =>
  common.uInt160ToString(
    crypto.addressToScriptHash({
      addressVersion:
        addressVersion == null ? common.NEO_ADDRESS_VERSION : addressVersion,
      address,
    }),
  );

export const wifToPrivateKey = (
  wif: string,
  privateKeyVersion?: number,
): PrivateKeyString =>
  common.privateKeyToString(
    crypto.wifToPrivateKey(
      wif,
      privateKeyVersion == null
        ? common.NEO_PRIVATE_KEY_VERSION
        : privateKeyVersion,
    ),
  );

export const privateKeyToWIF = (
  privateKey: PrivateKeyString,
  privateKeyVersion?: number,
): string =>
  crypto.privateKeyToWIF(
    common.stringToPrivateKey(privateKey),
    privateKeyVersion == null
      ? common.NEO_PRIVATE_KEY_VERSION
      : privateKeyVersion,
  );

export const privateKeyToScriptHash = (
  privateKey: PrivateKeyString,
): Hash160String =>
  common.uInt160ToString(
    crypto.privateKeyToScriptHash(common.stringToPrivateKey(privateKey)),
  );

export const privateKeyToAddress = (
  privateKey: PrivateKeyString,
  addressVersion?: number,
): AddressString =>
  crypto.privateKeyToAddress({
    addressVersion:
      addressVersion == null ? common.NEO_ADDRESS_VERSION : addressVersion,
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
  addressVersion?: number,
|}): Promise<string> =>
  crypto.encryptNEP2({
    addressVersion:
      addressVersion == null ? common.NEO_ADDRESS_VERSION : addressVersion,
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
  addressVersion?: number,
|}): Promise<string> => {
  const privateKey = await crypto.decryptNEP2({
    addressVersion:
      addressVersion == null ? common.NEO_ADDRESS_VERSION : addressVersion,
    encryptedKey,
    password,
  });
  return common.privateKeyToString(privateKey);
};

export const createPrivateKey = (): PrivateKeyString =>
  common.privateKeyToString(crypto.createPrivateKey());
