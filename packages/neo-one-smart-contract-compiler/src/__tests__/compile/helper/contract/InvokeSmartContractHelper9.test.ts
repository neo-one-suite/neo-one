import { helpers } from '../../../../__data__';

const properties = `
public readonly properties = {
  codeVersion: '1.0',
  author: 'dicarlo2',
  email: 'alex.dicarlo@neotracker.io',
  description: 'The TestSmartContract',
};
`;

describe('InvokeSmartContractHelper', () => {
  test('basic class mixin extended with super method that calls overriden method', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          private readonly x: string = 'bar';

          public bar(): string {
            return this.x + this.baz();
          }

          public baz(): string {
            return 'baz';
          }
        }
      }

      export class TestSmartContract extends Mixin(SmartContract) {
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

  test('basic class mixin extended with super method that calls overriden get accessor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          private readonly x: string = 'bar';

          public bar(): string {
            return this.x + this.baz;
          }

          protected get baz(): string {
            return 'baz';
          }
        }
      }

      export class TestSmartContract extends Mixin(SmartContract) {
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

  test('basic class mixin extended with super method that calls overriden set accessor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
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
      }

      export class TestSmartContract extends Mixin(SmartContract) {
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

  test('basic class mixin extended with super method that calls overriden get/set accessor', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          protected baz: string = 'bar';

          public bar(value: string): void {
            this.baz = value;
          }

          public getBar(): string {
            return this.baz;
          }
        }
      }

      export class TestSmartContract extends Mixin(SmartContract) {
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

  test('basic class mixin extended with overriden property', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          protected baz: string = 'bar';

          public getBar(): string {
            return this.baz;
          }
        }
      }

      export class TestSmartContract extends Mixin(SmartContract) {
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
});
