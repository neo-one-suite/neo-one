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
});
