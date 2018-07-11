import { helpers } from '../../../__data__';

describe('DoStatementCompiler', () => {
  test.skip('simple do-while block', async () => {
    await helpers.executeString(`
// Runs out of GAS -- "'while' is not evaluated"
var i = 0, result;
do {
  result = i;
}while(i++ < 10);

if(result!==10){
  throw 'Failure';
}
    `);
  });

  test.skip('Managed variable do-while block: Respect the "while" expression', async () => {
    await helpers.executeString(`
var i = 0;
var result;
var done = false;

do {
  i++;
  if(i==10){
    done = true;
  }else if(i>12){
    break;
  }
  result = i;
}while(!done);

if(result>11){
  throw 'While not respected';

}else if(result !==10){
  throw 'Failure';
}
        `);
  });

  test('simple do-while with break', async () => {
    await helpers.executeString(`
// Runs out of GAS -- "while is not evaluated"
var i = 0, result;
do {
  i++;
  if(i==10){
    break;
  }
  result = i;
}while(i < 10);

if(result!==9){
  throw 'Failure';
}
    `);
  });

  test.skip('simple do-while with continue', async () => {
    await helpers.executeString(`
// Runs out of GAS
var i = 0, result =  0;
do {
  if(i<5){
    continue;
  }
  result += 1;
}while(i++ < 7);
console.error(i);
if(result!==8){
  throw 'Failure';
}
      `);
  });
});
