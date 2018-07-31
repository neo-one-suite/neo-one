/* istanbul ignore file */
// tslint:disable readonly-array no-object-mutation prefer-switch
import { Address, Fixed, MapStorage, SmartContract, verifySender } from './transpiledLib';

export abstract class Token<Decimals extends number> extends SmartContract {
  public abstract readonly name: string;
  public abstract readonly decimals: Decimals;
  public abstract readonly symbol: string;
  private readonly balances: MapStorage<Address, Fixed<Decimals>> = new MapStorage(
    syscall('Neo.Runtime.Serialize', 'balances'),
  );
  private readonly allowances: MapStorage<[Address, Address], Fixed<Decimals>> = new MapStorage(
    syscall('Neo.Runtime.Serialize', 'allowances'),
  );

  public deploy(owner: Address): boolean {
    super.deploy(owner);
    this.supply = 0;

    return true;
  }

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
  }

  public balanceOf(addr: Address): Fixed<Decimals> {
    return this.balances.get(addr) || 0;
  }

  public allowance(owner: Address, spender: Address): Fixed<Decimals> {
    return this.allowances.get([owner, spender]) || 0;
  }

  public get totalSupply(): Fixed<Decimals> {
    return this.supply;
  }

  protected issue(addr: Address, amount: Fixed<Decimals>): void {
    this.balances.set(addr, this.balanceOf(addr) + amount);
    this.supply += amount;
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
  }

  private get supply(): Fixed<Decimals> {
    return syscall('Neo.Storage.Get', syscall('Neo.Storage.GetContext'), 'supply') as Fixed<Decimals>;
  }

  private set supply(supply: Fixed<Decimals>) {
    syscall('Neo.Storage.Put', syscall('Neo.Storage.GetContext'), 'supply', supply);
  }
}
