import {
  DeserializeWire,
  DeserializeWireBaseOptions,
  createDeserializeWire,
} from '../../Serializable';
import {
  assertConsensusMessageType,
  ConsensusMessageType,
} from './ConsensusMessageType';
import { ChangeViewConsensusMessage } from './ChangeViewConsensusMessage';
import { PrepareRequestConsensusMessage } from './PrepareRequestConsensusMessage';
import { PrepareResponseConsensusMessage } from './PrepareResponseConsensusMessage';

export type ConsensusMessage =
  | ChangeViewConsensusMessage
  | PrepareRequestConsensusMessage
  | PrepareResponseConsensusMessage;

export const deserializeConsensusMessageWireBase = (
  options: DeserializeWireBaseOptions,
): ConsensusMessage => {
  const { reader } = options;
  const type = assertConsensusMessageType(reader.clone().readUInt8());
  switch (type) {
    case ConsensusMessageType.ChangeView:
      return ChangeViewConsensusMessage.deserializeWireBase(options);
    case ConsensusMessageType.PrepareRequest:
      return PrepareRequestConsensusMessage.deserializeWireBase(options);
    case ConsensusMessageType.PrepareResponse:
      return PrepareResponseConsensusMessage.deserializeWireBase(options);
  }
};

export const deserializeConsensusMessageWire: DeserializeWire<
  ConsensusMessage
> = createDeserializeWire(deserializeConsensusMessageWireBase);
