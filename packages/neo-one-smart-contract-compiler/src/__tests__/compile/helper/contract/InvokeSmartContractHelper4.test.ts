import { helpers } from '../../../../__data__';

const properties = `
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: "*",
  };
`;

describe('InvokeSmartContractHelper', () => {
  test('basic class extended with overriden property', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase extends SmartContract {
        protected baz: string = 'bar';

        public getBar(): string {
          return this.baz;
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}
        protected baz: string = 'foo';
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean
        getBar(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.getBar(), 'foo');
    `);
  });

  test('basic class extended with no super constructor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase extends SmartContract {
        protected baz: string = 'bar';

        public getBar(): string {
          return this.baz;
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}

        public constructor(public readonly foo: string = 'foo') {
          super();
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean
        getBar(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.getBar(), 'bar');
    `);
  });

  test('basic class extended with no super constructor or super property', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase extends SmartContract {
        protected abstract baz: string;

        public getBar(): string {
          return this.baz;
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}
        protected baz = 'baz';

        public constructor(public readonly foo: string = 'foo') {
          super();
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean
        getBar(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.getBar(), 'baz');
    `);
  });

  test('basic class extended and extended with overriden property', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBaseBase extends SmartContract {
        protected baz: string = 'foo';
        protected foo: string;

        public constructor() {
          super();
          this.foo = this.baz;
        }

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

  test('basic class extended and extended with overriden property without middle construct', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBaseBase extends SmartContract {
        protected baz: string = 'foo';
        protected foo: string;

        public constructor(public readonly abc: string) {
          super();
          this.foo = this.baz;
        }

        public getBar(): string {
          return this.baz;
        }

        public getFoo(): string {
          return this.foo;
        }
      }

      abstract class TestSmartContractBase extends TestSmartContractBaseBase {
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}
        protected baz: string = 'baz';

        public constructor(abc: string = 'abc') {
          super(abc);
        }
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
});
