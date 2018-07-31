/* istanbul ignore file */
// tslint:disable readonly-keyword readonly-array no-object-mutation strict-boolean-expressions
import { Address, constant, Fixed, MapStorage, SmartContract, verifySender } from '@neo-one/smart-contract';

export abstract class Token<Decimals extends number> extends SmartContract {
  public abstract readonly name: string;
  public abstract readonly decimals: Decimals;
  public abstract readonly symbol: string;
  private supply: Fixed<Decimals> = 0;
  private readonly balances: MapStorage<Address, Fixed<Decimals>> = new MapStorage();
  private readonly allowances: MapStorage<[Address, Address], Fixed<Decimals>> = new MapStorage();

  public transfer(from: Address, to: Address, amount: Fixed<Decimals>): void {
    verifySender(from);
    this.doTransfer(from, to, amount);
  }

  public transferFrom(from: Address, to: Address, amount: Fixed<Decimals>): void {
    const available = this.allowance(from, to);
    if (available < amount) {
      throw new Error('Insufficient funds approved');
    }

    this.doTransfer(from, to, amount);
    this.allowances.set([from, to], available - amount);
  }

  public approve(owner: Address, spender: Address, amount: Fixed<Decimals>): void {
    verifySender(owner);
    const fromValue = this.balanceOf(owner);
    if (fromValue < amount) {
      throw new Error('Insufficient funds');
    }

    this.allowances.set([owner, spender], this.allowance(owner, spender) + amount);
    this.onApprove(owner, spender, amount);
  }

  @constant
  public balanceOf(addr: Address): Fixed<Decimals> {
    return this.balances.get(addr) || 0;
  }

  @constant
  public allowance(owner: Address, spender: Address): Fixed<Decimals> {
    return this.allowances.get([owner, spender]) || 0;
  }

  public get totalSupply(): Fixed<Decimals> {
    return this.supply;
  }

  protected abstract onTransfer(from: Address | undefined, to: Address | undefined, amount: Fixed<Decimals>): void;
  protected abstract onApprove(owner: Address, spender: Address, amount: Fixed<Decimals>): void;

  protected issue(addr: Address, amount: Fixed<Decimals>): void {
    this.balances.set(addr, this.balanceOf(addr) + amount);
    this.supply += amount;
    this.onTransfer(undefined, addr, amount);
  }

  private doTransfer(from: Address, to: Address, amount: Fixed<Decimals>): void {
    if (amount <= 0) {
      throw new Error('Invalid amount');
    }

    const fromValue = this.balanceOf(from);
    if (fromValue < amount) {
      throw new Error('Insufficient funds');
    }

    this.balances.set(from, fromValue - amount);
    this.balances.set(to, this.balanceOf(to) + amount);
    this.onTransfer(from, to, amount);
  }
}
