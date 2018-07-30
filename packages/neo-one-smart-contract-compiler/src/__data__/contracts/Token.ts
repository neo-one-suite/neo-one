// tslint:disable readonly-keyword readonly-array no-object-mutation prefer-switch
class Token {
  public readonly name: string = 'TestToken';
  public readonly decimals: number = 8;
  public readonly symbol: string = 'TT';
  private readonly totalSupplyKey: string = 'total_supply';
  private readonly ownerKey: string = 'owner';

  public deploy(owner: Buffer): boolean {
    syscall('Neo.Storage.Put', syscall('Neo.Storage.GetContext'), this.ownerKey, owner);

    return true;
  }

  public transfer(from: Buffer, to: Buffer, amount: number): void {
    if (syscall('Neo.Runtime.CheckWitness', from)) {
      this.doTransfer(from, to, amount);
    } else {
      throw new Error('Invalid witness');
    }
  }

  public balanceOf(addr: Buffer): number {
    return (
      (syscall('Neo.Storage.Get', syscall('Neo.Storage.GetContext'), this.getKey(addr)) as number | undefined) || 0
    );
  }

  public get totalSupply(): number {
    return this.supply;
  }

  private get supply(): number {
    return (
      (syscall('Neo.Storage.Get', syscall('Neo.Storage.GetContext'), this.totalSupplyKey) as number | undefined) || 0
    );
  }

  private set supply(value: number) {
    syscall('Neo.Storage.Put', syscall('Neo.Storage.GetContext'), this.totalSupplyKey, value);
  }

  public issue(addr: Buffer, amount: number): void {
    if (syscall('Neo.Runtime.CheckWitness', this.getOwner())) {
      this.setBalance(addr, this.balanceOf(addr) + amount);
      this.supply += amount;
      syscall('Neo.Runtime.Notify', 'transfer', syscall('System.ExecutionEngine.GetExecutingScriptHash'), addr, amount);
    } else {
      throw new Error('Invalid witness');
    }
  }

  public getOwner(): Buffer {
    return syscall('Neo.Storage.Get', syscall('Neo.Storage.GetContext'), this.ownerKey) as Buffer;
  }

  private doTransfer(from: Buffer, to: Buffer, amount: number): void {
    if (amount <= 0) {
      throw new Error('Invalid amount');
    }

    const fromValue = this.balanceOf(from);
    if (fromValue < amount) {
      throw new Error('Insufficient funds');
    }

    this.setBalance(from, fromValue - amount);
    this.setBalance(to, this.balanceOf(to) + amount);

    syscall('Neo.Runtime.Notify', 'transfer', from, to, amount);
  }

  private setBalance(addr: Buffer, amount: number): void {
    syscall('Neo.Storage.Put', syscall('Neo.Storage.GetContext'), this.getKey(addr), amount);
  }

  private getKey(addr: Buffer): Buffer {
    return Buffer.concat([syscall('Neo.Runtime.Serialize', 'balances'), addr]);
  }
}

const method = syscall('Neo.Runtime.GetArgument', 0) as string;
const token = new Token();
if (syscall('Neo.Runtime.GetTrigger') === 0x10) {
  if (method === 'deploy') {
    const args = syscall('Neo.Runtime.GetArgument', 1) as [Buffer];
    syscall('Neo.Runtime.Return', token.deploy(args[0]));
  } else if (method === 'name') {
    syscall('Neo.Runtime.Return', token.name);
  } else if (method === 'decimals') {
    syscall('Neo.Runtime.Return', token.decimals);
  } else if (method === 'symbol') {
    syscall('Neo.Runtime.Return', token.symbol);
  } else if (method === 'totalSupply') {
    syscall('Neo.Runtime.Return', token.totalSupply);
  } else if (method === 'owner') {
    syscall('Neo.Runtime.Return', token.getOwner());
  } else if (method === 'balanceOf') {
    const args = syscall('Neo.Runtime.GetArgument', 1) as [Buffer];
    syscall('Neo.Runtime.Return', token.balanceOf(args[0]));
  } else if (method === 'transfer') {
    const args = syscall('Neo.Runtime.GetArgument', 1) as [Buffer, Buffer, number];
    token.transfer(args[0], args[1], args[2]);
    syscall('Neo.Runtime.Return', true);
  } else if (method === 'issue') {
    const args = syscall('Neo.Runtime.GetArgument', 1) as [Buffer, number];
    token.issue(args[0], args[1]);
    syscall('Neo.Runtime.Return', true);
  } else {
    throw new Error('Unknown method');
  }
} else if (syscall('Neo.Runtime.GetTrigger') === 0x00) {
  if (!syscall('Neo.Runtime.CheckWitness', token.getOwner())) {
    throw new Error('Invalid witness');
  }
} else {
  throw new Error('Unsupported trigger');
}
