import { helpers } from '../../../../__data__';

describe('Iterable', () => {
  test('can be implemented', async () => {
    await helpers.executeString(`
      class MyIterator implements Iterator<number> {
        readonly next = () => ({
          done: true,
          value: 0,
        });
      }

      class MyIterable implements Iterable<number> {
        public [Symbol.iterator]() {
          return new MyIterator();
        }
      }

      const x = new MyIterable();
      assertEqual(x[Symbol.iterator]().next().done, true);
      assertEqual(x[Symbol.iterator]().next().value, 0);
    `);
  });
});
