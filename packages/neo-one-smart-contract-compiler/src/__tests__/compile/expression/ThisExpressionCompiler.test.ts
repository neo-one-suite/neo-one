import { helpers } from '../../../__data__';

describe('ThisExpressionCompiler', () => {
  test.skip('basic this usage on object literal', async () => {
    await helpers.executeString(`
    const x = {
      otherThing: (x: string)=> 'A ' + x;
      thing: (x: string)=> this.otherThing(x);
    }
    if(x.thing('foo') !=='A foo'){
      throw 'Failure';
    }
    `);
  });
  test('basic this usage from a class', async () => {
    await helpers.executeString(`
    class Dohicky{
      thing = (x: string)=> this.otherThing(x);
      otherThing = (x: string)=> 'A ' + x;
    }
    const x = new Dohicky();
    if(x.thing('foo') !=='A foo'){
      throw 'Failure';
    }
    `);
  });
});
