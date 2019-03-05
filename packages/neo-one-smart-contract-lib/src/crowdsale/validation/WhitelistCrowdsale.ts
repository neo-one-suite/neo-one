import { Address, Fixed, SmartContract } from '@neo-one/smart-contract';
import { WhitelistRole } from '../../access';
import { Crowdsale } from '../Crowdsale';

/**
 * @title WhitelistCrowdsale
 * @dev Crowdsale in which only whitelisted users can participate.
 */
export function WhitelistCrowdsale<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class WhitelistedCrowdsaleClass extends WhitelistRole(Crowdsale<Constructor<SmartContract>>(Base)) {
    /**
     * @dev Extend parent behavior requiring beneficiary to be whitelisted. Note that no
     * restriction is imposed on the account sending the transaction.
     * @param beneficiary beneficiary address
     * @param NEOAmount Amount of NEO contributed
     */
    protected _preValidatePurchase(purchaser: Address, beneficiary: Address, NEOAmount: Fixed<8>): boolean {
      return super._preValidatePurchase(purchaser, beneficiary, NEOAmount) && this.isWhitelisted(beneficiary);
    }
  }

  return WhitelistedCrowdsaleClass;
}
