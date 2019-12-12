// tslint:disable no-any no-array-mutation
import ECKey from '@neo-one/ec-key';
import { Constructor, utils } from '@neo-one/utils';
import { BN } from 'bn.js';
import base58 from 'bs58';
import xor from 'buffer-xor';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'crypto';
import { curves, ec as EC } from 'elliptic';
import scrypt from 'scrypt-js';
import WIF from 'wif';
import { common, ECPoint, InvalidFormatError, PrivateKey, UInt160, UInt256 } from './common';
import {
  Base58CheckError,
  InvalidAddressError,
  InvalidBIP32ChildIndexError,
  InvalidBIP32ExtendedKeyError,
  InvalidBIP32HardenedError,
  InvalidBIP32SerializePrivateNodeError,
  InvalidBIP32VersionError,
  InvalidNumberOfKeysError,
  InvalidPrivateKeyError,
  InvalidSignatureError,
  InvalidSignaturesError,
  TooManyPublicKeysError,
} from './errors';
import { Op, sha256 as sha256In, WitnessModel } from './models';
import { p256 } from './precomputed';
import { ScriptBuilder } from './ScriptBuilder';

// tslint:disable-next-line no-let
let ecCache: EC | undefined;
const ec = () => {
  if (ecCache === undefined) {
    ecCache = new EC(new curves.PresetCurve(p256));
  }

  return ecCache;
};

const sha1 = (value: Buffer): Buffer =>
  createHash('sha1')
    .update(value)
    .digest();

const sha256 = sha256In;

const rmd160 = (value: Buffer): Buffer =>
  createHash(process.versions.hasOwnProperty('electron') ? 'ripemd160' : 'rmd160')
    .update(value)
    .digest();

const hash160 = (value: Buffer): UInt160 => common.bufferToUInt160(rmd160(sha256(value)));

const hash256 = (value: Buffer): UInt256 => common.bufferToUInt256(sha256(sha256(value)));

const hmacSha512 = (key: Buffer | string, data: Buffer) =>
  createHmac('sha512', key)
    .update(data)
    .digest();

const sign = ({ message, privateKey }: { readonly message: Buffer; readonly privateKey: PrivateKey }): Buffer => {
  const sig = ec().sign(sha256(message), common.privateKeyToBuffer(privateKey));

  return Buffer.concat([sig.r.toArrayLike(Buffer, 'be', 32), sig.s.toArrayLike(Buffer, 'be', 32)]);
};

// tslint:disable readonly-array
/* istanbul ignore next */
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
/* istanbul ignore next */
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
    /* istanbul ignore next */
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
    /* istanbul ignore next */
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
    /* istanbul ignore next */
    if (!result) {
      throw new InvalidPrivateKeyError(privateKey);
    }

    mutablePublicKeyCache[privateKeyHex] = publicKey = toECPointFromKeyPair(key);
  }

  return publicKey;
};

const createKeyPair = (): { readonly privateKey: PrivateKey; readonly publicKey: ECPoint } => {
  const key = ec().genKeyPair();
  const validation = key.validate();

  if (!validation.result) {
    return createKeyPair();
  }

  return {
    privateKey: common.bufferToPrivateKey(key.getPrivate().toArrayLike(Buffer, 'be')),
    publicKey: toECPointFromKeyPair(key),
  };
};

const createPrivateKey = (): PrivateKey => common.bufferToPrivateKey(randomBytes(32));

const toScriptHash = hash160;

// Takes various formats and converts to standard ECPoint
const toECPoint = (publicKey: Buffer): ECPoint => toECPointFromKeyPair(ec().keyFromPublic(publicKey));

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
  builder.emitSysCall('Neo.Crypto.CheckSig');

  return builder.build();
};

const createWitnessForSignature = <TWitness extends WitnessModel>(
  signature: Buffer,
  publicKey: ECPoint,
  Witness: Constructor<TWitness>,
): TWitness => {
  const verification = createVerificationScript(publicKey);
  const invocation = createInvocationScriptForSignature(signature);

  return new Witness({ verification, invocation });
};

const createWitness = <TWitness extends WitnessModel>(
  message: Buffer,
  privateKey: PrivateKey,
  Witness: Constructor<TWitness>,
): TWitness => createWitnessForSignature(sign({ message, privateKey }), privateKeyToPublicKey(privateKey), Witness);

const getVerificationScriptHash = (publicKey: ECPoint): UInt160 => toScriptHash(createVerificationScript(publicKey));

const compareKeys = (a: EC.KeyPair, b: EC.KeyPair): number => {
  const aPublic = a.getPublic();
  const bPublic = b.getPublic();
  const result = aPublic.getX().cmp(bPublic.getX());
  if (result !== 0) {
    return result;
  }

  /* istanbul ignore next */
  return aPublic.getY().cmp(bPublic.getY());
};

const sortKeys = (publicKeys: readonly ECPoint[]): readonly ECPoint[] =>
  publicKeys
    .map((publicKey) => ec().keyFromPublic(publicKey))
    .sort(compareKeys)
    .map(toECPointFromKeyPair);

const createMultiSignatureVerificationScript = (mIn: number, publicKeys: readonly ECPoint[]) => {
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
  builder.emitSysCall('Neo.Crypto.CheckMultiSig');

  return builder.build();
};

const createMultiSignatureInvocationScript = (signatures: readonly Buffer[]): Buffer => {
  const builder = new ScriptBuilder();
  signatures.forEach((signature) => {
    builder.emitPush(signature);
  });

  return builder.build();
};

const createMultiSignatureWitness = <TWitness extends WitnessModel>(
  mIn: number,
  publicKeys: readonly ECPoint[],
  publicKeyToSignature: { readonly [key: string]: Buffer },
  Witness: Constructor<TWitness>,
): TWitness => {
  const m = Math.floor(mIn);
  const publicKeysSorted = publicKeys.length === 1 ? publicKeys : sortKeys(publicKeys);
  const signatures = publicKeysSorted
    .map((publicKey) => publicKeyToSignature[common.ecPointToHex(publicKey)])
    .filter(utils.notNull);
  if (signatures.length !== m) {
    throw new InvalidSignaturesError(m, signatures.length);
  }

  const verification = createMultiSignatureVerificationScript(m, publicKeysSorted);
  const invocation = createMultiSignatureInvocationScript(signatures);

  return new Witness({ verification, invocation });
};

const getConsensusAddress = (validators: readonly ECPoint[]): UInt160 =>
  toScriptHash(
    createMultiSignatureVerificationScript(Math.floor(validators.length - (validators.length - 1) / 3), validators),
  );

const wifToPrivateKey = (wif: string, privateKeyVersion: number): PrivateKey => {
  const privateKeyDecoded = base58CheckDecode(wif);

  if (privateKeyDecoded.length !== 34 || privateKeyDecoded[0] !== privateKeyVersion || privateKeyDecoded[33] !== 0x01) {
    /* istanbul ignore next */
    throw new InvalidFormatError('Private Key was invalid when decoded from WIF.');
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
        /* istanbul ignore next */
        if (error != undefined) {
          reject(error);
        } else if (key) {
          resolve(Buffer.from([...key]));
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
    /* istanbul ignore next */
    throw new InvalidFormatError('Invalid NEP2 format when decoded from encryptedKey.');
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
    /* istanbul ignore next */
    throw new Error('Wrong passphrase.');
  }

  return common.bufferToPrivateKey(privateKey);
};

const checkSigUint = Buffer.from([0x747476aa]);
const checkMultiSigUint = Buffer.from([0xc7c34cba]);

const isSignatureContract = (script: Buffer) =>
  script.length === 39 && script[0] === 33 && script[34] === Op.SYSCALL && script.slice(34) === checkSigUint;

// TODO: test the changes you just made here
// tslint:disable
const isMultiSigContract = (script: Buffer) => {
  let m = 0;
  let n = 0;
  let i = 0;
  if (script.length < 37) return false;
  if (script[i] > Op.PUSH16) return false;
  if (script[i] < Op.PUSH1 && script[i] !== 1 && script[i] !== 2) return false;
  switch (script[i]) {
    case 1:
      m = script[++i];
      ++i;
      break;
    case 2:
      m = script.readUInt16LE(++i);
      i += 2;
      break;
    default:
      m = script[i++] - 80;
      break;
  }
  if (m < 1 || m > 1024) return false;
  while (script[i] == 33) {
    i += 34;
    if (script.length <= i) return false;
    ++n;
  }
  if (n < m || n > 1024) return false;
  switch (script[i]) {
    case 1:
      if (n != script[++i]) return false;
      ++i;
      break;
    case 2:
      if (script.length < i + 3 || n != script.readUInt16LE(++i)) return false;
      i += 2;
      break;
    default:
      if (n != script[i++] - 80) return false;
      break;
  }
  if (script.slice(i + 1) != checkMultiSigUint) return false;
  if (script.length != i + 4) return false;
  return true;
};
// tslint:enable

const isStandardContract = (script: Buffer) => isSignatureContract(script) || isMultiSigContract(script);

// https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
const HARDENED_KEY_OFFSET = 0x80000000;
const EXTENDED_KEY_BYTES = 78;

// According to https://github.com/bitcoin/bips/blob/master/bip-0043.mediawiki#node-serialization this isn't special.
const BIP32_VERSION = {
  public: 0x0488b21e,
  private: 0x0488ade4,
};

export interface HDNode {
  readonly privateKey?: PrivateKey;
  readonly publicKey: Buffer;
  readonly version: number;
  readonly depth: number;
  readonly parentFingerprint?: Buffer;
  readonly index: number;
  readonly chainCode: Buffer;
}

const getFingerprint = (value: Buffer) => hash160(value).slice(0, 4);

const parseMasterSeed = (seedIn: Buffer | string): HDNode => {
  const seed = seedIn instanceof Buffer ? seedIn : Buffer.from(seedIn, 'hex');
  const hmac = hmacSha512('NEO Seed', seed);

  const privateKey = hmac.slice(0, 32);
  const publicKey = privateKeyToPublicKey(common.asPrivateKey(privateKey));
  const chainCode = hmac.slice(32);

  return {
    privateKey: common.asPrivateKey(privateKey),
    publicKey,
    version: BIP32_VERSION.private,
    depth: 0,
    index: 0,
    chainCode,
  };
};

const parseExtendedKey = (key: string): HDNode => {
  const data = base58CheckDecode(key);

  if (data.length !== EXTENDED_KEY_BYTES) {
    throw new InvalidBIP32ExtendedKeyError(key);
  }

  const version = data.readUInt32BE(0);
  const depth = data.readUInt8(4);
  const parentFingerprintIn = data.slice(5, 9);
  const parentFingerprint = parentFingerprintIn.readUInt32BE(0) === 0 ? undefined : parentFingerprintIn;
  const index = data.readUInt32BE(9);
  const chainCode = data.slice(13, 45);
  const keyData = data.slice(45);
  const privateKeyIn = keyData[0] === 0 ? keyData.slice(1) : undefined;
  const publicKey = keyData[0] !== 0 ? keyData : undefined;

  if (privateKeyIn !== undefined) {
    if (version !== BIP32_VERSION.private) {
      throw new InvalidBIP32VersionError(version, BIP32_VERSION.private);
    }

    const privateKey = common.asPrivateKey(privateKeyIn);

    return {
      privateKey,
      publicKey: privateKeyToPublicKey(privateKey),
      version,
      depth,
      parentFingerprint,
      index,
      chainCode,
    };
  }

  if (publicKey !== undefined) {
    if (version !== BIP32_VERSION.public) {
      throw new InvalidBIP32VersionError(version, BIP32_VERSION.public);
    }

    return {
      publicKey,
      version,
      depth,
      parentFingerprint,
      index,
      chainCode,
    };
  }

  throw new InvalidBIP32ExtendedKeyError(key);
};

const deriveChildKey = (node: HDNode, index: number, hardened: boolean): HDNode => {
  if (index >= HARDENED_KEY_OFFSET) {
    throw new InvalidBIP32ChildIndexError(index);
  }

  const data: Buffer = Buffer.alloc(37);
  if (hardened) {
    if (!node.privateKey) {
      throw new InvalidBIP32HardenedError();
    }
    node.privateKey.copy(data, 1);
  } else {
    node.publicKey.copy(data, 0);
  }
  data.writeUInt32BE(index, 33);

  const sha = hmacSha512(node.chainCode, data);
  const shaLeft = new BN(sha.slice(0, 32));
  const shaRight = sha.slice(32);

  if (shaLeft.cmp(ec().n as BN) >= 0) {
    return deriveChildKey(node, index + 1, hardened);
  }

  if (node.privateKey) {
    const childKeyPrivate = shaLeft.add(new BN(node.privateKey)).mod(ec().n as BN);

    if (childKeyPrivate.cmp(new BN(0)) === 0) {
      return deriveChildKey(node, index + 1, hardened);
    }

    const privateKey = common.asPrivateKey(childKeyPrivate.toArrayLike(Buffer, 'be', 32));
    const publicKey = privateKeyToPublicKey(privateKey);

    return {
      depth: node.depth + 1,
      privateKey,
      publicKey,
      chainCode: shaRight,
      parentFingerprint: getFingerprint(node.publicKey),
      index: hardened ? index + HARDENED_KEY_OFFSET : index,
      version: BIP32_VERSION.private,
    };
  }
  const parentKey = ec()
    .keyFromPublic(node.publicKey)
    .getPublic();

  const childKey = ec()
    .g.mul(shaLeft)
    .add(parentKey);

  if (childKey.isInfinity()) {
    return deriveChildKey(node, index + 1, false);
  }

  const compressedChildKey = Buffer.from(childKey.encode(undefined, true));

  return {
    depth: node.depth + 1,
    publicKey: compressedChildKey,
    chainCode: shaRight,
    parentFingerprint: getFingerprint(node.publicKey),
    index,
    version: BIP32_VERSION.public,
  };
};

// privateNode lets you serialize to just the encoded public key, even on a private HDNode.
const serializeHDNode = (node: HDNode, privateNode = true): string => {
  if (privateNode && node.privateKey === undefined) {
    throw new InvalidBIP32SerializePrivateNodeError();
  }

  const data = Buffer.alloc(EXTENDED_KEY_BYTES);

  data.writeUInt32BE(privateNode ? BIP32_VERSION.private : BIP32_VERSION.public, 0);
  data.writeUInt8(node.depth, 4);

  if (node.parentFingerprint !== undefined) {
    node.parentFingerprint.copy(data, 5);
  }

  data.writeUInt32BE(node.index, 9);
  node.chainCode.copy(data, 13);

  const key = privateNode && node.privateKey !== undefined ? node.privateKey : node.publicKey;
  key.copy(data, EXTENDED_KEY_BYTES - key.length);

  const checksum = hash256(data).slice(0, 4);

  return base58.encode(Buffer.concat([data, checksum]));
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
  isMultiSigContract,
  isSignatureContract,
  isStandardContract,
  parseExtendedKey,
  parseMasterSeed,
  deriveChildKey,
  serializeHDNode,
};
