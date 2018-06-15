import { utils } from '@neo-one/utils';

export class ConsensusContext {
  private mutableFastForwardSeconds: number;

  public constructor() {
    this.mutableFastForwardSeconds = 0;
  }

  public nowSeconds(): number {
    return utils.nowSeconds() + this.mutableFastForwardSeconds;
  }

  public fastForwardOffset(seconds: number) {
    if (seconds >= 0) {
      this.mutableFastForwardSeconds += seconds;
    } else {
      throw new Error('Can only fast forward to future time.');
    }
  }

  public fastForwardToTime(seconds: number) {
    this.fastForwardOffset(seconds - utils.nowSeconds());
  }
}
