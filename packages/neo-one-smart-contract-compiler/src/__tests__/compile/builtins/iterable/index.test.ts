import { helpers } from '../../../../__data__';

describe('Iterable', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      class MyIterable implements Iterable<number> {
        public readonly [Symbol.iterator]: any = 10;
      }
    `,
      { type: 'error' },
    );
  });
});
