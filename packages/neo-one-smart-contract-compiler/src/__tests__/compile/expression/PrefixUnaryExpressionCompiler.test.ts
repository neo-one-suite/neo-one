import { helpers } from '../../../__data__';

describe('PrefixUnaryExpressionCompiler', () => {
  test('Double Negative', async () => {
    await helpers.executeString(`
      if(-(-2) !== 2){
        throw 'Failure';
      }
    `);
  });
  test('Not False', async () => {
    await helpers.executeString(`
      if(!false !== true){
        throw 'Failure';
      }
    `);
  });
  test('increment', async () => {
    await helpers.executeString(`
    let i = 2;
      if(++i !== 3){
        throw 'Failure';
      }
    `);
  });
  test('decrement', async () => {
    await helpers.executeString(`
    let i = 3;
      if(--i !== 2){
        throw 'Failure';
      }
    `);
  });
});
