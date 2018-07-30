import { helpers } from '../../../__data__';

describe('PropertyAccessExpressionCompiler', () => {
  test('access object property', async () => {
    await helpers.executeString(`
    const bar = {x:'1', y:'2'};
    if(bar.x + bar.y !== '12' ){
      throw 'failure'
    }
    `);
  });
});
