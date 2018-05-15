import { helpers } from '../../../__data__';

describe('ArrowFunctionCompiler', () => {
  test('simple arrow function', async () => {
    await helpers.executeString(`
      const foo = () => 2;
      if (foo() !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('simple argument arrow function', async () => {
    await helpers.executeString(`
      const foo = (x: number) => x;
      if (foo(2) !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('simple return arrow function', async () => {
    await helpers.executeString(`
      const foo = () => {
        return 2;
      };
      if (foo() !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('simple argument return arrow function', async () => {
    await helpers.executeString(`
      const foo = (x: number) => {
        return x;
      };
      if (foo(2) !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('capture const arrow function', async () => {
    await helpers.executeString(`
      const x = 2;
      const foo = () => {
        return x;
      };
      if (foo() !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('capture const arrow expression function', async () => {
    await helpers.executeString(`
      const x = 2;
      const foo = () => x;
      if (foo() !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('capture let arrow function', async () => {
    await helpers.executeString(`
      let x = 2;
      const foo = () => {
        return x;
      };

      if (foo() !== 2) {
        throw 'Failure';
      }

      x = 3;

      if (foo() !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('capture let arrow expression function', async () => {
    await helpers.executeString(`
      let x = 2;
      const foo = () => x

      if (foo() !== 2) {
        throw 'Failure';
      }

      x = 3;

      if (foo() !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('arrow creating arrow', async () => {
    await helpers.executeString(`
      const createFoo = (x: number) => () => x;

      if (createFoo(2)() !== 2) {
        throw 'Failure';
      }

      if (createFoo(3)() !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('arrow creating capturing arrow', async () => {
    await helpers.executeString(`
      let y = 2;
      const createFoo = (x: number) => () => x * y;

      if (createFoo(2)() !== 4) {
        throw 'Failure';
      }

      y = 3;

      if (createFoo(3)() !== 9) {
        throw 'Failure';
      }
    `);
  });

  // TODO: Add this capture. Also global this capture.
});
