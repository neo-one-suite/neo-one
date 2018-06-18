import { ConsensusPayload } from '@neo-one/client-core';
import { ObjectStackItem } from './ObjectStackItem';

export class ConsensusPayloadStackItem extends ObjectStackItem<ConsensusPayload> {
  public asConsensusPayload(): ConsensusPayload {
    return this.value;
  }
}
