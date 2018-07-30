import { helpers } from '../../../__data__';

describe('VoidExpressionCompiler', () => {
  test('void must be compared against undefined', async () => {
    await helpers.executeString(`
    let outer;
    let z = 1;
    const fnct = (x: number):void=>{ outer = x};
    var y = fnct(z);
    if( y!==undefined || outer !==z){
      throw 'Failure';
    }
    `);
  });
});
