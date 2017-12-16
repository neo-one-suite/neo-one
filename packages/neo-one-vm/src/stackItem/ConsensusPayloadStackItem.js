/* @flow */
import type { ConsensusPayload } from '@neo-one/core';

import ObjectStackItem from './ObjectStackItem';

export default class ConsensusPayloadStackItem extends ObjectStackItem<
  ConsensusPayload,
> {
  asConsensusPayload(): ConsensusPayload {
    return this.value;
  }
}
