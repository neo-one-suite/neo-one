import { helpers } from '../../../__data__';

describe('TryThrowCatchStatementCompiler', () => {
  test.skip('TryThrowCatch - with if statement on e', async () => {
    await helpers.executeString(`
    var tried = false;
    var caught = false;
    var hasError = false;
    try {
      tried = true;
      throw new Error('Something bad happened');
    }
    catch(e) {
      caught = true;
      if(e){ // <<<< this line fails
        hasError = true;
      }
    }
    if(!tried || !caught || !hasError){
     throw 'Failure';
    }
    `);
  });
  test('TryThrowCatch', async () => {
    await helpers.executeString(`
    var tried = false;
    var caught = false;
    var hasError = false;
    try {
      tried = true;
      throw new Error('Something bad happened');
    }
    catch {
      caught = true;
    }
    if(!tried || !caught){
     throw 'Failure';
    }
    `);
  });
});
