import { helpers } from '../../../__data__';

describe('SwitchStatementCompiler', () => {
  test('switch - default', async () => {
    await helpers.executeString(`
      let result: string | undefined;
      const value: string = 'butter';

      switch(value) {
        case 'cheese':
          result = 'failure';
          break;
        default:
          result = 'success';
      }

      if (result !== 'success') {
        throw 'Failure';
      }
    `);
  });

  test('switch - case', async () => {
    await helpers.executeString(`
      let result: string | undefined;
      const value: string = 'cheese';

      switch(value) {
        case 'cheese':
          result = 'success';
          break;
        default:
          result = 'failure';
      }

      if (result !== 'success') {
        throw 'Failure';
      }
    `);
  });

  test('switch - fallthrough', async () => {
    await helpers.executeString(`
      let result: string | undefined;
      const value: string = 'cheese';

      switch(value) {
        case 'cheese':
        case 'swiss':
          result = 'success';
          break;
        default:
          result = 'failure';
      }

      if (result !== 'success') {
        throw 'Failure';
      }
    `);
  });

  test('switch', async () => {
    await helpers.executeString(`
      const x: number = 1;
      let result: string;
      switch (x) {
        case 0:
          result = 'a';
          break;
        case 1:
        case 2:
          result = 'b';
          break;
        default:
          result = 'c';
      }

      assertEqual(result, 'b');
    `);
  });

  test('weird switch', async () => {
    await helpers.executeString(`
      const x: number = 1;
      let result: string;
      switch (x) {
        case 0:
          result = 'a';
          break;
        default:
        case 2:
          result = 'b';
          break;
      }

      assertEqual(result, 'b');
    `);
  });

  test('also weird switch', async () => {
    await helpers.executeString(`
      const x: number = 3;
      let result: string;
      switch (x) {
        case 0:
          result = 'a';
          break;
        default:
        case 2:
          result = 'b';
          break;
        case 3:
          result = 'c'
          break;
      }

      assertEqual(result, 'c');
    `);
  });
});
