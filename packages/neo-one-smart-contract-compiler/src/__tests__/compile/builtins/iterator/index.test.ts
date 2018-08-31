import { helpers } from '../../../../__data__';

describe('Iterator', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      class MyIterator implements Iterator<number> {
        public readonly next: any = () => ({
          done: true,
          value: 10,
        });
      }
    `,
      { type: 'error' },
    );
  });
});
