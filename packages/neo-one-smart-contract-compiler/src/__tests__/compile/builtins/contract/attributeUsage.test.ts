import { helpers } from '../../../../__data__';

describe('AttributeUsage', () => {
  test('properties', async () => {
    await helpers.executeString(`
      import { AttributeUsage } from '@neo-one/smart-contract';
      const x = AttributeUsage;
      assertEqual(AttributeUsage.HighPriority, 0x01);
      assertEqual(x.HighPriority, 0x01);
    `);
  });
});
