import { helpers } from '../../../../__data__';

describe('Iterator', () => {
  test('can be implemented', async () => {
    await helpers.executeString(`
      class MyIterator implements Iterator<number> {
        readonly next = () => ({
          done: true,
          value: 0,
        });
      }

      const x = new MyIterator();
      assertEqual(x.next().done, true);
      assertEqual(x.next().value, 0);
    `);
  });
});
