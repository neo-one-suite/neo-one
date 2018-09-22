import { common } from './common';
import { crypto } from './crypto';
import { AddressString, PrivateKeyString, PublicKeyString } from './types';

export const publicKeyToScriptHash = (publicKey: PublicKeyString): string =>
  common.uInt160ToString(crypto.publicKeyToScriptHash(common.stringToECPoint(publicKey)));

export const publicKeyToAddress = (publicKey: PublicKeyString): AddressString =>
  crypto.scriptHashToAddress({
    addressVersion: common.NEO_ADDRESS_VERSION,
    scriptHash: crypto.publicKeyToScriptHash(common.stringToECPoint(publicKey)),
  });

export const scriptHashToAddress = (scriptHash: string): AddressString =>
  crypto.scriptHashToAddress({
    addressVersion: common.NEO_ADDRESS_VERSION,
    scriptHash: common.stringToUInt160(scriptHash),
  });

export const addressToScriptHash = (address: AddressString): string =>
  common.uInt160ToString(
    crypto.addressToScriptHash({
      addressVersion: common.NEO_ADDRESS_VERSION,
      address,
    }),
  );

export const wifToPrivateKey = (wif: string): PrivateKeyString =>
  common.privateKeyToString(crypto.wifToPrivateKey(wif, common.NEO_PRIVATE_KEY_VERSION));

export const privateKeyToWIF = (privateKey: PrivateKeyString): string =>
  crypto.privateKeyToWIF(common.stringToPrivateKey(privateKey), common.NEO_PRIVATE_KEY_VERSION);

export const privateKeyToScriptHash = (privateKey: PrivateKeyString): string =>
  common.uInt160ToString(crypto.privateKeyToScriptHash(common.stringToPrivateKey(privateKey)));

export const privateKeyToAddress = (privateKey: PrivateKeyString): AddressString =>
  crypto.privateKeyToAddress({
    addressVersion: common.NEO_ADDRESS_VERSION,
    privateKey: common.stringToPrivateKey(privateKey),
  });

export const privateKeyToPublicKey = (privateKey: PrivateKeyString): PublicKeyString =>
  common.ecPointToString(crypto.privateKeyToPublicKey(common.stringToPrivateKey(privateKey)));

export const isNEP2 = (encryptedKey: string): boolean => crypto.isNEP2(encryptedKey);

export const encryptNEP2 = async ({
  password,
  privateKey,
}: {
  readonly password: string;
  readonly privateKey: PrivateKeyString;
}): Promise<string> =>
  crypto.encryptNEP2({
    addressVersion: common.NEO_ADDRESS_VERSION,
    privateKey: common.stringToPrivateKey(privateKey),
    password,
  });

export const decryptNEP2 = async ({
  password,
  encryptedKey,
}: {
  readonly password: string;
  readonly encryptedKey: string;
}): Promise<PrivateKeyString> => {
  const privateKey = await crypto.decryptNEP2({
    addressVersion: common.NEO_ADDRESS_VERSION,
    encryptedKey,
    password,
  });

  return common.privateKeyToString(privateKey);
};

export const createPrivateKey = (): PrivateKeyString => common.privateKeyToString(crypto.createPrivateKey());
