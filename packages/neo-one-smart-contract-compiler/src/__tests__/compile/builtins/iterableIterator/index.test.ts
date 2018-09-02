import { helpers } from '../../../../__data__';
import { Builtin } from '../../../../compile/builtins';

describe('IterableIterator', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      class MyIterableIterator implements IterableIterator<number> {
        public readonly next: any = () => ({
          done: true,
          value: 10,
        });
        public readonly [Symbol.iterator]: any = 10;
      }
    `,
      { type: 'error' },
    );
  });

  test('returns "next" when possibly object', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];

      interface IterableIte<T> {
        readonly next: (value?: any) => IteratorResult<T>;
        readonly [Symbol.iterator]: () => IterableIterator<T>;
      }

      const y: IterableIterator<number> | IterableIte<number> =
        x[Symbol.iterator]() as IterableIterator<number> | IterableIte<number>;

      interface IteratorRes<T> {
        readonly done: boolean;
        readonly value: T;
      }

      const result: IteratorResult<number> | IteratorRes<number> =
        y['next']() as IteratorResult<number> | IteratorRes<number>;
      assertEqual(result['value'], 1);
      assertEqual(result['done'], false);
    `);
  });

  test('string members', () => {
    const context = helpers.createContext();

    const members = context.builtins.getMembers(
      'IterableIterator',
      (_builtin): _builtin is Builtin => true,
      () => true,
      false,
    );
    expect(members).toHaveLength(1);
  });

  test('symbol members', () => {
    const context = helpers.createContext();

    const members = context.builtins.getMembers(
      'IterableIterator',
      (_builtin): _builtin is Builtin => true,
      () => true,
      true,
    );
    expect(members).toHaveLength(1);
  });
});
