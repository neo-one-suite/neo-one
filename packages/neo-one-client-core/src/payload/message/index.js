/* @flow */
export {
  default as ChangeViewConsensusMessage,
} from './ChangeViewConsensusMessage';
export {
  default as PrepareRequestConsensusMessage,
} from './PrepareRequestConsensusMessage';
export {
  default as PrepareResponseConsensusMessage,
} from './PrepareResponseConsensusMessage';

export { CONSENSUS_MESSAGE_TYPE } from './ConsensusMessageType';
export {
  deserializeWire as deserializeConsensusMessageWire,
} from './ConsensusMessage';

export type { ConsensusMessage } from './ConsensusMessage';
