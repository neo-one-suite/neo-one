import {
  Address,
  Blockchain,
  constant,
  createEventNotifier,
  Fixed,
  Hash256,
  receive,
  SmartContract,
} from '@neo-one/smart-contract';
import { Ownable } from '../ownership/Ownable';

const notifyTokensPurchased = createEventNotifier<Address, Fixed<8>, Fixed<8>>(
  'tokens_purchased',
  'account',
  'NEO',
  'qty tokens',
);

export function CrowdsaleContract() {
  abstract class CrowdsaleContractClass extends Ownable(SmartContract) {
    public readonly token: Address = this.initialCrowdsaleToken();
    public readonly rate: Fixed<8> = this.initialCrowdsaleRate();
    public readonly wallet: Address = this.initialCrowdsaleWallet();
    protected mutableNeoRaised: Fixed<8> = 0;

    @constant
    public get neoRaised(): Fixed<8> {
      return this.mutableNeoRaised;
    }

    @receive
    public mintTokens(): boolean {
      const { references } = Blockchain.currentTransaction;
      if (references.length === 0) {
        return false;
      }
      const sender = references[0].address;

      let amountNeo = 0;
      // tslint:disable-next-line no-loop-statement
      for (const output of Blockchain.currentTransaction.outputs) {
        if (output.address.equals(this.address)) {
          if (!output.asset.equals(Hash256.NEO)) {
            return false;
          }

          amountNeo += output.value;
        }
      }

      this.issue(sender, amountNeo);

      return true;
    }

    protected issue(account: Address, amountNeo: Fixed<8>): boolean {
      this.preValidatePurchase(account, amountNeo);
      const tokens = this.getTokenAmount(amountNeo);
      this.mutableNeoRaised += amountNeo;
      this.processPurchase(account, tokens);
      notifyTokensPurchased(account, amountNeo, tokens);
      this.updatePurchasingState(account, amountNeo);
      this.forwardFunds(amountNeo, account);
      this.postValidatePurchase(account, amountNeo);

      return true;
    }

    // Override these functions with your configuration.
    protected abstract initialCrowdsaleWallet(): Address;
    protected abstract initialCrowdsaleRate(): Fixed<8>;
    protected abstract initialCrowdsaleToken(): Address;

    // PITFALL: Remember, when layering functionality in different classes, remember to
    // call the corresponding super._fnx() to ensure the chain of checks is maintained.

    /* tslint:disable: no-unused no-empty */
    protected preValidatePurchase(purchaser: Address, amount: Fixed<8>) {
      // override with any pre-purchase checks
    }

    protected processPurchase(purchaser: Address, tokens: Fixed<8>) {
      // override with any purchase-process
    }

    protected updatePurchasingState(purchaser: Address, amount: Fixed<8>) {
      // override with any state updates required
    }

    protected forwardFunds(amount: Fixed<8>, account: Address) {
      // override with your method of forwarding funds
    }

    protected postValidatePurchase(purchaser: Address, amount: Fixed<8>) {
      // override with any post purchase validation checks
    }

    protected getTokenAmount(amountNeo: Fixed<8>) {
      return amountNeo * this.rate;
    }
  }

  return CrowdsaleContractClass;
}
