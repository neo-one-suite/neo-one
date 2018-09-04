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
  test('basic class extended and extended with property dependent on another property initializer', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBaseBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        protected baz: string = 'foo';
        protected foo: string = this.baz;

        public constructor(public readonly owner: Address) {
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

  test('basic class extended, extended, no constructor with parameter', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBaseBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        protected abstract baz: string;
        protected bar: string;

        public constructor(bar: string, public readonly owner: Address) {
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
        public constructor(bar: string, owner: Address = Address.from('${keys[0].address}')) {
          super(bar, owner);
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
        readonly owner: Address;
        deploy(baz: string, owner?: Address): boolean;
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
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase implements SmartContract {
        public abstract readonly owner: Address;
        public abstract readonly properties: ContractProperties;
        public abstract readonly baz: string;
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}
        public readonly baz: string = 'foo';

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
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBaseBase implements SmartContract {
        public abstract readonly owner: Address;
        public abstract readonly properties: ContractProperties;

        public getBar(): string {
          return this.getBaz();
        }

        protected abstract getBaz(): string;
      }

      abstract class TestSmartContractBase extends TestSmartContractBaseBase {
        public constructor(public readonly owner: Address) {
          super();
        }

        protected getBaz(): string {
          return 'baz';
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
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBaseBase implements SmartContract {
        public abstract readonly owner: Address;
        public abstract readonly properties: ContractProperties;

        public getBar(): string {
          return this.getBaz();
        }

        protected abstract getBaz(): string;
      }

      abstract class TestSmartContractBase extends TestSmartContractBaseBase {
        public constructor(public readonly owner: Address) {
          super();
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}

        public constructor(owner: Address = Address.from('${keys[0].address}')) {
          super(owner);
        }

        protected getBaz(): string {
          return 'baz';
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
});
