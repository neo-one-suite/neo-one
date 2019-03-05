import { SmartContract, Fixed, Blockchain, Address } from '@neo-one/smart-contract';
import { Crowdsale } from '../../../crowdsale';

/**
 * @title TimedCrowdsale
 * @dev Crowdsale accepting contributions only within a given time frame.
 */

export class TestCrowdsale extends Crowdsale(SmartContract) {
  protected readonly _token = Address.from('token');
  protected readonly _wallet = Address.from('wallet');
  protected mutableRate = 1;
}
