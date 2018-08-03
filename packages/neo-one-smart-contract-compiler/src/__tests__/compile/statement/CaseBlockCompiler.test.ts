import { helpers } from '../../../__data__';

describe('CaseBlockCompiler', () => {
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
