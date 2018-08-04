import { helpers } from '../../../../__data__';

describe('IterableIterator', () => {
  test('can be implemented', async () => {
    await helpers.executeString(`
      class MyIterator implements Iterator<number> {
        readonly next = () => ({
          done: true,
          value: 0,
        });
      }

      class MyIterableIterator extends MyIterator implements IterableIterator<number> {
        public [Symbol.iterator]() {
          return new MyIterableIterator();
        }
      }

      const x = new MyIterableIterator();
      assertEqual(x.next().done, true);
      assertEqual(x.next().value, 0);
      assertEqual(x[Symbol.iterator]().next().done, true);
      assertEqual(x[Symbol.iterator]().next().value, 0);
    `);
  });
});
