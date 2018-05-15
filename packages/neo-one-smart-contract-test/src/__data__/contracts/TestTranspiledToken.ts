import { Address, verifySender } from './transpiledLib';
import { Token } from './TranspiledToken';

export class TestToken extends Token<4> {
  public readonly name: string = 'TestToken';
  public readonly decimals: 4 = 4;
  public readonly symbol: string = 'TT';

  public deploy(owner: Address): boolean {
    super.deploy(owner);
    verifySender(owner);
    this.issue(owner, 1000000);
    return true;
  }
}

const contract = new TestToken();
const method = syscall('Neo.Runtime.GetArgument', 0) as string;
if (syscall('Neo.Runtime.GetTrigger') === 0x10) {
  if (method === 'name') {
    syscall('Neo.Runtime.Return', contract.name);
  } else if (method === 'decimals') {
    syscall('Neo.Runtime.Return', contract.decimals);
  } else if (method === 'symbol') {
    syscall('Neo.Runtime.Return', contract.symbol);
  } else if (method === 'deploy') {
    const args = syscall('Neo.Runtime.GetArgument', 1) as [Buffer];
    syscall('Neo.Runtime.Return', contract.deploy(args[0]));
  } else if (method === 'transfer') {
    const args = syscall('Neo.Runtime.GetArgument', 1) as [
      Buffer,
      Buffer,
      number
    ];
    contract.transfer(args[0], args[1], args[2]);
  } else if (method === 'transferFrom') {
    const args = syscall('Neo.Runtime.GetArgument', 1) as [
      Buffer,
      Buffer,
      number
    ];
    contract.transferFrom(args[0], args[1], args[2]);
  } else if (method === 'approve') {
    const args = syscall('Neo.Runtime.GetArgument', 1) as [
      Buffer,
      Buffer,
      number
    ];
    contract.approve(args[0], args[1], args[2]);
  } else if (method === 'balanceOf') {
    const args = syscall('Neo.Runtime.GetArgument', 1) as [Buffer];
    syscall('Neo.Runtime.Return', contract.balanceOf(args[0]));
  } else if (method === 'allowance') {
    const args = syscall('Neo.Runtime.GetArgument', 1) as [Buffer, Buffer];
    syscall('Neo.Runtime.Return', contract.allowance(args[0], args[1]));
  } else if (method === 'totalSupply') {
    syscall('Neo.Runtime.Return', contract.totalSupply);
  } else if (method === 'owner') {
    syscall('Neo.Runtime.Return', contract.owner);
  } else {
    throw new Error('Unknown method');
  }
} else if (syscall('Neo.Runtime.GetTrigger') === 0x00) {
  if (!syscall('Neo.Runtime.CheckWitness', contract.owner)) {
    throw new Error('Invalid witness');
  }
} else {
  throw new Error('Unsupported trigger');
}
