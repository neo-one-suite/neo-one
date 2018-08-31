import { common } from '@neo-one/client-core';
import { helpers } from '../../../../../__data__';

describe('Hash256', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      import { Hash256 } from '@neo-one/smart-contract';
      class MyHash256 implements Hash256 {
      }
    `,
      { type: 'error' },
    );
  });

  test('Hash256.NEO', async () => {
    await helpers.executeString(`
      import { Hash256 } from '@neo-one/smart-contract';
      const x = Hash256.from('${common.NEO_ASSET_HASH}');

      Hash256.NEO;
      assertEqual(x.equals(Hash256.NEO), true);
    `);
  });

  test('Hash256.GAS', async () => {
    await helpers.executeString(`
      import { Hash256 } from '@neo-one/smart-contract';
      const x = Hash256.from('${common.GAS_ASSET_HASH}');

      Hash256.GAS;
      assertEqual(x.equals(Hash256.GAS), true);
    `);
  });
});
