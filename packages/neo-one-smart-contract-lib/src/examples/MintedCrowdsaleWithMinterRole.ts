import { Address, constant, Contract, createEventNotifier, Fixed, SmartContract } from '@neo-one/smart-contract';
import { CrowdsaleWithMinterRole } from '../emission/CrowdsaleWithMinterRole';

const notifyTokensMinted = createEventNotifier<Address, Address, Fixed<8>, Fixed<8>>(
  'tokens_minted',
  'purchaser',
  'beneficiary',
  'NEO',
  'qty tokens',
);
interface MintableToken {
  readonly issue: (addr: Address, amount: Fixed<8>) => void;
}
export abstract class MintedCrowdsaleWithMinterRole extends CrowdsaleWithMinterRole {
  protected _deliverTokens(beneficiary: Address, tokenAmount: Fixed<8>) {
    const contract = Contract.for(this.token);
    if (contract !== undefined && !Address.isCaller(this.token)) {
      const smartContract = SmartContract.for<MintableToken>(this.token);

      const issueRequest = smartContract.issue(beneficiary, tokenAmount);
    }

    const smartContract = SmartContract.for<MintableToken>(this.token);
    notifyTokensMinted;
    smartContract.issue(beneficiary, tokenAmount);
  }
}
