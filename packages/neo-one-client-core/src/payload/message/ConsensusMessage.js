/* @flow */
import {
  type DeserializeWire,
  type DeserializeWireBaseOptions,
  createDeserializeWire,
} from '../../Serializable';
import {
  InvalidConsensusMessageTypeError,
  assertConsensusMessageType,
} from './ConsensusMessageType';

import ChangeViewConsensusMessage from './ChangeViewConsensusMessage';
import PrepareRequestConsensusMessage from './PrepareRequestConsensusMessage';
import PrepareResponseConsensusMessage from './PrepareResponseConsensusMessage';

export type ConsensusMessage =
  | ChangeViewConsensusMessage
  | PrepareRequestConsensusMessage
  | PrepareResponseConsensusMessage;

export const deserializeWireBase = (
  options: DeserializeWireBaseOptions,
): ConsensusMessage => {
  const { reader } = options;
  const type = assertConsensusMessageType(reader.clone().readUInt8());
  switch (type) {
    case 0x00:
      return ChangeViewConsensusMessage.deserializeWireBase(options);
    case 0x20:
      return PrepareRequestConsensusMessage.deserializeWireBase(options);
    case 0x21:
      return PrepareResponseConsensusMessage.deserializeWireBase(options);
    default:
      // eslint-disable-next-line
      (type: empty);
      throw new InvalidConsensusMessageTypeError(type);
  }
};

export const deserializeWire: DeserializeWire<
  ConsensusMessage,
> = createDeserializeWire(deserializeWireBase);
