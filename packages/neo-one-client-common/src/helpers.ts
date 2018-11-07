import { common } from './common';
import { crypto } from './crypto';
import { AddressString, PrivateKeyString, PublicKeyString } from './types';

/**
 * Converts a hex-encoded public key into a `Hash160` script hash.
 *
 * @param publicKey hex-encoded public key
 * @returns `Hash160` string, a hex encoded string prefixed by '0x'.
 */
export const publicKeyToScriptHash = (publicKey: PublicKeyString): string =>
  common.uInt160ToString(crypto.publicKeyToScriptHash(common.stringToECPoint(publicKey)));

/**
 * Converts a hex-encoded public key into a base58 encoded NEO `Address`.
 *
 * @param publicKey hex-encoded public key
 * @returns base58 encoded string that represents a NEO address.
 */
export const publicKeyToAddress = (publicKey: PublicKeyString): AddressString =>
  crypto.scriptHashToAddress({
    addressVersion: common.NEO_ADDRESS_VERSION,
    scriptHash: crypto.publicKeyToScriptHash(common.stringToECPoint(publicKey)),
  });

/**
 * Converts a `Hash160` script hash into a base58 encoded NEO `Address`.
 *
 * @param scriptHash `Hash160` string, a hex encoded string prefixed by '0x'.
 * @returns base58 encoded string that represents a NEO address.
 */
export const scriptHashToAddress = (scriptHash: string): AddressString =>
  crypto.scriptHashToAddress({
    addressVersion: common.NEO_ADDRESS_VERSION,
    scriptHash: common.stringToUInt160(scriptHash),
  });

/**
 * Converts a base58 encoded NEO `Address` into a `Hash160` script hash.
 *
 * @param address base58 encoded string that represents a NEO address.
 * @returns `Hash160` string, a hex encoded string prefixed by '0x'.
 */
export const addressToScriptHash = (address: AddressString): string =>
  common.uInt160ToString(
    crypto.addressToScriptHash({
      addressVersion: common.NEO_ADDRESS_VERSION,
      address,
    }),
  );

/**
 * Converts a wallet-import-format (WIF) private key to a hex-encoded private key.
 *
 * @param wif wallet-import-format (WIF) private key.
 * @returns hex-encoded private key.
 */
export const wifToPrivateKey = (wif: string): PrivateKeyString =>
  common.privateKeyToString(crypto.wifToPrivateKey(wif, common.NEO_PRIVATE_KEY_VERSION));

/**
 * Converts a hex-encoded private key to a wallet-import-format (WIF) private key.
 *
 * @param privateKey hex-encoded private key.
 * @returns wallet-import-format (WIF) private key.
 */
export const privateKeyToWIF = (privateKey: PrivateKeyString): string =>
  crypto.privateKeyToWIF(common.stringToPrivateKey(privateKey), common.NEO_PRIVATE_KEY_VERSION);

/**
 * Converts a hex-encoded private key to a `Hash160` script hash.
 *
 * @param privateKey hex-encoded private key.
 * @returns `Hash160` string, a hex encoded string prefixed by '0x'.
 */
export const privateKeyToScriptHash = (privateKey: PrivateKeyString): string =>
  common.uInt160ToString(crypto.privateKeyToScriptHash(common.stringToPrivateKey(privateKey)));

/**
 * Converts a hex-encoded private key to a base58 encoded NEO `Address`.
 *
 * @param privateKey hex-encoded private key.
 * @returns base58 encoded string that represents a NEO address.
 */
export const privateKeyToAddress = (privateKey: PrivateKeyString): AddressString =>
  crypto.privateKeyToAddress({
    addressVersion: common.NEO_ADDRESS_VERSION,
    privateKey: common.stringToPrivateKey(privateKey),
  });

/**
 * Converts a hex-encoded private key to a hex-encoded public key.
 *
 * @param privateKey hex-encoded private key.
 * @returns hex-encoded public key
 */
export const privateKeyToPublicKey = (privateKey: PrivateKeyString): PublicKeyString =>
  common.ecPointToString(crypto.privateKeyToPublicKey(common.stringToPrivateKey(privateKey)));

/**
 * Validates if a given string is a NEP-2 encrypted private key.
 *
 * @param encryptedKey hex-encoded encrypted key
 * @returns `true` if it's a valid NEP-2 key, `false` otherwise
 */
export const isNEP2 = (encryptedKey: string): boolean => crypto.isNEP2(encryptedKey);

/**
 * Encrypts a private key with a password using the NEP-2 standard.
 *
 * @param password arbitrary string
 * @param privateKey hex-encoded private key
 * @returns NEP-2 format encrypted key
 */
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

/**
 * Decrypts a private key encrypted using the NEP-2 standard with the given password.
 *
 * @param password arbitrary string
 * @param encryptedKey NEP-2 format encrypted key
 * @returns hex-encoded private key
 */
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

/**
 * Creates a new cryptographically secure private key.
 *
 * @returns hex-encoded private key
 */
export const createPrivateKey = (): PrivateKeyString => common.privateKeyToString(crypto.createPrivateKey());
