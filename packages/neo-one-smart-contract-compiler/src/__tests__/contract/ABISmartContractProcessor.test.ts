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

describe('ABISmartContractProcessor', () => {
  test('no duplicate events', () => {
    helpers.compileString(
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

  test('invalid method parameter', () => {
    helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      class Foo {}

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

  test('invalid method return', () => {
    helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      class Foo {}

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

  test('invalid getter', () => {
    helpers.compileString(
      `
      import { SmartContract } from '@neo-one/smart-contract';

      class Foo {}

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

  test('invalid setter', () => {
    helpers.compileString(
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

  test('invalid getter + setter', () => {
    helpers.compileString(
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
