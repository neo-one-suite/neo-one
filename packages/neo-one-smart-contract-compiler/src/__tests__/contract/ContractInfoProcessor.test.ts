import { helpers } from '../../__data__';
import { DiagnosticCode } from '../../DiagnosticCode';

const properties = `
public readonly properties = {
  trusts: '*',
  permissions: [],
  groups: [],
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

  test('no symbol properties', async () => {
    await helpers.compileString(
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

  test('no computed properties', async () => {
    await helpers.compileString(
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

  test('no computed methods', async () => {
    await helpers.compileString(
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

  test('no static properties', async () => {
    await helpers.compileString(
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

  test('no static methods', async () => {
    await helpers.compileString(
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

  test('no method decorators', async () => {
    await helpers.compileString(
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

  test('no method parameter decorators', async () => {
    await helpers.compileString(
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

  test('no get accessor method decorators', async () => {
    await helpers.compileString(
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

  test('no set accessor method decorators', async () => {
    await helpers.compileString(
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

  test('no set accessor parameter decorators', async () => {
    await helpers.compileString(
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

  test('no deploy method', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}

        public deploy(): void {
          // do nothing
        }
      }
    `,
      { type: 'error' },
    );
  });

  test('multiple smart contracts', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
      }

      export class TestSmartContract2 extends SmartContract {
        ${properties}
      }
    `,
      { type: 'error' },
    );
  });

  test('abstract smart contracts', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      export abstract class TestSmartContract extends SmartContract {
        ${properties}
      }
    `,
      { type: 'error' },
    );
  });

  test('new SmartContract()', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
      }

      new TestSmartContract();
    `,
      { type: 'error' },
    );
  });

  test('@receive with @constant', async () => {
    await helpers.compileString(
      `
      import { SmartContract, receive, constant } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}

        @receive
        @constant
        public verify(): boolean {
          return true;
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractMethod },
    );
  });

  test('structured storage set in constructor', async () => {
    await helpers.compileString(
      `
      import { SmartContract, MapStorage } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
        private readonly foo: MapStorage<string, string>;
        public constructor() {
          super();
          this.foo = MapStorage.for<string, string>();
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidStructuredStorageFor },
    );
  });

  test('structured storage set public', async () => {
    await helpers.compileString(
      `
      import { SmartContract, MapStorage } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
        public readonly foo = MapStorage.for<string, string>();
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidStructuredStorageFor },
    );
  });

  test('structured storage private modifiable', async () => {
    await helpers.compileString(
      `
      import { SmartContract, MapStorage } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
        private foo = MapStorage.for<string, string>();
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidStructuredStorageFor },
    );
  });

  test('structured storage protected abstract', async () => {
    await helpers.compileString(
      `
      import { SmartContract, MapStorage } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
        protected abstract readonly foo: MapStorage<string, string>;
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidStructuredStorageFor },
    );
  });

  test('invalid storage type', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      class Foo {}

      export class TestSmartContract extends SmartContract {
        ${properties}
        private readonly foo: Foo = new Foo();
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractStorageType },
    );
  });

  test('invalid storage structured array type', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      class Foo {}

      export class TestSmartContract extends SmartContract {
        ${properties}
        private readonly foo: Array<Foo> = [new Foo()];
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractStorageType },
    );
  });

  test('invalid storage structured map type', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      class Foo {}

      export class TestSmartContract extends SmartContract {
        ${properties}
        private readonly foo: Array<Map<string, Foo>> = [new Map<string, Foo>().set('foo', new Foo())];
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractStorageType },
    );
  });

  test('invalid storage structured set type', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      class Foo {}

      export class TestSmartContract extends SmartContract {
        ${properties}
        private readonly foo: Set<Map<string, Foo>> = new Set([new Map<string, Foo>().set('foo', new Foo())]);
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractStorageType },
    );
  });

  test('invalid property function not readonly', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
        private foo = () => {
          // do nothing
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractStorageType },
    );
  });

  test('invalid property function set in constructor', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
        private readonly foo: () => void;

        public constructor() {
          super();
          this.foo = () => {
            // do nothing
          }
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractStorageType },
    );
  });

  test('invalid @receive method with ForwardValue', async () => {
    await helpers.compileString(
      `
      import { SmartContract, ForwardValue, receive } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}

        @receive
        public foo(value: ForwardValue): boolean {
          return true;
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractType },
    );
  });

  test('invalid @receive method with ForwardedValue', async () => {
    await helpers.compileString(
      `
      import { SmartContract, ForwardedValue, receive } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}

        @receive
        public foo(value: ForwardedValue<number>): boolean {
          return true;
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractType },
    );
  });
});
