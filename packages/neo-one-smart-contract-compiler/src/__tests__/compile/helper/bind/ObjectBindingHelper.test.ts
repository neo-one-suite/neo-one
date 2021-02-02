import { helpers, keys } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('ObjectBindingHelper', () => {
  describe('variable', () => {
    test('simple', async () => {
      await helpers.executeString(`
        const value = { a: 0, b: 1, c: 2, 3: 3, 4: [4] };
        const x = 4;
        const { a, b, 3: three, [x]: [four], ...rest } = value;

        assertEqual(a, 0);
        assertEqual(b, 1);
        assertEqual(Object.keys(rest).length, 1);
        assertEqual(rest.c, 2);
        assertEqual(three, 3);
        assertEqual(four, 4);
      `);
    });

    test('builtin value', async () => {
      await helpers.executeString(`
        import { Blockchain } from '@neo-one/smart-contract';
        const { currentTransaction = Blockchain.currentTransaction } = Blockchain;

        assertEqual(currentTransaction !== undefined, true);
      `);
    });

    test('builtin value string property', async () => {
      await helpers.executeString(`
        import { Blockchain } from '@neo-one/smart-contract';
        const { 'currentTransaction': currentTransaction } = Blockchain;

        assertEqual(currentTransaction !== undefined, true);
      `);
    });

    test('builtin value computed property', async () => {
      await helpers.compileString(
        `
        import { Blockchain } from '@neo-one/smart-contract';
        const { ['currentTransaction']: currentTransaction } = Blockchain;

        assertEqual(currentTransaction !== undefined, true);
      `,
        { type: 'error', code: DiagnosticCode.UnsupportedSyntax },
      );
    });

    test('builtin value rest property', async () => {
      await helpers.compileString(
        `
        import { Blockchain } from '@neo-one/smart-contract';
        const { currentTransaction, ...rest } = Blockchain;

        assertEqual(currentTransaction !== undefined, true);
      `,
        { type: 'error', code: DiagnosticCode.UnsupportedSyntax },
      );
    });

    test('builtin value unknown property', async () => {
      await helpers.compileString(
        `
        import { Blockchain } from '@neo-one/smart-contract';
        const { 0: something } = Blockchain;

        assertEqual(something !== undefined, true);
      `,
        { type: 'error' },
      );
    });

    test('builtin value method property', async () => {
      await helpers.compileString(
        `
        import { Address } from '@neo-one/smart-contract';
        const { isSender } = Address;

        assertEqual(isSender !== undefined, true);
      `,
        { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
      );
    });

    // TODO: come back to this when notifications are implemented
    test('builtin instance value', async () => {
      await helpers.executeString(`
        import { Blockchain } from '@neo-one/smart-contract';
        const { currentTransaction: { notifications } } = Blockchain;

        assertEqual(references !== undefined, true);
        assertEqual(references.length, 0);
      `);
    });

    // TODO: come back to this when notifications are implemented
    test('builtin value string property', async () => {
      await helpers.executeString(`
        import { Blockchain } from '@neo-one/smart-contract';
        const { 'currentTransaction': { 'notifications': [value] } } = Blockchain;

        assertEqual(value !== undefined, true);
      `);
    });

    test('builtin value instance computed property', async () => {
      await helpers.compileString(
        `
        import { Blockchain } from '@neo-one/smart-contract';
        const { ['signers']: signers } = Blockchain.currentTransaction;

        assertEqual(signers !== undefined, true);
      `,
        { type: 'error', code: DiagnosticCode.UnsupportedSyntax },
      );
    });

    test('builtin instance value method property', async () => {
      await helpers.compileString(
        `
        import { ArrayStorage } from '@neo-one/smart-contract';
        const { forEach } = ArrayStorage.for<number>();

        assertEqual(forEach !== undefined, true);
      `,
        { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
      );
    });
  });

  describe('function parameter', () => {
    test('simple', async () => {
      await helpers.executeString(`
        const value = { a: 0, b: 1, c: 2 };

        function run({ a, b, ...rest }: typeof value) {
          assertEqual(a, 0);
          assertEqual(b, 1);
          assertEqual(Object.keys(rest).length, 1);
          assertEqual(rest.c, 2);
        }

        run(value);
      `);
    });
  });

  describe('arrow function parameter', () => {
    test('simple', async () => {
      await helpers.executeString(`
        const value = { a: 0, b: 1, c: 2 };

        const run = ({ a, b, ...rest }: typeof value) => {
          assertEqual(a, 0);
          assertEqual(b, 1);
          assertEqual(Object.keys(rest).length, 1);
          assertEqual(rest.c, 2);
        }

        run(value);
      `);
    });
  });

  describe('constructor parameter', () => {
    test('simple', async () => {
      await helpers.executeString(`
        const value = { a: 0, b: 1, c: 2 };

        class Foo {
          constructor({ a, b, ...rest }: typeof value) {
            assertEqual(a, 0);
            assertEqual(b, 1);
            assertEqual(Object.keys(rest).length, 1);
            assertEqual(rest.c, 2);
          }
        }

        new Foo(value);
      `);
    });
  });

  describe('method parameter', () => {
    test('simple', async () => {
      await helpers.executeString(`
        const value = { a: 0, b: 1, c: 2 };

        class Foo {
          public foo({ a, b, ...rest }: typeof value) {
            assertEqual(a, 0);
            assertEqual(b, 1);
            assertEqual(Object.keys(rest).length, 1);
            assertEqual(rest.c, 2);
          }
        }

        new Foo().foo(value);
      `);
    });
  });
});
