import { helpers } from '../../../../__data__';

describe('AssetType', () => {
  test('properties', async () => {
    await helpers.executeString(`
      import { AssetType } from '@neo-one/smart-contract';

      const x = AssetType;

      assertEqual(x.Credit, 0x40);
      assertEqual(AssetType.Duty, 0x80);
      assertEqual(AssetType.Governing, 0x00);
      assertEqual(AssetType.Utility, 0x01);
      assertEqual(AssetType.Currency, 0x08);
      assertEqual(AssetType.Share, 0x90);
      assertEqual(AssetType.Invoice, 0x98);
      assertEqual(AssetType.Token, 0x60);
    `);
  });
});
