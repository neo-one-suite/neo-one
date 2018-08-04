import { helpers } from '../../../__data__';

describe('PropertyAccessExpressionCompiler', () => {
  test('access object property', async () => {
    await helpers.executeString(`
      const bar = { x: '1', y: '2' };
      (bar.x = '2') + bar.y;
      if (bar.x + bar.y !== '22') {
        throw 'failure'
      }
    `);
  });

  test('set object property', async () => {
    await helpers.executeString(`
      const bar = { x: '1', y: '2' };
      if ((bar.x = '2') + bar.y !== '22') {
        throw 'failure'
      }
    `);
  });

  test('access array or object property', async () => {
    await helpers.executeString(`
      const bar: { length: number } | Array<number> = [1, 2, 3] as { length: number } | Array<number>;

      assertEqual(bar.length, 3);
    `);
  });
});
