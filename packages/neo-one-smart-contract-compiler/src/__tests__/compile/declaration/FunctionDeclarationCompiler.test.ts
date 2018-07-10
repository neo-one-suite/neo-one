import { helpers } from '../../../__data__';

describe('FunctionDeclarationCompiler', () => {
  test('basic function', async () => {
    await helpers.executeString(`
function addOne(x: number): number {
  return x + 1;
}

if (addOne(1) !== 2) {
  throw 'Failure';
}

if (addOne(2) !== 3) {
  throw 'Failure';
}
    `);
  });

  test('2 functions', async () => {
    await helpers.executeString(`
function addOne(x: number): number {
  return x + 1;
}

function addTwo(x: number): number {
  return x + 2;
}

function addThree(x: number): number {
  return addTwo(addOne(x));
}

if (addThree(1) !== 4) {
  throw 'Failure';
}

if (addThree(2) !== 5) {
  throw 'Failure';
}
    `);
  });

  test('recursive + outer scope bound', async () => {
    await helpers.executeString(`
let y = 0;
function addSome(x: number): number {
  if (y === 3) {
    return x;
  }

  y += 1;
  return addSome(x + 1);
}

if (addSome(1) !== 4) {
  throw 'Failure';
}

if (addSome(1) !== 1) {
  throw 'Failure';
}
    `);
  });

  test('arguments is new scope', async () => {
    await helpers.executeString(`
const x = 3;
function identity(x: number): number {
  return x;
}

if (identity(1) !== 1) {
  throw 'Failure';
}

if (identity(3) !== 3) {
  throw 'Failure';
}
    `);
  });
});
