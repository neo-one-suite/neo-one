import { helpers } from '../../../../__data__';

const properties = `
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: "*",
  };
`;

describe('InvokeSmartContractHelper', () => {
  test('basic class extended with super parameters', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase extends SmartContract {
        public constructor(public readonly foo: string) {
          super();
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}

        public constructor(foo: string) {
          super(foo);
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(value: string): boolean;
        readonly foo: string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy('foo'), true);
      assertEqual(contract.foo, 'foo');
    `);
  });

  test('basic class extended with super method that calls overriden method', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase extends SmartContract {
        private readonly x: string = 'bar';

        public bar(): string {
          return this.x + this.baz();
        }

        public baz(): string {
          return 'baz';
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}

        public baz(): string {
          return 'foo';
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
      assertEqual(contract.bar(), 'barfoo');
    `);
  });

  test('basic class extended with super method that calls overriden get accessor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase extends SmartContract {
        private readonly x: string = 'bar';

        public bar(): string {
          return this.x + this.baz;
        }

        protected get baz(): string {
          return 'baz';
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}

        protected get baz(): string {
          return 'foo';
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
      assertEqual(contract.bar(), 'barfoo');
    `);
  });

  test('basic class extended with super method that calls overriden set accessor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase extends SmartContract {
        protected x: string = 'bar';

        public bar(value: string): void {
          const self = this;
          self.baz = value;
        }

        protected set baz(value: string) {
          const self = this;
          self.x = value;
        }

        protected get baz(): string {
          const self = this;
          return self.x;
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}

        public getBar(): string {
          const self = this;
          return self.x;
        }

        protected set baz(value: string) {
          const self = this;
          self.x = 'foo' + value;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean
        bar(value: string): void;
        getBar(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      contract.bar('bar')
      assertEqual(contract.getBar(), 'foobar');
    `);
  });

  test('basic class extended with super method that calls overriden get/set accessor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase extends SmartContract {
        protected baz: string = 'bar';

        public bar(value: string): void {
          this.baz = value;
        }

        public getBar(): string {
          return this.baz;
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}
        private x: string = 'foo';

        protected get baz(): string {
          return this.x;
        }

        protected set baz(value: string) {
          this.x = 'foo' + value;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean
        bar(value: string): void;
        getBar(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.getBar(), 'foo');
      contract.bar('bar')
      assertEqual(contract.getBar(), 'foobar');
    `);
  });
});
