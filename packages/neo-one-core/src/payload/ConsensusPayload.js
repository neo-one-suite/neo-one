/* @flow */
import { SCRIPT_CONTAINER_TYPE } from '../ScriptContainer';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializableWire,
} from '../Serializable';
import { type Equatable, type Equals } from '../Equatable';
import { InvalidFormatError, VerifyError } from '../errors';
import UnsignedConsensusPayload, {
  type UnsignedConsensusPayloadAdd,
} from './UnsignedConsensusPayload';
import type { VerifyScript } from '../vm';
import Witness from '../Witness';

import common, {
  type ECPoint,
  type PrivateKey,
  type UInt256,
  type UInt256Hex,
} from '../common';
import crypto from '../crypto';
import utils, { BinaryReader, BinaryWriter } from '../utils';

export type ConsensusPayloadAdd = {|
  ...UnsignedConsensusPayloadAdd,
  script: Witness,
|};

export type ConsensusPayloadGetScriptHashesForVerifyingOptions = {|
  getValidators: () => Promise<Array<ECPoint>>,
  currentBlockHash: UInt256,
|};

export type ConsensusPayloadVerifyOptions = {|
  ...ConsensusPayloadGetScriptHashesForVerifyingOptions,
  currentIndex: number,
  verifyScript: VerifyScript,
|};

export default class ConsensusPayload extends UnsignedConsensusPayload
  implements SerializableWire<ConsensusPayload>, Equatable {
  script: Witness;

  constructor({
    version,
    previousHash,
    blockIndex,
    validatorIndex,
    timestamp,
    consensusMessage,
    script,
  }: ConsensusPayloadAdd) {
    super({
      version,
      previousHash,
      blockIndex,
      validatorIndex,
      timestamp,
      consensusMessage,
    });
    this.script = script;
  }

  _hash = utils.lazy(() => crypto.hash256(this.message));
  _hashHex = utils.lazy(() => common.uInt256ToHex(this.hash));
  _message = utils.lazy(() => this.serializeUnsigned());

  equals: Equals = utils.equals(this.constructor, other =>
    common.uInt256Equal(this.hash, other.hash),
  );

  static sign(
    payload: UnsignedConsensusPayload,
    key: PrivateKey,
  ): ConsensusPayload {
    return new ConsensusPayload({
      version: payload.version,
      previousHash: payload.previousHash,
      blockIndex: payload.blockIndex,
      validatorIndex: payload.validatorIndex,
      timestamp: payload.timestamp,
      consensusMessage: payload.consensusMessage,
      script: crypto.createWitness(payload.serializeWire(), key),
    });
  }

  get hash(): UInt256 {
    return this._hash();
  }

  get hashHex(): UInt256Hex {
    return this._hashHex();
  }

  get message(): Buffer {
    return this._message();
  }

  serializeUnsigned(): Buffer {
    const writer = new BinaryWriter();
    super.serializeWireBase(writer);
    return writer.toBuffer();
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt8(1);
    this.script.serializeWireBase(writer);
  }

  static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): ConsensusPayload {
    const { reader } = options;
    const {
      version,
      previousHash,
      blockIndex,
      validatorIndex,
      timestamp,
      consensusMessage,
    } = super.deserializeUnsignedConsensusPayloadWireBase(options);
    if (reader.readUInt8() !== 1) {
      throw new InvalidFormatError();
    }
    const script = Witness.deserializeWireBase(options);

    return new this({
      version,
      previousHash,
      blockIndex,
      validatorIndex,
      timestamp,
      consensusMessage,
      script,
    });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  getScriptHashesForVerifying = utils.lazyAsync(
    async ({
      getValidators,
      currentBlockHash,
    }: ConsensusPayloadGetScriptHashesForVerifyingOptions) => {
      if (!common.uInt256Equal(this.previousHash, currentBlockHash)) {
        throw new VerifyError('Previous hash not equal to current block hash');
      }
      const validators = await getValidators();
      if (validators.length <= this.validatorIndex) {
        throw new VerifyError('Invalid validator index');
      }

      return new Set([
        common.uInt160ToHex(
          crypto.getVerificationScriptHash(validators[this.validatorIndex]),
        ),
      ]);
    },
  );

  async verify({
    verifyScript,
    getValidators,
    currentBlockHash,
    currentIndex,
  }: ConsensusPayloadVerifyOptions): Promise<void> {
    if (this.blockIndex !== currentIndex + 1) {
      throw new VerifyError('Invalid block index.');
    }

    const scriptHashes = await this.getScriptHashesForVerifying({
      getValidators,
      currentBlockHash,
    });
    const scriptContainer = {
      type: SCRIPT_CONTAINER_TYPE.CONSENSUS,
      value: this,
    };
    await Promise.all(
      [...scriptHashes].map(hash =>
        verifyScript({
          scriptContainer,
          hash: common.hexToUInt160(hash),
          witness: this.script,
        }),
      ),
    );
  }
}
