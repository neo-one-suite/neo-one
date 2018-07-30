import { helpers } from '../../../__data__';

describe('WhileStatementCompiler', () => {
  test.skip('simple', async () => {
    await helpers.executeString(`
      let result = 0;
      let done = false;
      let i = 0;
      while (!done) {
        result = ++i;
        if(i > 9){
          done = true;
        }
        if(i>13){
          break;
        }
      }

      if (result !== 10) {
        throw 'Failure';
      }else if(result > 12){
        throw 'Not respecting while statement';
      }
    `);
  });
  test.skip('strange else-if condition', async () => {
    await helpers.executeString(`
      let result = 0;
      let done = false;
      let i = 0;

      while (!done) {
        result = ++i;
        if(i > 9){
          done = true;
        }else if(i>13){
          break; // this line causes error: Line numbers must be >= 1
        }
      }

      if (result !== 10) {
        throw 'Failure';
      }else if(result > 12){
        throw 'Not respecting while statement';
      }
    `);
  });
});
