import { helpers } from '../../../../__data__';

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
});
