import { helpers } from '../../../__data__';

describe('StringLiteralCompiler', () => {
  test('basic', async () => {
    await helpers.executeString(`
    const x = "aString";
    if ('aString' !== x){
      throw 'Failure';
    }
    `);
  });
});
