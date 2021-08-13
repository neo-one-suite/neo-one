import { common } from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { helpers, keys } from '../../../../__data__';

const properties = `
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: "*",
  };
`;

describe('Blockchain', () => {
  test('networkNumber', async () => {
    const node = await helpers.startNode();

    await node.executeString(`
      import { Blockchain } from '@neo-one/smart-contract';

      assertEqual(Blockchain.networkNumber, ${7630401}); // This comes from createPriv.ts network number
    `);
  });

  test('set networkNumber', async () => {
    await helpers.compileString(
      `
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.networkNumber = 10;
    `,
      { type: 'error' },
    );
  });

  test('randomNumber', async () => {
    const node = await helpers.startNode();

    await node.executeString(`
      import { Blockchain } from '@neo-one/smart-contract';

      assertEqual(typeof Blockchain.randomNumber, 'number');
    `);
  });

  test('set randomNumber', async () => {
    await helpers.compileString(
      `
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.randomNumber = 10;
    `,
      { type: 'error' },
    );
  });

  test('currentHeight', async () => {
    const node = await helpers.startNode();

    await node.executeString(`
      import { Blockchain } from '@neo-one/smart-contract';

      const x = Blockchain;
      assertEqual(x.currentHeight === 0 || x.currentHeight === 1, true);
    `);
  });

  test('set currentHeight', async () => {
    await helpers.compileString(
      `
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentHeight = 10;
    `,
      { type: 'error' },
    );
  });

  test('currentBlockTime', async () => {
    const node = await helpers.startNode();

    await node.executeString(`
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentBlockTime;
      assertEqual(Blockchain.currentBlockTime > 0, true);
    `);
  });

  test('set currentBlockTime', async () => {
    await helpers.compileString(
      `
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentBlockTime = 10;
    `,
      { type: 'error' },
    );
  });

  test('currentBlockTimeMilliseconds', async () => {
    const node = await helpers.startNode();

    await node.executeString(`
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentBlockTimeMilliseconds;
      assertEqual(Blockchain.currentBlockTimeMilliseconds > 0, true);
    `);
  });

  test('set currentBlockTimeMilliseconds', async () => {
    await helpers.compileString(
      `
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentBlockTimeMilliseconds = 10;
    `,
      { type: 'error' },
    );
  });

  test('currentTransaction', async () => {
    const node = await helpers.startNode();

    const sender = node.masterWallet.userAccount.id.address;
    const validUntilBlock = 5760;
    const systemFee = 0;
    const networkFee = 0;
    const script = `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`;

    await node.executeString(
      `
      import { Address, Blockchain, Transaction } from '@neo-one/smart-contract';

      const { currentTransaction: transaction } = Blockchain;

      // assertEqual(transaction.height, 0);
      assertEqual(transaction.version, 0);
      assertEqual(typeof transaction.nonce, 'number');
      assertEqual(transaction.sender, Address.from('${sender}'));
      // assertEqual(transaction.validUntilBlock, ${validUntilBlock});
      assertEqual(transaction.systemFee, ${systemFee});
      assertEqual(transaction.networkFee, ${networkFee});
      // assertEqual(transaction.script, ${helpers.getBufferHash(script, 'base64')});
      assertEqual(transaction instanceof Transaction, true);
    `,
    );
  });

  // TODO: need to test GAS transfers as well but work just fine
  test('curretTransfers', async () => {
    const node = await helpers.startNode();
    const testContract = await node.addContract(
      `
      import { Address, Blockchain, SmartContract, Transfer } from '@neo-one/smart-contract';

      export class Contract extends SmartContract {
        ${properties}

        public test() {
          const { currentNEOTransfers: transfers } = Blockchain;
          const transfer = transfers[0];
          assertEqual(transfers.length, 1);
          assertEqual(transfer instanceof Transfer, true);
          assertEqual(transfer.amount, 10);
          assertEqual(transfer.asset, Address.from('${common.nativeScriptHashes.NEO}'));
          assertEqual(transfer.from, Address.from('${node.masterWallet.userAccount.id.address}'));
          assertEqual(transfer.to, Address.from('${keys[0].address}'));
        }
      }
    `,
    );

    await node.executeString(
      `
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Caller {
        readonly test: () => void;
      }

      const testContract = SmartContract.for<Caller>(Address.from('${testContract.address}'));
      testContract.test();
    `,
      {
        transfers: [
          {
            to: keys[0].address,
            amount: new BigNumber(10),
            asset: common.nativeScriptHashes.NEO,
          },
        ],
        attributes: [],
      },
    );
  });

  test('set currentTransaction', async () => {
    await helpers.compileString(
      `
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentTransaction = Blockchain.currentTransaction;
    `,
      { type: 'error' },
    );
  });

  test('currentCallerContract', async () => {
    const node = await helpers.startNode();

    const currentCallerContract = await node.addContract(`
      import { Address, Blockchain, SmartContract } from '@neo-one/smart-contract';

      export class Contract extends SmartContract {
        public test(address: Address | undefined): boolean {
          assertEqual(address, Blockchain.currentCallerContract);

          return true;
        }
      }
    `);

    const testContract = await node.addContract(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Caller {
        readonly test: (address: Address) => boolean;
      }

      export class Contract extends SmartContract {
        public test(): boolean {
          const contract = SmartContract.for<Caller>(Address.from('${currentCallerContract.address}'));
          assertEqual(contract.test(this.address), true);

          return true;
        }
      }
    `);

    await node.executeString(
      `
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Caller {
        readonly test: () => boolean;
      }
      const testContract = SmartContract.for<Caller>(Address.from('${testContract.address}'));
      assertEqual(testContract.test(), true);

      interface TestCaller {
        readonly test: (address: Address | undefined) => boolean;
      }
      const contract = SmartContract.for<TestCaller>(Address.from('${currentCallerContract.address}'));
      assertEqual(contract.test(undefined), true);
    `,
    );
  });

  test('set currentCallerContract', async () => {
    await helpers.compileString(
      `
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentCallerContract = Blockchain.currentCallerContract;
    `,
      { type: 'error' },
    );
  });
});
