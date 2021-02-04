import { helpers } from '../../../../__data__';

const properties = `
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: "*",
  };
`;

describe('InvokeSmartContractHelper', () => {
  test('basic class mixin extended and extended with overriden property without middle construct', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function MixinBase<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          protected baz: string = 'foo';
          protected foo: string;

          public constructor(...args: any[]) {
            super(...args);
            this.foo = this.baz;
          }

          public getBar(): string {
            return this.baz;
          }

          public getFoo(): string {
            return this.foo;
          }
        }
      }

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
        }
      }

      export class TestSmartContract extends Mixin(MixinBase(SmartContract)) {
        protected baz: string = 'baz';

        public constructor(public readonly abc: string = 'abc') {
          super();
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        getBar(): string;
        getFoo(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.getBar(), 'baz');
      assertEqual(contract.getFoo(), 'foo');
    `);
  });

  test('basic class mixin extended and extended with overriden property without middle or last construct', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function MixinBase<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          protected baz: string = 'foo';
          protected foo: string;

          public constructor(...args: any[]) {
            super(...args);
            this.foo = this.baz;
          }

          public getBar(): string {
            return this.baz;
          }

          public getFoo(): string {
            return this.foo;
          }
        }
      }

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        return class extends Base {
          protected foo: string = 'bar';
        }
      }

      export class TestSmartContract extends Mixin(MixinBase(SmartContract)) {
        ${properties}
        protected baz: string = 'baz';
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        getBar(): string;
        getFoo(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.getBar(), 'baz');
      assertEqual(contract.getFoo(), 'bar');
    `);
  });

  test('basic class mixin extended and extended with overriden property with lots of mixins', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      function MixinBase<TBase extends Constructor<SmartContract>>(Base: TBase) {
        class MixinBaseClass extends Base {
          protected baz: string = 'foo';
          protected foo: string;

          public constructor(...args: any[]) {
            super(...args);
            this.foo = this.baz;
          }

          public getBar(): string {
            return this.baz;
          }

          public getFoo(): string {
            return this.foo;
          }
        }

        return MixinBaseClass;
      }

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        class MixinClass extends Base {
          protected foo: string = 'bar';
        }

        return MixinClass;
      }

      function MixinMixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        class MixinMixinClass extends Base {
          protected foo: string = 'bar2';
        }

        return MixinMixinClass;
      }

      export class TestSmartContract extends MixinMixin(Mixin(MixinBase(SmartContract))) {
        ${properties}
        protected baz: string = 'baz';
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        getBar(): string;
        getFoo(): string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.getBar(), 'baz');
      assertEqual(contract.getFoo(), 'bar2');
    `);
  });

  test('basic class mixin with private mixin property', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Fixed, SmartContract, constant } from '@neo-one/smart-contract';

      function Token<TBase extends Constructor<SmartContract>>(Base: TBase) {
        abstract class TokenClass extends Base {
          public abstract readonly name: string;
          private mutableSupply: Fixed<8> = 0;

          @constant
          public get totalSupply(): Fixed<8> {
            return this.mutableSupply;
          }
        }

        return TokenClass;
      }

      function ICO<TBase extends Constructor<SmartContract> & ReturnType<typeof Token>>(Base: TBase) {
        abstract class ICOClass extends Base {
          public getTotalSupply(): Fixed<8> {
            return this.totalSupply;
          }
        }

        return ICOClass;
      }

      export class TestSmartContract extends ICO(Token(SmartContract)) {
        ${properties}
        public readonly name: string = 'Test';
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        readonly totalSupply: number;
        getTotalSupply(): number;
        readonly name: string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.totalSupply, 0);
      assertEqual(contract.getTotalSupply(), 0);
      assertEqual(contract.name, 'Test');
    `);
  });

  test('basic class mixin with private middle mixin property', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Fixed, SmartContract, constant } from '@neo-one/smart-contract';

      function Token<TBase extends Constructor<SmartContract>>(Base: TBase) {
        abstract class TokenClass extends Base {
          public abstract readonly name: string;
        }

        return TokenClass;
      }

      function ICO<TBase extends Constructor<SmartContract> & ReturnType<typeof Token>>(Base: TBase) {
        abstract class ICOClass extends Base {
          private mutableRemaining: Fixed<8> = this.getICOAmount();

          @constant
          public get remaining(): number {
            return this.mutableRemaining;
          }

          protected abstract getICOAmount(): Fixed<8>;
        }

        return ICOClass;
      }

      export class TestSmartContract extends ICO(Token(SmartContract)) {
        ${properties}
        public readonly name: string = 'Test';

        public getRemaining(): Fixed<8> {
          return this.remaining;
        }

        protected getICOAmount(): Fixed<8> {
          return 100_00000000;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        readonly remaining: number;
        getRemaining(): number;
        readonly name: string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.remaining, 100_00000000);
      assertEqual(contract.getRemaining(), 100_00000000);
      assertEqual(contract.name, 'Test');
    `);
  });

  test('basic class with mixin referencing this.address', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      function Mixin<TBase extends Constructor<SmartContract>>(Base: TBase) {
        abstract class MixinClass extends Base {
          public abstract readonly name: string;

          public getAddress(): Address {
            return this.address;
          }
        }

        return MixinClass;
      }

      export class TestSmartContract extends Mixin(SmartContract) {
        ${properties}
        public readonly name: string = 'Test';
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        getAddress(): Address;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.getAddress(), Address.from('${contract.address}'));
    `);
  });

  test.skip('basic class mixin with partially inferred types', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Fixed, SmartContract, constant } from '@neo-one/smart-contract';

      function Mixin<Decimals extends number, TBase extends Constructor<SmartContract> = Constructor<SmartContract>>(Base: TBase) {
        abstract class MixinClass extends Base {
          public abstract readonly name: string;
          private mutableSupply: Fixed<Decimals> = 0;

          @constant
          public get totalSupply(): Fixed<Decimals> {
            return this.mutableSupply;
          }
        }

        return MixinClass;
      }

      function MixinMixin<Decimals extends number, TBase extends Constructor<SmartContract> & ReturnType<typeof Mixin> = Constructor<SmartContract> & ReturnType<typeof Mixin>>(Base: TBase) {
        abstract class MixinMixinClass extends Base {
          public getTotalSupply(): Fixed<Decimals> {
            return this.totalSupply;
          }
        }

        return MixinMixinClass;
      }

      export class TestSmartContract extends MixinMixin<8>(Mixin<8>(SmartContract)) {
        ${properties}
        public readonly name: string = 'Test';
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        readonly totalSupply: number;
        getTotalSupply(): number;
        readonly name: string;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.totalSupply, 0);
      assertEqual(contract.name, 'Test');
      assertEqual(contract.getTotalSupply(), 0);
    `);
  });
});
