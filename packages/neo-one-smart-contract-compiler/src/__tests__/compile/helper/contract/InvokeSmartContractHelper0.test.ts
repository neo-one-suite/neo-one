import { helpers } from '../../../../__data__';

const properties = `
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: "*",
  };
`;

describe('InvokeSmartContractHelper', () => {
  test.only('basic class no constructor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
    `);
  });

  test('basic class with initializer', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
        public readonly foo: string = 'bar';
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean
        readonly foo: string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.foo, 'bar');
    `);
  });

  test('basic class with constructor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
        public readonly foo: string;

        public constructor() {
          super();
          this.foo = 'bar';
        }
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

  test('basic class with constructor arguments', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
        public readonly foo: string;

        public constructor(foo: string) {
          super();
          this.foo = foo;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(foo: string): boolean;
        readonly foo: string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy('bar'), true);
      assertEqual(contract.foo, 'bar');
    `);
  });

  test('basic class with default constructor arguments', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}

        public constructor(public readonly foo: string = 'foo') {
          super();
        }
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
      assertEqual(contract.foo, 'foo');
    `);
  });
});
