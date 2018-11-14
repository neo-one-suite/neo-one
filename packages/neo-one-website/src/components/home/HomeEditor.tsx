import { FullEditor } from '@neo-one/editor';
import * as React from 'react';

const INITIAL_FILES: ReadonlyArray<{
  readonly path: string;
  readonly content: string;
  readonly writable: boolean;
  readonly open: boolean;
}> = [
  {
    path: 'one/contracts/Token.one.ts',
    content: `import {
  Address,
  Blockchain,
  constant,
  createEventNotifier,
  Hash256,
  receive,
  Fixed,
  MapStorage,
  SmartContract,
} from '@neo-one/smart-contract';

const notifyTransfer = createEventNotifier<Address | undefined, Address | undefined, Fixed<8>>(
  'transfer',
  'from',
  'to',
  'amount',
);

export class Token extends SmartContract {
  public readonly name = 'Eon';
  public readonly symbol = 'EON';
  public readonly decimals = 8;
  private readonly balances = MapStorage.for<Address, Fixed<8>>();
  private mutableSupply: Fixed<8> = 0;

  @constant
  public get totalSupply(): Fixed<8> {
    return this.mutableSupply;
  }

  @constant
  public balanceOf(address: Address): Fixed<8> {
    const balance = this.balances.get(address);

    return balance === undefined ? 0 : balance;
  }

  public transfer(from: Address, to: Address, amount: Fixed<8>): boolean {
    if (amount < 0) {
      throw new Error(\`Amount must be greater than 0: \${amount}\`);
    }

    if (!Address.isCaller(from)) {
      return false;
    }

    const fromBalance = this.balanceOf(from);
    if (fromBalance < amount) {
      return false;
    }

    const toBalance = this.balanceOf(to);
    this.balances.set(from, fromBalance - amount);
    this.balances.set(to, toBalance + amount);
    notifyTransfer(from, to, amount);

    return true;
  }

  @receive
  public mintTokens(): boolean {
    const { references, outputs } = Blockchain.currentTransaction;
    if (references.length === 0) {
      return false;
    }

    const sender = references[0].address;

    let amount = 0;
    for (const output of outputs) {
      if (output.address.equals(this.address)) {
        if (!output.asset.equals(Hash256.NEO)) {
          return false;
        }

        amount += output.value;
      }
    }

    this.issue(sender, amount);

    return true;
  }

  private issue(addr: Address, amount: Fixed<8>): void {
    this.balances.set(addr, this.balanceOf(addr) + amount);
    notifyTransfer(undefined, addr, amount);
  }
}
`,
    writable: true,
    open: true,
  },
  {
    path: 'one/tests/Token.test.ts',
    content: `import { Hash256 } from '@neo-one/client';
import BigNumber from 'bignumber.js';
import { withContracts } from '../generated/test';

jest.setTimeout(60000);

describe('Token', () => {
  test('has NEP-5 properties and methods', async () => {
    await withContracts(async ({ token, accountIDs }) => {
      expect(token).toBeDefined();

      const toAccountID = accountIDs[0];

      const [name, symbol, decimals, totalSupply, initialBalance] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply(),
        token.balanceOf(toAccountID.address),
      ]);
      expect(name).toEqual('Eon');
      expect(symbol).toEqual('EON');
      expect(decimals.toNumber()).toEqual(8);
      expect(totalSupply.toNumber()).toEqual(0);
      expect(initialBalance.toNumber()).toEqual(0);
    });
  });

  test('allows minting tokens and transferring them', async () => {
    await withContracts(async ({ token, accountIDs, masterAccountID }) => {
      expect(token).toBeDefined();

      const toAccountID = accountIDs[0];
      const mintReceipt = await token.mintTokens.confirmed({
        sendTo: [
          {
            amount: new BigNumber(1_000_000),
            asset: Hash256.NEO,
          },
        ],
      });
      if (mintReceipt.result.state === 'FAULT') {
        throw new Error(mintReceipt.result.message);
      }

      expect(mintReceipt.result.state).toEqual('HALT');
      expect(mintReceipt.result.value).toEqual(true);
      expect(mintReceipt.events).toHaveLength(1);
      let event = mintReceipt.events[0];
      expect(event.name).toEqual('transfer');
      if (event.name !== 'transfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toBeUndefined();
      expect(event.parameters.to).toEqual(masterAccountID.address);
      expect(event.parameters.amount.toNumber()).toEqual(1_000_000);

      let error: Error | undefined;
      try {
        await token.mintTokens.confirmed({
          sendTo: [
            {
              amount: new BigNumber(10),
              asset: Hash256.GAS,
            },
          ],
        });
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();

      const [totalSupply, balance, toBalance] = await Promise.all([
        token.totalSupply(),
        token.balanceOf(masterAccountID.address),
        token.balanceOf(toAccountID.address),
      ]);
      expect(totalSupply.toNumber()).toEqual(1_000_000);
      expect(balance.toNumber()).toEqual(1_000_000);
      expect(toBalance.toNumber()).toEqual(0);

      const transferAmount = new BigNumber(5);
      const transferReceipt = await token.transfer.confirmed(
        masterAccountID.address,
        toAccountID.address,
        transferAmount,
      );
      if (transferReceipt.result.state === 'FAULT') {
        throw new Error(transferReceipt.result.message);
      }
      expect(transferReceipt.result.state).toEqual('HALT');
      expect(transferReceipt.result.value).toEqual(true);

      // Verify the transfer event
      expect(transferReceipt.events).toHaveLength(1);
      event = transferReceipt.events[0];
      expect(event.name).toEqual('transfer');
      if (event.name !== 'transfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(masterAccountID.address);
      expect(event.parameters.to).toEqual(toAccountID.address);
      expect(event.parameters.amount.toNumber()).toEqual(transferAmount.toNumber());

    });
  });
});
`,
    writable: true,
    open: true,
  },
  {
    path: 'package.json',
    content: `{
  "dependencies": {
    "bignumber.js": "8.0.1"
  }
}`,
    writable: false,
    open: false,
  },
];

export const HomeEditor = () => (
  <FullEditor
    id="home"
    createPreviewURL={() =>
      process.env.NEO_ONE_PREVIEW_URL === undefined ? 'http://localhost:8080' : process.env.NEO_ONE_PREVIEW_URL
    }
    initialFiles={INITIAL_FILES}
    initialOptions={{
      preview: {
        enabled: false,
        open: false,
      },
    }}
    build
    clearFS
  />
);
