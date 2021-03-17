import { BinaryReader } from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from '../../Serializable';
import { ChangeViewConsensusMessage } from './ChangeViewConsensusMessage';
import { CommitConsensusMessage } from './CommitConsensusMessage';
import { assertConsensusMessageType, ConsensusMessageType } from './ConsensusMessageType';
import { PrepareRequestConsensusMessage } from './PrepareRequestConsensusMessage';
import { PrepareResponseConsensusMessage } from './PrepareResponseConsensusMessage';
import { RecoveryConsensusMessage } from './RecoveryConsensusMessage';
import { RecoveryRequestConsensusMessage } from './RecoveryRequestConsensusMessage';

export type ConsensusMessage =
  | ChangeViewConsensusMessage
  | CommitConsensusMessage
  | PrepareRequestConsensusMessage
  | PrepareResponseConsensusMessage
  | RecoveryConsensusMessage
  | RecoveryRequestConsensusMessage;

export const deserializeConsensusMessageWireBase = (
  { reader, context }: DeserializeWireBaseOptions,
  validatorsCount = 7,
): ConsensusMessage => {
  const options = {
    context,
    reader,
    validatorsCount,
  };

  const type = assertConsensusMessageType(reader.clone().readUInt8());
  switch (type) {
    case ConsensusMessageType.ChangeView:
      return ChangeViewConsensusMessage.deserializeWireBase(options);
    case ConsensusMessageType.Commit:
      return CommitConsensusMessage.deserializeWireBase(options);
    case ConsensusMessageType.PrepareRequest:
      return PrepareRequestConsensusMessage.deserializeWireBase(options);
    case ConsensusMessageType.PrepareResponse:
      return PrepareResponseConsensusMessage.deserializeWireBase(options);
    case ConsensusMessageType.RecoveryMessage:
      return RecoveryConsensusMessage.deserializeWireBase(options);
    case ConsensusMessageType.RecoveryRequest:
      return RecoveryRequestConsensusMessage.deserializeWireBase(options);
    default:
      utils.assertNever(type);
      throw new Error('For TS');
  }
};

export const deserializeConsensusMessageWire = ({ buffer, context }: DeserializeWireOptions, validatorsCount = 7) =>
  deserializeConsensusMessageWireBase(
    {
      context,
      reader: new BinaryReader(buffer),
    },
    validatorsCount,
  );
