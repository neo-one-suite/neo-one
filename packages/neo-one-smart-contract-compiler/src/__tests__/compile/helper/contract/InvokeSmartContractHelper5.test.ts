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
  test('basic class extended and extended with property dependent on another property initializer', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBaseBase extends SmartContract {
        protected baz: string = 'foo';
        protected foo: string = this.baz;

        public getBar(): string {
          return this.baz;
        }

        public getFoo(): string {
          return this.foo;
        }
      }

      abstract class TestSmartContractBase extends TestSmartContractBaseBase {
        protected baz: string = 'bar';
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}
        protected baz: string = 'baz';
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        getBar(): string;
        getFoo(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.getBar(), 'baz');
      assertEqual(contract.getFoo(), 'foo');
    `);
  });

  test('basic class extended, extended, no constructor with parameter', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBaseBase extends SmartContract {
        protected abstract baz: string;
        protected bar: string;

        public constructor(bar: string) {
          super();
          this.bar = bar;
        }

        public getBar(): string {
          return this.bar;
        }

        public getBaz(): string {
          return this.baz;
        }
      }

      abstract class TestSmartContractBase extends TestSmartContractBaseBase {
        public constructor(bar: string) {
          super(bar);
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}
        protected baz = 'baz';
        protected bar = 'bar';
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(baz: string): boolean;
        getBar(): string;
        getBaz(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy('foo'), true);
      assertEqual(contract.getBar(), 'bar');
      assertEqual(contract.getBaz(), 'baz');
    `);
  });

  test('basic class extended with overriden abstract property', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase extends SmartContract {
        public abstract readonly baz: string;
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}
        public readonly baz: string = 'foo';
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        readonly baz: string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.baz, 'foo');
    `);
  });

  test('basic class extended, extended, with middle implementation', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBaseBase extends SmartContract {
        public getBar(): string {
          return this.getBaz();
        }

        protected abstract getBaz(): string;
      }

      abstract class TestSmartContractBase extends TestSmartContractBaseBase {
        protected getBaz(): string {
          return 'baz';
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
        getBar(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.getBar(), 'baz');
    `);
  });

  test('basic class extended, extended, with final implementation', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBaseBase extends SmartContract {
        public getBar(): string {
          return this.getBaz();
        }

        protected abstract getBaz(): string;
      }

      abstract class TestSmartContractBase extends TestSmartContractBaseBase {
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}

        protected getBaz(): string {
          return 'baz';
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        getBar(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.getBar(), 'baz');
    `);
  });
});
