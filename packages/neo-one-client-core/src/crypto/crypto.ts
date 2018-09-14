// tslint:disable no-any no-array-mutation
import ECKey from '@neo-one/ec-key';
import { makeErrorWithCode, utils } from '@neo-one/utils';
import base58 from 'bs58';
import xor from 'buffer-xor';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { ec as EC } from 'elliptic';
import scrypt from 'scrypt-js';
import WIF from 'wif';
import { common, ECPoint, PrivateKey, UInt160, UInt256 } from '../common';
import { InvalidFormatError, InvalidNumberOfKeysError, TooManyPublicKeysError } from '../errors';
import { ScriptBuilder } from '../utils';
import { Witness } from '../Witness';
import { p256 } from './precomputed';

// tslint:disable-next-line no-let
let ecCache: any;
const ec = () => {
  if (ecCache === undefined) {
    // tslint:disable-next-line no-any
    ecCache = new EC(p256) as any;
  }

  return ecCache;
};

export const Base58CheckError = makeErrorWithCode(
  'BASE_58_CHECK',
  (value: string) => `Base58 Check Decode Error on decoding: ${value}`,
);

export const InvalidAddressError = makeErrorWithCode(
  'INVALID_ADDRESS',
  (address: string) => `Invalid Address: ${address}`,
);

const sha1 = (value: Buffer): Buffer =>
  createHash('sha1')
    .update(value)
    .digest();

const sha256 = (value: Buffer): Buffer =>
  createHash('sha256')
    .update(value)
    .digest();

const rmd160 = (value: Buffer): Buffer =>
  createHash('rmd160')
    .update(value)
    .digest();

const hash160 = (value: Buffer): UInt160 => common.bufferToUInt160(rmd160(sha256(value)));

const hash256 = (value: Buffer): UInt256 => common.bufferToUInt256(sha256(sha256(value)));

const sign = ({ message, privateKey }: { readonly message: Buffer; readonly privateKey: PrivateKey }): Buffer => {
  const sig = ec().sign(sha256(message), common.privateKeyToBuffer(privateKey));

  return Buffer.concat([sig.r.toArrayLike(Buffer, 'be', 32), sig.s.toArrayLike(Buffer, 'be', 32)]);
};

export const InvalidSignatureError = makeErrorWithCode(
  'INVALID_SIGNATURE',
  (length: number) => `Invalid Signature length. Found: ${length}, Max: 64`,
);

// tslint:disable readonly-array
const rmPadding = (buf: number[]): number[] => {
  let i = 0;
  const len = buf.length - 1;
  // tslint:disable-next-line
  while (!buf[i] && !(buf[i + 1] & 0x80) && i < len) {
    i += 1;
  }
  if (i === 0) {
    return buf;
  }

  return buf.slice(i);
};

const constructLength = (arr: number[], len: number): void => {
  if (len < 0x80) {
    arr.push(len);

    return;
  }
  // tslint:disable-next-line
  let octets = 1 + ((Math.log(len) / Math.LN2) >>> 3);
  // tslint:disable-next-line
  arr.push(octets | 0x80);
  // tslint:disable-next-line
  while (--octets) {
    // tslint:disable-next-line
    arr.push((len >>> (octets << 3)) & 0xff);
  }
  arr.push(len);
};

const verify = ({
  message,
  signature: signatureIn,
  publicKey,
}: {
  readonly message: Buffer;
  readonly signature: Buffer;
  readonly publicKey: ECPoint;
}) => {
  if (signatureIn.length !== 64) {
    throw new InvalidSignatureError(signatureIn.length);
  }
  let r = [...signatureIn.slice(0, 32)];
  let s = [...signatureIn.slice(32)];

  // tslint:disable-next-line
  if (r[0] & 0x80) {
    r = [0].concat(r);
  }
  // tslint:disable-next-line
  if (s[0] & 0x80) {
    s = [0].concat(s);
  }

  r = rmPadding(r);
  s = rmPadding(s);

  // tslint:disable-next-line
  while (s.length > 0 && !s[0] && !(s[1] & 0x80)) {
    s = s.slice(1);
  }
  let arr = [0x02];
  constructLength(arr, r.length);
  arr = arr.concat(r);
  arr.push(0x02);
  constructLength(arr, s.length);
  const backHalf = arr.concat(s);
  const res = [0x30];
  constructLength(res, backHalf.length);
  const signature = Buffer.from(res.concat(backHalf));

  const key = new ECKey({
    crv: 'P-256',
    publicKey: Buffer.from(
      ec()
        .keyFromPublic(publicKey)
        .getPublic(false, 'hex'),
      'hex',
    ),
  });

  return (key.createVerify('SHA256').update(message) as any).verify(signature);
};
// tslint:enable readonly-array

export const InvalidPrivateKeyError = makeErrorWithCode(
  'INVALID_PRIVATE_KEY',
  (privateKey: PrivateKey) => `Invalid Private Key, found: ${common.privateKeyToString(privateKey)}`,
);

const toECPointFromKeyPair = (pair: EC.KeyPair): ECPoint =>
  common.bufferToECPoint(Buffer.from(pair.getPublic(true, 'hex'), 'hex'));

const mutablePublicKeyCache: { [K in string]?: ECPoint } = {};
const addPublicKey = (privateKey: PrivateKey, publicKey: ECPoint) => {
  mutablePublicKeyCache[common.privateKeyToString(privateKey)] = publicKey;
};
const privateKeyToPublicKey = (privateKey: PrivateKey): ECPoint => {
  const privateKeyHex = common.privateKeyToString(privateKey);
  let publicKey = mutablePublicKeyCache[privateKeyHex];
  if (publicKey === undefined) {
    const key = ec().keyFromPrivate(common.privateKeyToBuffer(privateKey));
    key.getPublic(true, 'hex');
    const { result } = key.validate();
    if (!result) {
      throw new InvalidPrivateKeyError(privateKey);
    }

    mutablePublicKeyCache[privateKeyHex] = publicKey = toECPointFromKeyPair(key);
  }

  return publicKey;
};

const createKeyPair = (): { readonly privateKey: PrivateKey; readonly publicKey: ECPoint } => {
  const key = ec().genKeyPair();

  return {
    privateKey: common.bufferToPrivateKey(key.getPrivate().toArrayLike(Buffer, 'be')),
    publicKey: toECPointFromKeyPair(key),
  };
};

const createPrivateKey = (): PrivateKey => common.bufferToPrivateKey(randomBytes(32));

const toScriptHash = hash160;

// Takes various formats and converts to standard ECPoint
const toECPoint = (publicKey: Buffer): ECPoint => toECPointFromKeyPair(ec().keyFromPublic(publicKey));

const isInfinity = (ecPoint: ECPoint): boolean =>
  ec()
    .keyFromPublic(ecPoint)
    .getPublic()
    .isInfinity();

const base58Checksum = (buffer: Buffer): Buffer => common.uInt256ToBuffer(hash256(buffer)).slice(0, 4);

const base58CheckEncode = (buffer: Buffer): string => {
  const checksum = base58Checksum(buffer);

  return base58.encode(Buffer.concat([buffer, checksum]));
};

const base58CheckDecode = (value: string): Buffer => {
  const buffer = Buffer.from(base58.decode(value));
  const payload = buffer.slice(0, -4);
  const checksum = buffer.slice(-4);
  const payloadChecksum = base58Checksum(payload);
  if (!checksum.equals(payloadChecksum)) {
    throw new Base58CheckError(value);
  }

  return payload;
};

const scriptHashToAddress = ({
  addressVersion,
  scriptHash,
}: {
  readonly addressVersion: number;
  readonly scriptHash: UInt160;
}): string => {
  const mutableBuffer = Buffer.allocUnsafe(21);
  mutableBuffer[0] = addressVersion;
  common.uInt160ToBuffer(scriptHash).copy(mutableBuffer, 1);

  return base58CheckEncode(mutableBuffer);
};

const addressToScriptHash = ({
  addressVersion,
  address,
}: {
  readonly addressVersion: number;
  readonly address: string;
}): UInt160 => {
  const decodedAddress = base58CheckDecode(address);
  if (decodedAddress.length !== 21 || decodedAddress[0] !== addressVersion) {
    throw new InvalidAddressError(address);
  }

  return common.bufferToUInt160(decodedAddress.slice(1));
};

const createInvocationScriptForSignature = (signature: Buffer): Buffer => {
  const builder = new ScriptBuilder();
  builder.emitPush(signature);

  return builder.build();
};

const createInvocationScript = (message: Buffer, privateKey: PrivateKey): Buffer =>
  createInvocationScriptForSignature(sign({ message, privateKey }));

const createVerificationScript = (publicKey: ECPoint): Buffer => {
  const builder = new ScriptBuilder();
  builder.emitPushECPoint(publicKey);
  builder.emitOp('CHECKSIG');

  return builder.build();
};

const createWitnessForSignature = (signature: Buffer, publicKey: ECPoint): Witness => {
  const verification = createVerificationScript(publicKey);
  const invocation = createInvocationScriptForSignature(signature);

  return new Witness({ verification, invocation });
};

const createWitness = (message: Buffer, privateKey: PrivateKey): Witness =>
  createWitnessForSignature(sign({ message, privateKey }), privateKeyToPublicKey(privateKey));

const getVerificationScriptHash = (publicKey: ECPoint): UInt160 => toScriptHash(createVerificationScript(publicKey));

const compareKeys = (a: EC.KeyPair, b: EC.KeyPair): number => {
  const aPublic = a.getPublic();
  const bPublic = b.getPublic();
  const result = aPublic.getX().cmp(bPublic.getX());
  if (result !== 0) {
    return result;
  }

  return aPublic.getY().cmp(bPublic.getY());
};

const sortKeys = (publicKeys: ReadonlyArray<ECPoint>): ReadonlyArray<ECPoint> =>
  publicKeys
    .map((publicKey) => ec().keyFromPublic(publicKey))
    .sort(compareKeys)
    .map(toECPointFromKeyPair);

const createMultiSignatureVerificationScript = (mIn: number, publicKeys: ReadonlyArray<ECPoint>) => {
  const m = Math.floor(mIn);
  if (m < 1 || m > publicKeys.length) {
    throw new InvalidNumberOfKeysError(m, publicKeys.length);
  }

  if (publicKeys.length > 1024) {
    throw new TooManyPublicKeysError(publicKeys.length);
  }

  const builder = new ScriptBuilder();
  builder.emitPushInt(m);
  const publicKeysSorted = publicKeys.length === 1 ? publicKeys : sortKeys(publicKeys);
  publicKeysSorted.forEach((ecPoint) => {
    builder.emitPushECPoint(ecPoint);
  });
  builder.emitPushInt(publicKeysSorted.length);
  builder.emitOp('CHECKMULTISIG');

  return builder.build();
};

const createMultiSignatureInvocationScript = (signatures: ReadonlyArray<Buffer>): Buffer => {
  const builder = new ScriptBuilder();
  signatures.forEach((signature) => {
    builder.emitPush(signature);
  });

  return builder.build();
};

const createMultiSignatureWitness = (
  mIn: number,
  publicKeys: ReadonlyArray<ECPoint>,
  publicKeyToSignature: { readonly [key: string]: Buffer },
): Witness => {
  const m = Math.floor(mIn);
  const publicKeysSorted = publicKeys.length === 1 ? publicKeys : sortKeys(publicKeys);
  const signatures = publicKeysSorted
    .map((publicKey) => publicKeyToSignature[common.ecPointToHex(publicKey)])
    .filter(utils.notNull);
  if (signatures.length !== m) {
    throw new Error('Invalid signatures');
  }

  const verification = createMultiSignatureVerificationScript(m, publicKeysSorted);
  const invocation = createMultiSignatureInvocationScript(signatures);

  return new Witness({ verification, invocation });
};

const getConsensusAddress = (validators: ReadonlyArray<ECPoint>): UInt160 =>
  toScriptHash(
    createMultiSignatureVerificationScript(Math.floor(validators.length - (validators.length - 1) / 3), validators),
  );

const wifToPrivateKey = (wif: string, privateKeyVersion: number): PrivateKey => {
  const privateKeyDecoded = base58CheckDecode(wif);

  if (privateKeyDecoded.length !== 34 || privateKeyDecoded[0] !== privateKeyVersion || privateKeyDecoded[33] !== 0x01) {
    throw new InvalidFormatError();
  }

  return common.bufferToPrivateKey(privateKeyDecoded.slice(1, 33));
};

const privateKeyToWIF = (privateKey: PrivateKey, privateKeyVersion: number): string =>
  WIF.encode(privateKeyVersion, common.privateKeyToBuffer(privateKey), true);

const publicKeyToScriptHash = getVerificationScriptHash;

const privateKeyToScriptHash = (privateKey: PrivateKey): UInt160 =>
  publicKeyToScriptHash(privateKeyToPublicKey(privateKey));

const privateKeyToAddress = ({
  addressVersion,
  privateKey,
}: {
  readonly addressVersion: number;
  readonly privateKey: PrivateKey;
}): string =>
  scriptHashToAddress({
    addressVersion,
    scriptHash: privateKeyToScriptHash(privateKey),
  });

const NEP2_KDFPARAMS = {
  N: 16384,
  r: 8,
  p: 8,
  dklen: 64,
};

const NEP2_ZERO = 0x01;
const NEP2_ONE = 0x42;
const NEP2_TWO = 0xe0;
const NEP2_CIPHER = 'aes-256-ecb';

const getNEP2Derived = async ({
  password,
  salt,
}: {
  readonly password: string;
  readonly salt: Buffer;
}): Promise<Buffer> =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(
      Buffer.from(password.normalize('NFKC'), 'utf8'),
      salt,
      NEP2_KDFPARAMS.N,
      NEP2_KDFPARAMS.r,
      NEP2_KDFPARAMS.p,
      NEP2_KDFPARAMS.dklen,
      (error, _progress, key) => {
        if (error != undefined) {
          reject(error);
        } else if (key) {
          resolve(Buffer.from(key));
        }
      },
    ),
  );

const getNEP2Salt = ({
  addressVersion,
  privateKey,
}: {
  readonly addressVersion: number;
  readonly privateKey: PrivateKey;
}) => {
  const address = privateKeyToAddress({
    addressVersion,
    privateKey,
  });

  return common.uInt256ToBuffer(hash256(Buffer.from(address, 'latin1'))).slice(0, 4);
};

const encryptNEP2 = async ({
  addressVersion,
  password,
  privateKey,
}: {
  readonly addressVersion: number;
  readonly password: string;
  readonly privateKey: PrivateKey;
}): Promise<string> => {
  const salt = getNEP2Salt({ addressVersion, privateKey });

  const derived = await getNEP2Derived({ password, salt });
  const derived1 = derived.slice(0, 32);
  const derived2 = derived.slice(32, 64);

  const cipher = createCipheriv(NEP2_CIPHER, derived2, Buffer.alloc(0, 0));

  cipher.setAutoPadding(false);
  cipher.end(xor(privateKey, derived1));
  const ciphertext = cipher.read() as Buffer;

  const result = Buffer.alloc(7 + 32, 0);
  result.writeUInt8(NEP2_ZERO, 0);
  result.writeUInt8(NEP2_ONE, 1);
  result.writeUInt8(NEP2_TWO, 2);
  salt.copy(result, 3);
  ciphertext.copy(result, 7);

  return base58CheckEncode(result);
};

const isNEP2 = (encryptedKey: string): boolean => {
  try {
    const decoded = base58CheckDecode(encryptedKey);

    return (
      decoded.length === 39 &&
      decoded.readUInt8(0) === NEP2_ZERO &&
      decoded.readUInt8(1) === NEP2_ONE &&
      decoded.readUInt8(2) === NEP2_TWO
    );
  } catch {
    return false;
  }
};

const decryptNEP2 = async ({
  addressVersion,
  encryptedKey,
  password,
}: {
  readonly addressVersion: number;
  readonly encryptedKey: string;
  readonly password: string;
}): Promise<PrivateKey> => {
  const decoded = base58CheckDecode(encryptedKey);

  if (
    decoded.length !== 39 ||
    decoded.readUInt8(0) !== NEP2_ZERO ||
    decoded.readUInt8(1) !== NEP2_ONE ||
    decoded.readUInt8(2) !== NEP2_TWO
  ) {
    throw new Error('Invalid NEP2 format.');
  }

  const salt = decoded.slice(3, 7);
  const derived = await getNEP2Derived({ password, salt });
  const derived1 = derived.slice(0, 32);
  const derived2 = derived.slice(32, 64);

  const decipher = createDecipheriv(NEP2_CIPHER, derived2, Buffer.alloc(0, 0));

  decipher.setAutoPadding(false);
  decipher.end(decoded.slice(7, 7 + 32));
  const plainText = decipher.read() as Buffer;

  const privateKey = common.asPrivateKey(xor(plainText, derived1));

  const addressSalt = getNEP2Salt({ addressVersion, privateKey });
  if (!salt.equals(addressSalt)) {
    throw new Error('Wrong passphrase.');
  }

  return common.bufferToPrivateKey(privateKey);
};

export const crypto = {
  addPublicKey,
  sha1,
  sha256,
  hash160,
  hash256,
  sign,
  verify,
  privateKeyToPublicKey,
  toScriptHash,
  toECPoint,
  isInfinity,
  createKeyPair,
  scriptHashToAddress,
  addressToScriptHash,
  createInvocationScript,
  createVerificationScript,
  createWitness,
  createWitnessForSignature,
  getVerificationScriptHash,
  createMultiSignatureInvocationScript,
  createMultiSignatureVerificationScript,
  createMultiSignatureWitness,
  getConsensusAddress,
  privateKeyToWIF,
  wifToPrivateKey,
  publicKeyToScriptHash,
  privateKeyToScriptHash,
  privateKeyToAddress,
  isNEP2,
  encryptNEP2,
  decryptNEP2,
  createPrivateKey,
};
