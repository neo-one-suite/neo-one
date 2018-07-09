import { helpers } from '../../../__data__';

describe('PostfixUnaryExpressionCompiler', () => {
  test('Increment', async () => {
    await helpers.executeString(`
    let i = 1;
    i++;
    if(i++ !== 2){
        throw 'Failure';
    }
    `);
  });
  test('decrement', async () => {
    await helpers.executeString(`
    let i = 2;
    i++;
    if(i !== 3){
      throw 'Failure';
    }
    `);
  });
});
