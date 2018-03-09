/* @flow */
import { utils } from '@neo-one/utils';

export default class ConsensusContext {
  _fastForwardSeconds: number;

  constructor() {
    this._fastForwardSeconds = 0;
  }

  nowSeconds(): number {
    return utils.nowSeconds() + this._fastForwardSeconds;
  }

  fastForwardOffset(seconds: number) {
    if (seconds >= 0) {
      this._fastForwardSeconds += seconds;
    } else {
      throw new Error('Can only fast forward to future time.');
    }
  }

  fastForwardToTime(seconds: number) {
    this.fastForwardOffset(seconds - utils.nowSeconds());
  }
}
