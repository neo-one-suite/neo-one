import { common } from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { helpers, keys } from '../../../../__data__';

describe('Blockchain', () => {
  test('currentHeight', async () => {
    const node = await helpers.startNode();

    await node.executeString(`
      import { Blockchain } from '@neo-one/smart-contract';

      const x = Blockchain;
      assertEqual(x.currentHeight === 0 || x.currentHeight === 1, true);
    `);
  });

  test('set currentHeight', async () => {
    helpers.compileString(
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
    helpers.compileString(
      `
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentBlockTime = 10;
    `,
      { type: 'error' },
    );
  });

  test('currentTransaction', async () => {
    const node = await helpers.startNode();

    const data = Buffer.from('Hello World', 'utf8').toString('hex');

    await node.executeString(
      `
      import { AttributeUsage, Blockchain, TransactionType } from '@neo-one/smart-contract';

      const { currentTransaction: transaction } = Blockchain;

      assertEqual(transaction.type, TransactionType.Invocation);

      const attributes = transaction.attributes;
      assertEqual(attributes.length, 3);

      const attribute = attributes[0];

      assertEqual(attribute.usage, AttributeUsage.Description);
      assertEqual(attribute.data.equals(${helpers.getBufferHash(data)}), true)

      assertEqual(transaction.inputs.length, 1);
      assertEqual(transaction.outputs.length, 2);
      assertEqual(transaction.references.length, 1);
      assertEqual(transaction.unspentOutputs.length, 2);
    `,
      {
        transfers: [
          {
            to: keys[0].address,
            amount: new BigNumber(10),
            asset: common.NEO_ASSET_HASH,
          },
        ],
        attributes: [
          {
            usage: 'Description',
            data,
          },
        ],
      },
    );
  });

  test('set currentTransaction', async () => {
    helpers.compileString(
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
    helpers.compileString(
      `
      import { Blockchain } from '@neo-one/smart-contract';

      Blockchain.currentCallerContract = Blockchain.currentCallerContract;
    `,
      { type: 'error' },
    );
  });
});
