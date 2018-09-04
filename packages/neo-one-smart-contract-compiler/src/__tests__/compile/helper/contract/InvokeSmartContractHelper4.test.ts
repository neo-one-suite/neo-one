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
  test('basic class extended with overriden property', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        protected baz: string = 'bar';

        public constructor(public readonly owner: Address) {
        }

        public getBar(): string {
          return this.baz;
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}
        protected baz: string = 'foo';

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
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        public abstract readonly owner: Address;
        protected baz: string = 'bar';

        public getBar(): string {
          return this.baz;
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}

        public constructor(public readonly owner: Address = Address.from('${keys[0].address}')) {
          super();
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        readonly owner: Address;
        deploy(owner?: Address): boolean;
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
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        public abstract readonly owner: Address;
        protected abstract baz: string;

        public getBar(): string {
          return this.baz;
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}
        protected baz = 'baz';

        public constructor(public readonly owner: Address = Address.from('${keys[0].address}')) {
          super();
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        readonly owner: Address;
        deploy(owner?: Address): boolean;
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
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBaseBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        protected baz: string = 'foo';
        protected foo: string;

        public constructor(public readonly owner: Address) {
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
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBaseBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        protected baz: string = 'foo';
        protected foo: string;

        public constructor(public readonly owner: Address) {
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
