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
  test('basic class extended with inherited property', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        public abstract readonly owner: Address;
        public readonly foo: string = 'bar';
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
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        public abstract readonly owner: Address;
        private readonly x: string = 'bar';

        public bar(): string {
          return this.x;
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
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        public abstract readonly owner: Address;
        public readonly foo: string = 'bar';
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}
        public readonly foo: string = 'baz';

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
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        public abstract readonly owner: Address;
        private readonly x: string = 'bar';

        public bar(): string {
          return this.x;
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}

        public constructor(public readonly owner: Address = Address.from('${keys[0].address}')) {
          super();
        }

        public bar(): string {
          return 'baz';
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
      assertEqual(contract.bar(), 'baz');
    `);
  });

  test('basic class extended with super method', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, ContractProperties, SmartContract } from '@neo-one/smart-contract';

      abstract class TestSmartContractBase implements SmartContract {
        public abstract readonly properties: ContractProperties;
        public abstract readonly owner: Address;
        private readonly x: string = 'bar';

        public bar(): string {
          return this.x;
        }
      }

      export class TestSmartContract extends TestSmartContractBase {
        ${properties}

        public constructor(public readonly owner: Address = Address.from('${keys[0].address}')) {
          super();
        }

        public bar(): string {
          return super.bar() + 'baz';
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
      assertEqual(contract.bar(), 'barbaz');
    `);
  });
});
