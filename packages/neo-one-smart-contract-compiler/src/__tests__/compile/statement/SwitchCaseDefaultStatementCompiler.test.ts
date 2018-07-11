import { helpers } from '../../../__data__';

describe('SwitchCaseDefaultStatementCompiler', () => {
  test.skip('switch statement default', async () => {
    await helpers.executeString(`
let result = 'failure';

switch('butter'){
  case 'cheese':
    result = 'failure';
    break;
  default:
    result = 'success';
}

if(result!=='success'){
  throw 'Failure';
}
    `);
  });
  test.skip('switch statement case/break', async () => {
    await helpers.executeString(`
let result = 'failure';
let testable = 'feature';

switch(testable){
  case 'module':
    result = 'big failure';
    break;

  case 'feature':
    result = 'success';
    break;

  default:
    result = 'success';
    result = 'another big failure';
}

if(result!=='success'){
    throw 'Failure';
}
    `);
  });
  test.skip('simple case fall-thru <STRINGS>', async () => {
    await helpers.executeString(`
let result = 0;
let testable = 'feature';

switch(testable){
  case 'feature':
    result = 4;
  case 'module':
    result += 6;
    break;

  default:
    result = 'failure';
}

if(result!==10){
    throw 'Failure';
}
    `);
  });
  test.skip('simple case fall-thru <NUMBERS>', async () => {
    await helpers.executeString(`
let result = 0;
let testable = 3;

switch(testable){
  case 4:
  result += 6;
  break;

  case 3:
    result = 4;
  default:
    result += 1;
}

if(result!==5){
    throw 'Failure';
}
    `);
  });
});
