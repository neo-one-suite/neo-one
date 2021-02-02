import { helpers } from '../../../../__data__';

const properties = `
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: "*",
  };
`;

describe('InvokeSmartContractHelper', () => {
  test('basic class with mixin get/set accessor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          private x: string = 'bar';

          public get bar(): string {
            return this.x;
          }

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
        bar: string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.bar, 'bar');
      contract.bar = 'baz';
      assertEqual(contract.bar, 'baz');
    `);
  });

  test('basic class with mixin method calling another instance method', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          public foo(): number {
            return 10;
          }

          public bar(): number {
            return this.foo();
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
        bar(): number;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.bar(), 10);
    `);
  });

  test('basic class extended with mixin overriden property', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          public readonly foo: string = 'bar';
        }
      }

      export class TestSmartContract extends Mixin(SmartContract) {
        ${properties}
        public readonly foo: string = 'baz';
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
      assertEqual(contract.foo, 'baz');
    `);
  });

  test('basic class extended with mixin overriden method', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          private readonly x: string = 'bar';

          public bar(): string {
            return this.x;
          }
        }
      }

      export class TestSmartContract extends Mixin(SmartContract) {
        ${properties}
        public bar(): string {
          return 'baz';
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean
        bar(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.bar(), 'baz');
    `);
  });

  test('basic class extended with mixin super method', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          private readonly x: string = 'bar';

          public bar(): string {
            return this.x;
          }
        }
      }

      export class TestSmartContract extends Mixin(SmartContract) {
        ${properties}
        public bar(): string {
          return super.bar() + 'baz';
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
      assertEqual(contract.bar(), 'barbaz');
    `);
  });
});
