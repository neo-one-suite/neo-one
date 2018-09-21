import { helpers } from '../../__data__';
import { DiagnosticCode } from '../../DiagnosticCode';

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

  test('no deploy method', () => {
    helpers.compileString(
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

  test('multiple smart contracts', () => {
    helpers.compileString(
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

  test('abstract smart contracts', () => {
    helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      export abstract class TestSmartContract extends SmartContract {
        ${properties}
      }
    `,
      { type: 'error' },
    );
  });

  test('new SmartContract()', () => {
    helpers.compileString(
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

  test('@receive with incorrect return type', () => {
    helpers.compileString(
      `
      import { SmartContract, receive } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}

        @receive
        public verify(): number {
          return 20;
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractMethod },
    );
  });

  test('@receive with @constant', () => {
    helpers.compileString(
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

  test('@sendUnsafe with @constant', () => {
    helpers.compileString(
      `
      import { SmartContract, sendUnsafe, constant } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}

        @sendUnsafe
        @constant
        public verify(): boolean {
          return true;
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractMethod },
    );
  });

  test('@claim with @constant', () => {
    helpers.compileString(
      `
      import { SmartContract, claim, constant } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}

        @claim
        @constant
        public verify(): boolean {
          return true;
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractMethod },
    );
  });

  test('structured storage set in constructor', () => {
    helpers.compileString(
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

  test('structured storage set public', () => {
    helpers.compileString(
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

  test('structured storage private modifiable', () => {
    helpers.compileString(
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

  test('structured storage protected abstract', () => {
    helpers.compileString(
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

  test('invalid storage type', () => {
    helpers.compileString(
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

  test('invalid storage structured array type', () => {
    helpers.compileString(
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

  test('invalid storage structured map type', () => {
    helpers.compileString(
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

  test('invalid storage structured set type', () => {
    helpers.compileString(
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

  test('invalid property function not readonly', () => {
    helpers.compileString(
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

  test('invalid property function set in constructor', () => {
    helpers.compileString(
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

  test('invalid @sendUnsafe method with ForwardValue', () => {
    helpers.compileString(
      `
      import { SmartContract, ForwardValue, sendUnsafe } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}

        @sendUnsafe
        public foo(value: ForwardValue): boolean {
          return true;
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractType },
    );
  });

  test('invalid @receive method with ForwardValue', () => {
    helpers.compileString(
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

  test('invalid @claim method with ForwardValue', () => {
    helpers.compileString(
      `
      import { SmartContract, ForwardValue, claim } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}

        @claim
        public foo(value: ForwardValue): boolean {
          return true;
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractType },
    );
  });

  test('invalid @sendUnsafe method with ForwardedValue', () => {
    helpers.compileString(
      `
      import { SmartContract, ForwardedValue, sendUnsafe } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}

        @sendUnsafe
        public foo(value: ForwardedValue<number>): boolean {
          return true;
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractType },
    );
  });

  test('invalid @receive method with ForwardedValue', () => {
    helpers.compileString(
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

  test('invalid @claim method with ForwardedValue', () => {
    helpers.compileString(
      `
      import { SmartContract, ForwardedValue, claim } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}

        @claim
        public foo(value: ForwardedValue<number>): boolean {
          return true;
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractType },
    );
  });
});
