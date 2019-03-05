import { SmartContract, Fixed, constant, Blockchain } from '@neo-one/smart-contract';
import { TimedCrowdsale } from '../';
/**
 * @title IncreasingPriceCrowdsale
 * @dev Extension of Crowdsale contract that increases the price of tokens linearly in time.
 * Note that what should be provided to the constructor is the initial and final _rates_, that is,
 * the amount of tokens per NEO contributed. Thus, the initial rate must be greater than the final rate.
 */
function IncreasingPriceCrowdsale<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class IncreasingPriceCrowdsaleClass extends TimedCrowdsale<Constructor<SmartContract>>(Base) {
    protected abstract _initialRate: Fixed<8>;
    protected abstract _finalRate: Fixed<8>;

    /**
     * @dev Validate configuration, reviews initial and final rates of tokens received per NEO contributed.
     */
    @constant
    validateConfiguration() {
      if (this._finalRate <= 0 || this._initialRate < this._finalRate) {
        throw new Error(' bad configuration ');
      }
    }

    /**
     * @return the initial rate of the crowdsale.
     */
    @constant
    public get startRate(): Fixed<8> {
      return this._initialRate;
    }

    /**
     * @return the final rate of the crowdsale.
     */
    @constant
    public get finalRate() {
      return this._finalRate;
    }

    /**
     * @dev Returns the rate of tokens per NEO at the present time.
     * Note that, as price _increases_ with time, the rate _decreases_.
     * @return The number of tokens a buyer gets per NEO at a given time
     */
    public get rate() {
      if (!this.isOpen()) {
        return 0;
      }

      const elapsedTime = Blockchain.currentBlockTime - this.openingTime;
      const timeRange = this.closingTime - this.openingTime;
      const rateRange = this._initialRate - this._finalRate;

      return this._initialRate - (elapsedTime * rateRange) / timeRange;
    }

    /**
     * @dev Overrides parent method taking into account variable rate.
     * @param NEOAmount The value in NEO to be converted into tokens
     * @return The number of tokens _NEOAmount NEO will buy at present time
     */
    protected _getTokenAmount(NEOAmount: Fixed<8>): Fixed<8> {
      return this.rate * NEOAmount;
    }
  }

  return IncreasingPriceCrowdsaleClass;
}
