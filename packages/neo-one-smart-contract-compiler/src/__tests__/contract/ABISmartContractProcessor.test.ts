import { helpers } from '../../__data__';
import { DiagnosticCode } from '../../DiagnosticCode';

const properties = `
public readonly properties = {
  trusts: '*',
  permissions: [],
  groups: [],
};
`;

describe('ABISmartContractProcessor', () => {
  test('no duplicate events', async () => {
    await helpers.compileString(
      `
      import { SmartContract, createEventNotifier } from '@neo-one/smart-contract';

      const first = createEventNotifier('foo');
      const second = createEventNotifier<number>('foo', 'arg');

      first();
      second(1);

      export class TestSmartContract extends SmartContract {
        ${properties}
      }
    `,
      { type: 'error' },
    );
  });

  test('invalid method parameter', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      class Foo { bar(): string { return ''; } }

      export class TestSmartContract extends SmartContract {
        ${properties}

        public test(value: Foo): void {
          // do nothing
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractType },
    );
  });

  test('invalid method return', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      class Foo { bar(): string { return ''; } }

      export class TestSmartContract extends SmartContract {
        ${properties}

        public test(): Foo {
          // do nothing
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractType },
    );
  });

  test('invalid method return - union', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      export class TestSmartContract extends SmartContract {
        ${properties}
        private foo: boolean = true;

        public test() {
          if (this.foo) {
            return '';
          }

          return 0;
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractType },
    );
  });

  test('invalid getter', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      class Foo { bar(): string { return ''; } }

      export class TestSmartContract extends SmartContract {
        ${properties}

        public get foo(): Foo {
          return new Foo();
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractType },
    );
  });

  test('invalid setter', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      class Foo {
        doSomething() {
          // do nothing
        }
      }

      export class TestSmartContract extends SmartContract {
        ${properties}

        public set foo(value: Foo): void {
          value.doSomething();
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractType },
    );
  });

  test('invalid getter + setter', async () => {
    await helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      class Foo {
        doSomething() {
          // do nothing
        }
      }

      export class TestSmartContract extends SmartContract {
        ${properties}

        public get foo(): Foo {
          return new Foo();
        }

        public set foo(value: Foo): void {
          value.doSomething();
        }
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidContractType },
    );
  });
});
