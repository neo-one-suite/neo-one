import { helpers } from '../../../__data__';

describe('IfStatementCompiler', () => {
  test('simple', async () => {
    await helpers.executeString(`
      var result = null;
      if(true || false){
        result = 'success';
      }
      if(false) {
        result = 'failure';
      }
      if (result !== 'success') {
        throw 'Failure';
      }
    `);
  });
  test('simple if-else', async () => {
    await helpers.executeString(`
    var result = null;
    if(false){
      result = 'failure';
    }else if(false || false) {
      result = 'failure';
    }else if(true) {
      result = 'success';
    }
    if (result !== 'success') {
      throw 'Failure';
    }
    `);
  });
});
