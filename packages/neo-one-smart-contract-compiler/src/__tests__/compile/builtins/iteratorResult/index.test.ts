import { helpers } from '../../../../__data__';

describe('IteratorResult', () => {
  test('can be implemented', async () => {
    await helpers.executeString(`
      class MyIteratorResult implements IteratorResult<number> {
        readonly done: boolean = true;
        readonly value: number = 0;
      }

      const x = new MyIteratorResult();
      assertEqual(x.done, true);
      assertEqual(x.value, 0);
    `);
  });
});
