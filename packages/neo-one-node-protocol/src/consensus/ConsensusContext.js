/* @flow */
import { utils } from '@neo-one/utils';

export default class ConsensusContext {
  fastForwardSeconds: number;

  constructor({ fastForwardSeconds }: {| fastForwardSeconds: number |}) {
    this.fastForwardSeconds = fastForwardSeconds;
  }

  currentCustomTime(): number {
    return utils.nowSeconds() + this.fastForwardSeconds;
  }

  fastForwardOffset(seconds: number) {
    this.fastForwardSeconds += seconds;
  }

  fastForwardToTime(seconds: number) {
    this.fastForwardSeconds = seconds;
  }
}
