import { helpers } from '../../../../__data__';

describe('AttributeType', () => {
  test('properties', async () => {
    await helpers.executeString(`
      import { AttributeType } from '@neo-one/smart-contract';
      const x = AttributeType;
      assertEqual(AttributeType.HighPriority, 0x01);
      assertEqual(x.HighPriority, 0x01);

      assertEqual(AttributeType.OracleResponse, 0x11);
      assertEqual(x.OracleResponse, 0x11);
    `);
  });
});
