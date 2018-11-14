import { helpers } from '../../../../__data__';

const properties = `
public readonly properties = {
  codeVersion: '1.0',
  author: 'dicarlo2',
  email: 'alex.dicarlo@neotracker.io',
  description: 'The TestSmartContract',
};
`;

describe('InvokeSmartContractHelper', () => {
  test('basic class extended with inherited property', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase extends SmartContract {
        public readonly foo: string = 'bar';
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        readonly foo: string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.foo, 'bar');
    `);
  });

  test('basic class extended with inherited method', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase extends SmartContract {
        private readonly x: string = 'bar';

        public bar(): string {
          return this.x;
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        bar(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.bar(), 'bar');
    `);
  });

  test('basic class extended with overriden property', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase extends SmartContract {
        public readonly foo: string = 'bar';
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}
        public readonly foo: string = 'baz';
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        readonly foo: string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.foo, 'baz');
    `);
  });

  test('basic class extended with overriden method', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase extends SmartContract {
        private readonly x: string = 'bar';

        public bar(): string {
          return this.x;
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}

        public bar(): string {
          return 'baz';
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean
        bar(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.bar(), 'baz');
    `);
  });

  test('basic class extended with super method', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase extends SmartContract {
        private readonly x: string = 'bar';

        public bar(): string {
          return this.x;
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}

        public bar(): string {
          return super.bar() + 'baz';
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        bar(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.bar(), 'barbaz');
    `);
  });
});
