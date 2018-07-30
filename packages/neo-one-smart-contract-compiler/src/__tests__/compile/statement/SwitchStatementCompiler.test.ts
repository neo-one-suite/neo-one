import { helpers } from '../../../__data__';

describe('SwitchStatementCompiler', () => {
  test.skip('switch - default', async () => {
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

  test.skip('switch - case', async () => {
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

  test.skip('switch - fallthrough', async () => {
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
});
