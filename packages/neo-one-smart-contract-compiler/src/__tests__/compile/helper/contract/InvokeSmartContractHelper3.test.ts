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
  test('basic class extended with super parameters', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        public constructor(public readonly owner: Address) {
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}

        public constructor(owner: Address = Address.from('${keys[0].address}')) {
          super(owner);
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        readonly owner: Address;
        deploy(owner?: Address): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      const expectedOwner = Address.from('${keys[0].address}');
      assertEqual(contract.owner.equals(expectedOwner), true);
    `);
  });

  test('basic class extended with super method that calls overriden method', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        public abstract readonly owner: Address;
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

        public constructor(public readonly owner: Address = Address.from('${keys[0].address}')) {
          super();
        }

        public baz(): string {
          return 'foo';
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        readonly owner: Address;
        deploy(owner?: Address): boolean;
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
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        public abstract readonly owner: Address;
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

        public constructor(public readonly owner: Address = Address.from('${keys[0].address}')) {
          super();
        }

        protected get baz(): string {
          return 'foo';
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        readonly owner: Address;
        deploy(owner?: Address): boolean;
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
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        public abstract readonly owner: Address;
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

        public constructor(public readonly owner: Address = Address.from('${keys[0].address}')) {
          super();
        }

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
        readonly owner: Address;
        deploy(owner?: Address): boolean;
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
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        public abstract readonly owner: Address;
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

        public constructor(public readonly owner: Address = Address.from('${keys[0].address}')) {
          super();
        }

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
        readonly owner: Address;
        deploy(owner?: Address): boolean;
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
