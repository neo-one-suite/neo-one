import { Address, constant, Deploy, Fixed, MapStorage, SmartContract } from '@neo-one/smart-contract';

export class Token extends SmartContract {
  public readonly name = 'Eon';
  public readonly symbol = 'EON';
  public readonly decimals = 8;
  private readonly balances = MapStorage.for<Address, Fixed<8>>();
  private mutableSupply: Fixed<8> = 0;

  public constructor(public readonly owner: Address = Deploy.senderAddress) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
  }

  @constant
  public get totalSupply(): Fixed<8> {
    return this.mutableSupply;
  }

  @constant
  public balanceOf(address: Address): Fixed<8> {
    const balance = this.balances.get(address);

    return balance === undefined ? 0 : balance;
  }
}
