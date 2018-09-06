import { helpers } from '../../__data__';

const properties = `
public readonly properties = {
  codeVersion: '1.0',
  author: 'dicarlo2',
  email: 'alex.dicarlo@neotracker.io',
  description: 'The TestSmartContract',
};
`;

describe('ContractInfoProcessor', () => {
  test('allowed types', async () => {
    const node = await helpers.startNode();
    await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
      }
    `);
  });

  test('no symbol properties', () => {
    helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
        public readonly [Symbol.iterator]: string = 'foo';
      }
    `,
      { type: 'error' },
    );
  });

  test('no computed properties', () => {
    helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
        public readonly ['foo']: string = 'foo';
      }
    `,
      { type: 'error' },
    );
  });

  test('no computed methods', () => {
    helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
        public ['foo'](): string {
          return 'foo';
        }
      }
    `,
      { type: 'error' },
    );
  });

  test('no static properties', () => {
    helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
        public static readonly foo = 'foo';
      }
    `,
      { type: 'error' },
    );
  });

  test('no static methods', () => {
    helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
        public static foo() {
          return 'foo';
        }
      }
    `,
      { type: 'error' },
    );
  });

  test('no method decorators', () => {
    helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      function dec(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
        // do nothing
      }

      export class TestSmartContract extends SmartContract {
        ${properties}

        @dec
        public foo() {
          return 'foo';
        }
      }
    `,
      { type: 'error' },
    );
  });

  test('no method parameter decorators', () => {
    helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      function dec(target: Object, propertyKey: string | symbol, parameterIndex: number): void {
        // do nothing
      }

      export class TestSmartContract extends SmartContract {
        ${properties}

        public foo(@dec value: string) {
          return 'foo';
        }
      }
    `,
      { type: 'error' },
    );
  });

  test('no get accessor method decorators', () => {
    helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      function dec(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
        // do nothing
      }

      export class TestSmartContract extends SmartContract {
        ${properties}
        private x: string = 'foo';

        @dec
        public get foo(): string {
          return this.x;
        }

        public set foo(value: string) {
          this.x = value;
        }
      }
    `,
      { type: 'error' },
    );
  });

  test('no set accessor method decorators', () => {
    helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      function dec(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
        // do nothing
      }

      export class TestSmartContract extends SmartContract {
        ${properties}
        private x: string = 'foo';

        public get foo(): string {
          return this.x;
        }

        @dec
        public set foo(value: string) {
          this.x = value;
        }
      }
    `,
      { type: 'error' },
    );
  });

  test('no set accessor parameter decorators', () => {
    helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      function dec(target: Object, propertyKey: string | symbol, parameterIndex: number): void {
        // do nothing
      }

      export class TestSmartContract extends SmartContract {
        ${properties}
        private x: string = 'foo';

        public get foo(): string {
          return this.x;
        }

        public set foo(@dec value: string) {
          this.x = value;
        }
      }
    `,
      { type: 'error' },
    );
  });
});
