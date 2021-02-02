import { helpers } from '../../../../__data__';

const properties = `
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: "*",
  };
`;

describe('InvokeSmartContractHelper', () => {
  test('basic class with mixin property', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          public readonly foo = 'foo';
        }
      }

      export class TestSmartContract extends Mixin(SmartContract) {
        ${properties}
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

  test('basic class with mixin method', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          public getFoo(): string {
            return 'foo';
          }
        }
      }

      export class TestSmartContract extends Mixin(SmartContract) {
        ${properties}
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        getFoo(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.getFoo(), 'foo');
    `);
  });

  test('basic class with mixin method + storage property', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          private foo = 'foo';

          public getFoo(): string {
            return this.foo;
          }

          public setFoo(foo: string): void {
            this.foo = foo;
          }
        }
      }

      export class TestSmartContract extends Mixin(SmartContract) {
        ${properties}
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        getFoo(): string;
        setFoo(foo: string): void;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.getFoo(), 'foo');
      contract.setFoo('bar');
      assertEqual(contract.getFoo(), 'bar');
    `);
  });

  test('basic class with mixin get accessor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          private readonly x: string = 'bar';

          public get bar() {
            return this.x;
          }
        }
      }

      export class TestSmartContract extends Mixin(SmartContract) {
        ${properties}
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        readonly bar: string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.bar, 'bar');
    `);
  });

  test('basic class with mixin set accessor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          public x: string = 'bar';

          public set bar(x: string) {
            this.x = x;
          }
        }
      }

      export class TestSmartContract extends Mixin(SmartContract) {
        ${properties}
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        readonly x: string;
        setBar(value: string): void;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.x, 'bar');
      contract.setBar('baz');
      assertEqual(contract.x, 'baz');
    `);
  });
});
