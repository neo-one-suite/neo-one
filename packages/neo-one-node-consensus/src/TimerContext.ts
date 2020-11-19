import { utils } from '@neo-one/utils';

export class TimerContext {
  private mutableFastForwardSeconds: number;

  public constructor() {
    this.mutableFastForwardSeconds = 0;
  }

  public nowSeconds(): number {
    return utils.nowSeconds() + this.mutableFastForwardSeconds;
  }

  public nowMilliseconds(): number {
    return Date.now() + this.mutableFastForwardSeconds * 1000;
  }

  public fastForwardOffset(seconds: number) {
    if (seconds >= 0) {
      this.mutableFastForwardSeconds += seconds;
    } else {
      throw new Error('Can only fast forward to future time.');
    }
  }

  public fastForwardToTime(seconds: number) {
    this.fastForwardOffset(seconds - this.nowSeconds());
  }
}
