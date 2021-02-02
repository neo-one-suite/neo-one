import { helpers } from '../../../../__data__';

describe('IteratorResult', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      class MyIteratorResult implements IteratorResult<number> {
        public readonly done = true;
        public readonly value = 10;
      }
    `,
      { type: 'error' },
    );
  });
});
