import { Address, SmartContract, Fixed, constant, createEventNotifier } from '@neo-one/smart-contract';

/**
 * @title Crowdsale
 * @dev Crowdsale is a base contract for managing a token crowdsale,
 * allowing investors to purchase tokens with NEO. This contract implements
 * such functionality in its most fundamental form and can be extended to provide additional
 * functionality and/or custom behavior.
 * The EXTERNAL interface represents the basic interface for purchasing tokens, and conform
 * the base architecture for crowdsales. They are *not* intended to be modified / overridden.
 * The INTERNAL interface conforms the extensible and modifiable surface of crowdsales. Override
 * the methods to add functionality. Consider using 'super' where appropriate to concatenate
 * behavior.
 */

const tokens_purchased = createEventNotifier<Address | undefined, Address | undefined, Fixed<8>, Fixed<8>>(
  'tokens purchased',
  'from',
  'to',
  'value',
  'amount',
);

export function Crowdsale<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class CrowdsaleClass extends Base {
    protected abstract _token: Address;
    protected abstract _wallet: Address;
    protected mutableNEORaised: Fixed<0> = 0;
    // How many token per NEO
    protected abstract mutableRate: Fixed<8> = 1;

    @constant
    public neoRaised(): Fixed<0> {
      return this.mutableNEORaised;
    }
    public get rate(): Fixed<8> {
      return this.mutableRate;
    }
    public get wallet(): Address {
      return this._wallet;
    }
    public get token(): Address {
      return this._token;
    }

    public buyTokens(purchaser: Address, beneficiary: Address, NEOAmount: Fixed<8>): boolean {
      if (!this._preValidatePurchase(purchaser, beneficiary, NEOAmount)) {
        return false;
      }
      const tokens = this._getTokenAmount(NEOAmount);
      this.mutableNEORaised += NEOAmount;
      this._processPurchase(purchaser, beneficiary, tokens);
      this._updatePurchasingState(purchaser, beneficiary, NEOAmount);
      this._forwardFunds();
      if (!this._postValidatePurchase(purchaser, beneficiary, NEOAmount)) {
        throw new Error('Rollback ');
      }
      this._postValidatePurchase;

      tokens_purchased(purchaser, beneficiary, NEOAmount, tokens);

      return true;
    }
    protected _preValidatePurchase(purchaser: Address, beneficiary: Address, NEOAmount: Fixed<8>) {
      return NEOAmount > 0 && beneficiary.length === 20;
    }
    protected _getTokenAmount(NEOAmount: Fixed<8>): Fixed<8> {
      return this.rate * NEOAmount;
    }
    protected _processPurchase(purchaser: Address, beneficiary: Address, NEOAmount: Fixed<8>) {
      // Override with alternate or supplemental purchase logic
    }
    protected _updatePurchasingState(purchaser: Address, beneficiary: Address, NEOAmount: Fixed<8>) {
      // Override with logic for updating state upon purchase
    }
    protected _postValidatePurchase(purchaser: Address, beneficiary: Address, NEOAmount: Fixed<8>) {
      return true; // Override with logic for post validation, hint: throw an error to rollback the whole transaction
    }

    protected _deliverTokens(beneficiary: Address, tokenAmount: Fixed<8>) {
      // Override with alternate or supplemental token delivery logic
    }
    protected _forwardFunds() {
      // forward remaining OUTPUTS to wallet
    }
  }

  return CrowdsaleClass;
}
