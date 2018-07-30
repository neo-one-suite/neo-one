import { helpers } from '../../../__data__';

describe('BlockCompiler', () => {
  test('Basic Scoping', async () => {
    await helpers.executeString(`
      let thing = 'outside';

      if (thing === 'outside') {
        let thing = 'inside';

        if (thing !== 'inside') {
          throw 'Failure';
        }
      }

      if (thing !== 'outside') {
        throw 'Failure';
      }
    `);
  });
});
