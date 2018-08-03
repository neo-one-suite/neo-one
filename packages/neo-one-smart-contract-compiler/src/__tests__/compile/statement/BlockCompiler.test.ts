import { helpers } from '../../../__data__';

describe('BlockCompiler', () => {
  test('Basic Scoping', async () => {
    await helpers.executeString(`
      let thing = 'outside';

      if (thing === 'outside') {
        let thing = 'inside';

        assertEqual(thing, 'inside');
      }

      assertEqual(thing, 'outside');
    `);
  });
});
