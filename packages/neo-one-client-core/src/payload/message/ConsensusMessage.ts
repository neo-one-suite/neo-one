import { utils } from '@neo-one/utils';
import { createDeserializeWire, DeserializeWireBaseOptions } from '../../Serializable';
import { ChangeViewConsensusMessage } from './ChangeViewConsensusMessage';
import { assertConsensusMessageType, ConsensusMessageType } from './ConsensusMessageType';
import { PrepareRequestConsensusMessage } from './PrepareRequestConsensusMessage';
import { PrepareResponseConsensusMessage } from './PrepareResponseConsensusMessage';

export type ConsensusMessage =
  | ChangeViewConsensusMessage
  | PrepareRequestConsensusMessage
  | PrepareResponseConsensusMessage;

export const deserializeConsensusMessageWireBase = (options: DeserializeWireBaseOptions): ConsensusMessage => {
  const { reader } = options;
  const type = assertConsensusMessageType(reader.clone().readUInt8());
  switch (type) {
    case ConsensusMessageType.ChangeView:
      return ChangeViewConsensusMessage.deserializeWireBase(options);
    case ConsensusMessageType.PrepareRequest:
      return PrepareRequestConsensusMessage.deserializeWireBase(options);
    case ConsensusMessageType.PrepareResponse:
      return PrepareResponseConsensusMessage.deserializeWireBase(options);
    default:
      utils.assertNever(type);
      throw new Error('For TS');
  }
};

export const deserializeConsensusMessageWire = createDeserializeWire(deserializeConsensusMessageWireBase);
