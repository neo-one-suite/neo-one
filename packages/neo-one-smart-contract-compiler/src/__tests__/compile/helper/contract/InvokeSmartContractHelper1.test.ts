import { helpers, keys } from '../../../../__data__';

const properties = `
public readonly properties = {
  codeVersion: '1.0',
  author: 'dicarlo2',
  email: 'alex.dicarlo@neotracker.io',
  description: 'The TestSmartContract',
  payable: true,
};
`;

describe('InvokeSmartContractHelper', () => {
  test('basic class with method', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract implements SmartContract {
        ${properties}

        public constructor(public readonly owner: Address = Address.from('${keys[0].address}')) {
        }

        public foo(): number {
          return 10;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        readonly owner: Address;
        deploy(owner?: Address): boolean;
        foo(): number;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.foo(), 10);
    `);
  });

  test('basic class with get accessor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract implements SmartContract {
        ${properties}
        private readonly x: string = 'bar';

        public constructor(
          public readonly owner: Address = Address.from('${keys[0].address}'),
        ) {
        }

        public get bar() {
          return this.x;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        readonly owner: Address;
        readonly bar: string;
        deploy(owner?: Address): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.bar, 'bar');
    `);
  });

  test('basic class with set accessor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract implements SmartContract {
        ${properties}
        public x: string = 'bar';

        public constructor(
          public readonly owner: Address = Address.from('${keys[0].address}'),
        ) {
        }

        public set bar(x: string) {
          this.x = x;
        }

        public getX() {
          return this.x;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        readonly owner: Address;
        readonly x: string;
        setBar(value: string): void;
        deploy(owner?: Address): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.x, 'bar');
      contract.setBar('baz');
      assertEqual(contract.x, 'baz');
    `);
  });

  test('basic class with get/set accessor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract implements SmartContract {
        ${properties}
        private x: string = 'bar';

        public constructor(
          public readonly owner: Address = Address.from('${keys[0].address}'),
        ) {
        }

        public get bar(): string {
          return this.x;
        }

        public set bar(x: string) {
          this.x = x;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        readonly owner: Address;
        bar: string;
        deploy(owner?: Address): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.bar, 'bar');
      contract.bar = 'baz';
      assertEqual(contract.bar, 'baz');
    `);
  });

  test('basic class with method calling another instance method', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract implements SmartContract {
        ${properties}

        public constructor(public readonly owner: Address = Address.from('${keys[0].address}')) {
        }

        public foo(): number {
          return 10;
        }

        public bar(): number {
          return this.foo();
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        readonly owner: Address;
        deploy(owner?: Address): boolean;
        bar(): number;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.bar(), 10);
    `);
  });
});
