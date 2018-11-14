import { ConsensusPayload } from '@neo-one/node-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class ConsensusPayloadStackItem extends EquatableKeyStackItem<ConsensusPayload> {
  public asConsensusPayload(): ConsensusPayload {
    return this.value;
  }
}
