import { Address, SmartContract } from '@neo-one/smart-contract';
import { DesignatedCaller } from '../../ownership/DesignatedCaller';

export class TestDesignatedCaller extends DesignatedCaller(SmartContract) {
  protected mutableDesignatedCaller: Address;

  public constructor(owner: Address) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.mutableDesignatedCaller = owner;
  }
}
