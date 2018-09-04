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
  test('basic class no constructor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract implements SmartContract {
        ${properties}
        public readonly owner: Address = Address.from('${keys[0].address}')
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        readonly owner: Address;
        readonly foo: string;
        deploy(): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      const expectedOwner = Address.from('${keys[0].address}');
      assertEqual(contract.deploy(), true);
      assertEqual(contract.owner.equals(expectedOwner), true);
    `);
  });

  test('basic class with initializer', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract implements SmartContract {
        ${properties}
        public readonly foo: string = 'bar';

        public constructor(public readonly owner: Address = Address.from('${keys[0].address}')) {
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        readonly owner: Address;
        readonly foo: string;
        deploy(owner?: Address): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.foo, 'bar');
    `);
  });

  test('basic class with constructor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract implements SmartContract {
        ${properties}
        public readonly foo: string;

        public constructor(public readonly owner: Address = Address.from('${keys[0].address}')) {
          this.foo = 'bar';
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        readonly owner: Address;
        readonly foo: string;
        deploy(owner?: Address): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.foo, 'bar');
    `);
  });

  test('basic class with constructor arguments', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract implements SmartContract {
        ${properties}
        public readonly foo: string;

        public constructor(
          foo: string,
          public readonly owner: Address = Address.from('${keys[0].address}'),
        ) {
          this.foo = foo;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        readonly owner: Address;
        readonly foo: string;
        deploy(foo: string, owner?: Address): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy('bar'), true);
      assertEqual(contract.foo, 'bar');
    `);
  });

  test('basic class with default constructor arguments', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract implements SmartContract {
        ${properties}

        public constructor(public readonly owner: Address = Address.from('${keys[0].address}')) {
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      const expectedOwner = Address.from('${keys[0].address}');

      interface Contract {
        readonly owner: Address;
        deploy(owner?: Address): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.owner.equals(expectedOwner), true);
    `);
  });
});
