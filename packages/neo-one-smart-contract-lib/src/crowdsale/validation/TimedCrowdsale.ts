import { SmartContract, Fixed, Blockchain } from '@neo-one/smart-contract';
import { Crowdsale } from '../Crowdsale';

/**
 * @title TimedCrowdsale
 * @dev Crowdsale accepting contributions only within a given window of time.
 */

export function TimedCrowdsale<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class TimedCrowdsaleClass extends Crowdsale<Constructor<SmartContract>>(Base) {
    protected abstract mutableOpeningTime: Fixed<0> = Blockchain.currentBlockTime;
    protected abstract mutableClosingTime: Fixed<0> = 0;

    protected get closingTime() {
      return this.mutableClosingTime;
    }
    protected get openingTime() {
      return this.mutableOpeningTime;
    }
    public isOpen() {
      return Blockchain.currentBlockTime <= this.mutableOpeningTime;
    }
    public hasClosed() {
      return Blockchain.currentBlockTime > this.mutableOpeningTime;
    }
  }

  return TimedCrowdsaleClass;
}
