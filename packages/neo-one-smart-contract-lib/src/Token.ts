// tslint:disable readonly-keyword readonly-array no-object-mutation strict-boolean-expressions
import {
  Address,
  constant,
  Contract,
  ContractProperties,
  Fixed,
  MapStorage,
  SmartContract,
} from '@neo-one/smart-contract';

export abstract class Token<Decimals extends number> implements SmartContract {
  public abstract owner: Address;
  public abstract readonly properties: ContractProperties;
  public abstract readonly name: string;
  public abstract readonly decimals: Decimals;
  public abstract readonly symbol: string;
  protected mutableSupply: Fixed<Decimals> = 0;
  protected readonly balances = MapStorage.for<Address, Fixed<Decimals>>();

  @constant
  public get totalSupply(): Fixed<Decimals> {
    return this.mutableSupply;
  }

  @constant
  public balanceOf(address: Address): Fixed<Decimals> {
    const balance = this.balances.get(address);

    return balance === undefined ? 0 : balance;
  }

  public transfer(from: Address, to: Address, amount: Fixed<Decimals>): boolean {
    if (amount < 0) {
      throw new Error(`Amount must be greater than 0: ${amount}`);
    }

    if (!Address.isSender(from)) {
      return false;
    }

    const contract = Contract.for(to);
    if (contract !== undefined && !contract.payable) {
      return false;
    }

    const fromBalance = this.balanceOf(from);
    if (fromBalance < amount) {
      return false;
    }

    const toBalance = this.balanceOf(to);
    this.balances.set(from, fromBalance - amount);
    this.balances.set(to, toBalance + amount);
    this.notifyTransfer(from, to, amount);

    return true;
  }

  protected abstract notifyTransfer(from: Address | undefined, to: Address | undefined, amount: Fixed<Decimals>): void;

  protected issue(addr: Address, amount: Fixed<Decimals>): void {
    this.balances.set(addr, this.balanceOf(addr) + amount);
    this.mutableSupply += amount;
    this.notifyTransfer(undefined, addr, amount);
  }
}
