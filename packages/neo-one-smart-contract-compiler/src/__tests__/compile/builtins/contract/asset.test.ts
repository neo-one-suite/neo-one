import { helpers } from '../../../../__data__';
import { common } from '@neo-one/client-core';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Asset', () => {
  test('properties', async () => {
    const node = await helpers.startNode();
    const asset = await node.readClient.getAsset(common.NEO_ASSET_HASH);
    await node.executeString(`
      import { Asset, Hash256, AssetType, PublicKey, Address } from '@neo-one/smart-contract';

      Asset.for(Hash256.NEO);
      const asset = Asset.for(Hash256.NEO);

      assertEqual(asset.hash, Hash256.NEO);
      assertEqual(asset.type, AssetType.Governing);
      assertEqual(asset.amount, ${helpers.getDecimal(asset.amount)});
      assertEqual(asset.available, ${helpers.getDecimal(asset.available)});
      assertEqual(asset.precision, ${asset.precision});
      assertEqual(asset.owner, PublicKey.from('${asset.owner}'));
      assertEqual(asset.admin, Address.from('${asset.admin}'));
      assertEqual(asset.issuer, Address.from('${asset.issuer}'));
      assertEqual(asset instanceof Asset, true);
    `);
  });

  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { Asset } from '@neo-one/smart-contract';

      class MyAsset implements Asset {
      }
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinImplement },
    );
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      import { Asset } from '@neo-one/smart-contract';

      const x = Asset;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
